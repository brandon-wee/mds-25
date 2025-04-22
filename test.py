import os
import time
import queue
import pickle
from pathlib import Path
from typing import List, Dict, Any

import av
import cv2
import numpy as np
import streamlit as st
from streamlit_webrtc import WebRtcMode, webrtc_streamer
from insightface.app import FaceAnalysis

# --------------------------
# Configuration & Directories
# --------------------------
KNOWN_FACES_DIR = "known_faces"  # Folder with images named like "Name_..."
MODEL_LARGE = "buffalo_l"
MODEL_SMALL = "buffalo_sc"
# Use GPU if available (ensure your onnxruntime-gpu is installed and CUDA is configured)
PROVIDERS = ['CUDAExecutionProvider', 'CPUExecutionProvider']
EMBEDDINGS_CACHE_DIR = "embeddings_cache"
FACE_DETECTION_SIZE = (320, 320)  # Reduced detection size for faster processing
PROCESS_EVERY_N_FRAMES = 1  # Process every Nth frame for better performance

# --------------------------
# Sidebar: Model Selection & Threshold
# --------------------------
st.sidebar.title("Model Size Face Recognition Comparison")
similarity_threshold = st.sidebar.slider("Similarity Threshold", 0.0, 1.0, 0.3, 0.05)
process_every_n_frames = st.sidebar.slider("Process every Nth frame", 1, 5, PROCESS_EVERY_N_FRAMES)
downscale_factor = st.sidebar.slider("Downscale Factor", 1.0, 4.0, 1.5, 0.5)
use_central_region = st.sidebar.checkbox("Process only central region", value=False)

# Ensure cache directory exists
os.makedirs(EMBEDDINGS_CACHE_DIR, exist_ok=True)

# --------------------------
# Optimized Model Loading
# --------------------------
@st.cache_resource
def load_face_analysis(model_name: str) -> FaceAnalysis:
    app = FaceAnalysis(name=model_name, providers=PROVIDERS)
    app.prepare(ctx_id=0, det_size=FACE_DETECTION_SIZE)
    return app

# Load both models for side-by-side comparison
with st.sidebar:
    with st.spinner("Loading models..."):
        face_app_large = load_face_analysis(MODEL_LARGE)
        face_app_small = load_face_analysis(MODEL_SMALL)
    # st.success("Models loaded successfully")

# --------------------------
# Cache for Known Face Embeddings
# --------------------------
def compute_and_cache_embeddings(app: FaceAnalysis, model_name: str, directory: str) -> tuple:
    """Compute and cache face embeddings, or load from cache if available."""
    cache_path = Path(EMBEDDINGS_CACHE_DIR) / f"{model_name}_embeddings.pkl"
    
    # Check if we have cached embeddings for this model
    if cache_path.exists():
        try:
            with open(cache_path, 'rb') as f:
                cache_data = pickle.load(f)
                # st.sidebar.success(f"Loaded {model_name} embeddings from cache")
                return cache_data['embeddings'], cache_data['names']
        except Exception as e:
            st.sidebar.warning(f"Failed to load {model_name} cache: {e}")
    
    # If no cache or cache invalid, compute embeddings
    st.sidebar.info(f"Computing {model_name} face embeddings...")
    
    known_embeddings = []
    known_names = []
    
    if not os.path.exists(directory):
        return known_embeddings, known_names
    
    # Process all images in directory
    image_files = [f for f in os.listdir(directory) 
                  if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    # Batch processing of images
    batch_size = 5
    for i in range(0, len(image_files), batch_size):
        batch = image_files[i:i+batch_size]
        batch_data = []
        
        for filename in batch:
            path = os.path.join(directory, filename)
            name = filename.split('_')[0]
            img = cv2.imread(path)
            if img is not None:
                batch_data.append((img, name))
        
        # Process images
        for img, name in batch_data:
            faces = app.get(img)
            if faces:
                face = faces[0]
                emb = face.normed_embedding if hasattr(face, "normed_embedding") else face.embedding
                emb = emb.flatten()
                known_embeddings.append(emb)
                known_names.append(name)
    
    # Average embeddings for each person
    if known_names:
        avg_embeddings = {}
        for name, emb in zip(known_names, known_embeddings):
            avg_embeddings.setdefault(name, []).append(emb)
        
        final_embeddings = []
        final_names = []
        for name, emb_list in avg_embeddings.items():
            avg_emb = np.mean(emb_list, axis=0)
            norm = np.linalg.norm(avg_emb)
            if norm > 0:
                avg_emb = avg_emb / norm
            final_embeddings.append(avg_emb)
            final_names.append(name)
        
        # Cache the results
        cache_data = {
            'embeddings': final_embeddings,
            'names': final_names
        }
        try:
            with open(cache_path, 'wb') as f:
                pickle.dump(cache_data, f)
            st.sidebar.success(f"Cached {model_name} embeddings for future use")
        except Exception as e:
            st.sidebar.warning(f"Failed to cache {model_name} embeddings: {e}")
        
        return final_embeddings, final_names
    
    return [], []

# Compute or load embeddings for both models
with st.sidebar:
    with st.spinner("Loading embeddings..."):
        known_embeddings_large, known_names_large = compute_and_cache_embeddings(
            face_app_large, MODEL_LARGE, KNOWN_FACES_DIR
        )
        known_embeddings_small, known_names_small = compute_and_cache_embeddings(
            face_app_small, MODEL_SMALL, KNOWN_FACES_DIR
        )

# --------------------------
# Optimized Processor Class
# --------------------------
class FaceRecognitionProcessor:
    def __init__(self, face_app, known_embeddings, known_names, similarity_threshold: float, 
                result_queue: queue.Queue, process_every_n: int, downscale: float,
                use_central_region: bool):
        self.face_app = face_app
        self.known_embeddings = known_embeddings
        self.known_names = known_names
        self.similarity_threshold = similarity_threshold
        self.result_queue = result_queue
        self.process_every_n = process_every_n
        self.downscale = downscale
        self.use_central_region = use_central_region
        self.frame_count = 0
        self.prev_time = None  # For FPS calculation
        self.recent_fps = []  # Track recent FPS values for smoothing

    def process_frame(self, frame: av.VideoFrame) -> av.VideoFrame:
        # Increment frame counter
        self.frame_count += 1
        
        # Convert frame to a BGR image (numpy array)
        img = frame.to_ndarray(format="bgr24")
        h, w = img.shape[:2]
        detections = []  # To store detected face info
        
        # Measure time for FPS calculation
        current_time = time.time()
        fps = 0.0
        if self.prev_time is not None:
            dt = current_time - self.prev_time
            if dt > 0:
                fps = 1.0 / dt
                self.recent_fps.append(fps)
                if len(self.recent_fps) > 5:  # Keep only recent 5 values
                    self.recent_fps.pop(0)
        self.prev_time = current_time
        
        # Only process every Nth frame to improve performance
        if self.frame_count % self.process_every_n == 0:
            # Downscale image for faster processing
            if self.downscale > 1.0:
                proc_img = cv2.resize(img, (int(w/self.downscale), int(h/self.downscale)))
            else:
                proc_img = img
            
            # Process only central region if enabled
            if self.use_central_region:
                ph, pw = proc_img.shape[:2]
                # Extract center region (60% of image)
                margin_h, margin_w = int(ph * 0.2), int(pw * 0.2)
                central_img = proc_img[margin_h:ph-margin_h, margin_w:pw-margin_w]
                faces = self.face_app.get(central_img)
                # Adjust bounding box coordinates to original image space
                scale_h, scale_w = h / (ph - 2*margin_h), w / (pw - 2*margin_w)
                
                for face in faces:
                    bbox = face.bbox.astype(int)
                    # Adjust coordinates to full image space
                    bbox[0] = int(bbox[0] * scale_w + margin_w * (w / pw))
                    bbox[1] = int(bbox[1] * scale_h + margin_h * (h / ph))
                    bbox[2] = int(bbox[2] * scale_w + margin_w * (w / pw))
                    bbox[3] = int(bbox[3] * scale_h + margin_h * (h / ph))
                    face.bbox = bbox
            else:
                # Process the entire image
                faces = self.face_app.get(proc_img)
                # Adjust bounding boxes if downscaling was applied
                if self.downscale > 1.0:
                    for face in faces:
                        face.bbox = face.bbox * self.downscale
            
            # Process detected faces
            for face in faces:
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), min(w-1, bbox[2]), min(h-1, bbox[3])
                
                # Get embedding
                emb = face.normed_embedding if hasattr(face, "normed_embedding") else face.embedding
                emb = emb.flatten()
                
                # Compare to known faces
                identity = "Unknown"
                best_sim = -1.0
                if self.known_embeddings:
                    # Vectorized comparison for speed
                    similarities = np.dot(self.known_embeddings, emb)
                    if len(similarities) > 0:
                        best_idx = np.argmax(similarities)
                        best_sim = similarities[best_idx]
                        identity = self.known_names[best_idx] if best_sim >= self.similarity_threshold else "Unknown"
                
                # Draw bounding box and label on the image
                color = (0, 255, 0) if identity != "Unknown" else (0, 0, 255)
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                cv2.putText(img, identity, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                detections.append({"Face": identity, "Similarity": round(best_sim, 2)})
            
        # Package results (FPS and detections) into a dictionary and push to the result queue
        result = {"fps": np.mean(self.recent_fps) if self.recent_fps else fps, "detections": detections}
        try:
            self.result_queue.put_nowait(result)  # Non-blocking put
        except queue.Full:
            pass  # Skip if queue is full
        
        return av.VideoFrame.from_ndarray(img, format="bgr24")

# --------------------------
# Create Result Queues & Processor Instances
# --------------------------
result_queue_large = queue.Queue(maxsize=10)  # Bounded queue
result_queue_small = queue.Queue(maxsize=10)  # Bounded queue

processor_large = FaceRecognitionProcessor(
    face_app=face_app_large,
    known_embeddings=known_embeddings_large,
    known_names=known_names_large,
    similarity_threshold=similarity_threshold,
    result_queue=result_queue_large,
    process_every_n=process_every_n_frames,
    downscale=downscale_factor,
    use_central_region=use_central_region
)

processor_small = FaceRecognitionProcessor(
    face_app=face_app_small,
    known_embeddings=known_embeddings_small,
    known_names=known_names_small,
    similarity_threshold=similarity_threshold,
    result_queue=result_queue_small,
    process_every_n=process_every_n_frames,
    downscale=downscale_factor,
    use_central_region=use_central_region
)

# --------------------------
# Layout: Two Side-by-Side Video Streams
# --------------------------
col1, col2 = st.columns(2)
with col1:
    st.subheader("Baseline Model")
    webrtc_ctx_large = webrtc_streamer(
        key="face-recognition-large",
        mode=WebRtcMode.SENDRECV,
        video_frame_callback=processor_large.process_frame,
        media_stream_constraints={"video": True, "audio": False},
        async_processing=True,
    )
    fps_placeholder_large = st.empty()
    table_placeholder_large = st.empty()

with col2:
    st.subheader("Downsized Model")
    webrtc_ctx_small = webrtc_streamer(
        key="face-recognition-small",
        mode=WebRtcMode.SENDRECV,
        video_frame_callback=processor_small.process_frame,
        media_stream_constraints={"video": True, "audio": False},
        async_processing=True,
    )
    fps_placeholder_small = st.empty()
    table_placeholder_small = st.empty()

# --------------------------
# Display Detected Faces and FPS for Both Streams
# --------------------------
if st.checkbox("Show Detected Data (Faces & FPS)", value=True):
    while True:
        # Process large-model results
        try:
            result_large = result_queue_large.get(timeout=0.1)
            fps_large = result_large.get("fps", 0)
            detections_large = result_large.get("detections", [])
            fps_placeholder_large.markdown(f"**FPS: {fps_large:.2f}**")
            table_placeholder_large.table(detections_large)
        except queue.Empty:
            pass

        # Process small-model results
        try:
            result_small = result_queue_small.get(timeout=0.1)
            fps_small = result_small.get("fps", 0)
            detections_small = result_small.get("detections", [])
            fps_placeholder_small.markdown(f"**FPS: {fps_small:.2f}**")
            table_placeholder_small.table(detections_small)
        except queue.Empty:
            pass

        time.sleep(0.1)

# If checkbox is not checked, add an explanation
else:
    st.info("Check 'Show Detected Data' to view faces and FPS metrics.")
    
# Add an expander with optimization information
with st.expander("Optimization Information"):
    st.markdown("""
    This optimized version includes:
    - Reduced face detection size (320x320 instead of 640x640)
    - Embedding caching to avoid reprocessing images
    - Frame skipping (processing every Nth frame)
    - Image downscaling for faster processing
    - Optional central region processing
    - Bounded result queues to prevent memory issues
    - Vectorized face comparison for speed
    - FPS smoothing for stable metrics
    
    Adjust the sidebar parameters to find the optimal balance between speed and accuracy.
    """)
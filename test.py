import os
import time
import queue
from pathlib import Path
from typing import List

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
MODEL_SMALL = "buffalo_s"
# Use GPU if available (ensure your onnxruntime-gpu is installed and CUDA is configured)
PROVIDERS = ['CUDAExecutionProvider', 'CPUExecutionProvider']

# --------------------------
# Sidebar: Model Selection & Threshold
# --------------------------
st.sidebar.title("Buffalo Face Recognition Comparison")
similarity_threshold = st.sidebar.slider("Similarity Threshold", 0.0, 1.0, 0.3, 0.05)

# --------------------------
# Caching the FaceAnalysis Model
# --------------------------
@st.cache_resource
def load_face_analysis(model_name: str) -> FaceAnalysis:
    app = FaceAnalysis(name=model_name, providers=PROVIDERS)
    app.prepare(ctx_id=0, det_size=(640, 640))
    return app

# Instantiate separate models for large and small
face_app_large = load_face_analysis(MODEL_LARGE)
face_app_small = load_face_analysis(MODEL_SMALL)

# --------------------------
# Load Known Faces
# --------------------------
def load_known_faces(app: FaceAnalysis, directory: str):
    known_embeddings = []
    known_names = []
    
    if not os.path.exists(directory):
        return known_embeddings, known_names
    
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            path = os.path.join(directory, filename)
            # Assumes the file is named like "Name_xxx.jpg"
            name = filename.split('_')[0]
            img = cv2.imread(path)
            if img is None:
                continue
            faces = app.get(img)
            if not faces:
                continue
            face = faces[0]
            emb = face.normed_embedding if hasattr(face, "normed_embedding") else face.embedding
            emb = emb.flatten()
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            known_embeddings.append(emb)
            known_names.append(name)
    
    # Average embeddings for a given person if multiple images exist.
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
        return final_embeddings, final_names
    
    return [], []

known_embeddings_large, known_names_large = load_known_faces(face_app_large, KNOWN_FACES_DIR)
known_embeddings_small, known_names_small = load_known_faces(face_app_small, KNOWN_FACES_DIR)

# --------------------------
# Processor Class to Maintain State (FPS calculation, detections)
# --------------------------
class FaceRecognitionProcessor:
    def __init__(self, face_app, known_embeddings, known_names, similarity_threshold: float, result_queue: queue.Queue):
        self.face_app = face_app
        self.known_embeddings = known_embeddings
        self.known_names = known_names
        self.similarity_threshold = similarity_threshold
        self.result_queue = result_queue
        self.prev_time = None  # For FPS calculation

    def process_frame(self, frame: av.VideoFrame) -> av.VideoFrame:
        # Measure time for FPS calculation
        current_time = time.time()
        fps = 0.0
        if self.prev_time is not None:
            dt = current_time - self.prev_time
            if dt > 0:
                fps = 1.0 / dt
        self.prev_time = current_time

        # Convert frame to a BGR image (numpy array)
        img = frame.to_ndarray(format="bgr24")
        detections = []  # To store detected face info
        
        # Run face detection/recognition
        faces = self.face_app.get(img)
        for face in faces:
            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
            
            # Compute and normalize face embedding
            emb = face.normed_embedding if hasattr(face, "normed_embedding") else face.embedding
            emb = emb.flatten()
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            
            # Compare to known faces
            identity = "Unknown"
            best_sim = -1.0
            if self.known_embeddings:
                for known_name, known_emb in zip(self.known_names, self.known_embeddings):
                    sim = float(np.dot(emb, known_emb))
                    if sim > best_sim:
                        best_sim = sim
                        identity = known_name if sim >= self.similarity_threshold else "Unknown"
            
            # Draw bounding box and label on the image
            color = (0, 255, 0) if identity != "Unknown" else (0, 0, 255)
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            cv2.putText(img, identity, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            detections.append({"Face": identity, "Similarity": round(best_sim, 2)})
        
        # Package results (FPS and detections) into a dictionary and push to the result queue
        result = {"fps": fps, "detections": detections}
        self.result_queue.put(result)
        
        return av.VideoFrame.from_ndarray(img, format="bgr24")

# --------------------------
# Create Separate Result Queues & Processor Instances
# --------------------------
result_queue_large = queue.Queue()
result_queue_small = queue.Queue()

processor_large = FaceRecognitionProcessor(
    face_app_large, known_embeddings_large, known_names_large, similarity_threshold, result_queue_large
)
processor_small = FaceRecognitionProcessor(
    face_app_small, known_embeddings_small, known_names_small, similarity_threshold, result_queue_small
)

# --------------------------
# Layout: Two Side-by-Side Video Streams
# --------------------------
col1, col2 = st.columns(2)
with col1:
    st.subheader("Buffalo Large Model")
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
    st.subheader("Buffalo Small Model")
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
    # Loop to update the detection tables. Note: This loop runs until the streams stop.
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

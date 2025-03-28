import os
import cv2
import numpy as np
import streamlit as st
from insightface.app import FaceAnalysis
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase

# Configuration
KNOWN_FACES_DIR = "known_faces"
MODEL_NAME = 'buffalo_l'
PROVIDERS = ['CUDAExecutionProvider', 'CPUExecutionProvider']

# Set Streamlit theme and page configuration
st.set_page_config(
    page_title="AI Surveillance Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown(
    """
    <style>
    :root {
        --primary: #2E86C1;
        --secondary: #F4D03F;
        --background: #1B2631;
    }
    
    body { 
        background-color: var(--background); 
        color: white;
        font-family: 'Arial', sans-serif;
    }
    
    .title { 
        text-align: center; 
        color: var(--secondary);
        font-size: 2.5em;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
    
    .card {
        background: rgba(25, 35, 45, 0.9);
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .stButton>button {
        background: linear-gradient(45deg, var(--primary), var(--secondary)) !important;
        color: black !important;
        border-radius: 8px;
        font-weight: bold;
        transition: transform 0.2s;
    }
    
    .stButton>button:hover {
        transform: scale(1.05);
    }
    
    .success { color: #2ECC71 !important; }
    .warning { color: #F1C40F !important; }
    .error { color: #E74C3C !important; }
    </style>
    """,
    unsafe_allow_html=True
)

class FaceRecognitionTransformer(VideoTransformerBase):
    def __init__(self):
        super().__init__()
        # Initialize face analysis model
        self.app = FaceAnalysis(name=MODEL_NAME, providers=PROVIDERS)
        self.app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Load and process known faces
        self.known_embeddings, self.known_names = self._load_known_faces()
    
    def _load_known_faces(self):
        known_embeddings = []
        known_names = []
        
        if not os.path.exists(KNOWN_FACES_DIR):
            return [], []
            
        for filename in os.listdir(KNOWN_FACES_DIR):
            if filename.lower().endswith(('.jpg', '.png', '.jpeg')):
                path = os.path.join(KNOWN_FACES_DIR, filename)
                name = filename.split('_')[0]
                
                img = cv2.imread(path)
                if img is None:
                    continue
                
                faces = self.app.get(img)
                if len(faces) == 0:
                    continue
                
                face = faces[0]
                emb = face.normed_embedding if hasattr(face, 'normed_embedding') else face.embedding
                emb = emb.flatten()
                norm = np.linalg.norm(emb)
                if norm > 0:
                    emb = emb / norm
                
                known_embeddings.append(emb)
                known_names.append(name)
        
        # Average embeddings per person
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

    def transform(self, frame):
        img = frame.to_ndarray(format="bgr24")
        
        # Perform face detection
        faces = self.app.get(img)
        
        for face in faces:
            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
            
            # Get embedding
            emb = face.normed_embedding if hasattr(face, 'normed_embedding') else face.embedding
            emb = emb.flatten()
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            
            # Find best match
            identity = "Unknown"
            best_sim = -1
            
            if self.known_embeddings:
                for name, known_emb in zip(self.known_names, self.known_embeddings):
                    sim = np.dot(emb, known_emb)
                    if sim > best_sim:
                        best_sim = sim
                        identity = name
                
                if best_sim < 0.3:
                    identity = "Unknown"
            
            # Draw annotations
            color = (0, 255, 0) if identity != "Unknown" else (0, 0, 255)
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            cv2.putText(img, identity, (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        
        return img
    
# Sidebar Configuration
with st.sidebar:
    st.title("🛡️ MDS25: AI Surveillance")
    st.markdown("---")
    st.subheader("Team Members:")
    st.markdown("""
    - **Yousuf** 
    - **Edison** 
    - **Shadman** 
    - **Brandon** 
    """)
    st.markdown("---")
    st.markdown("""
    ### Application Information
    - **Video Streaming**: streamlit-webrtc
    """)
    
st.markdown("<h1 class='title'>Hybrid Edge-Cloud AI Surveillance</h1>", unsafe_allow_html=True)
st.markdown("<h3 style='text-align: center; color: #85C1E9;'>Real-Time Face Recognition</h3>", unsafe_allow_html=True)

st.markdown("<div class='card'>", unsafe_allow_html=True)
st.subheader("📹 Live Recognition Feed")
webrtc_streamer(
    key="face-recognition",
    video_transformer_factory=FaceRecognitionTransformer,
    rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}
)
st.markdown("</div>", unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #7F8C8D;">
    🔒 <strong>AI Surveillance System</strong> | MDS25 | © 2025 | 
    <a href="#" style="color: #7F8C8D;">Privacy Policy</a>
</div>
""", unsafe_allow_html=True)
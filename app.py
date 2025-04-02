import os
import cv2
import numpy as np
import streamlit as st
from insightface.app import FaceAnalysis
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase
from models import SmallFaceRecognitionTransformer, FaceRecognitionTransformer


KNOWN_FACES_DIR = "known_faces"
MODEL_NAME = "buffalo_l"
SMALL_MODEL_NAME = "buffalo_s"
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
    rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
    media_stream_constraints={"video": True, "audio": False},
)

webrtc_streamer(
    key="small-face-recognition",
    video_transformer_factory=SmallFaceRecognitionTransformer,
    rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
    media_stream_constraints={"video": True, "audio": False},
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
import os
import cv2
import numpy as np
import streamlit as st
from insightface.app import FaceAnalysis
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase
from models import SmallFaceRecognitionTransformer, FaceRecognitionTransformer

# Constants
KNOWN_FACES_DIR = "known_faces"
MODEL_NAME = "buffalo_l"
SMALL_MODEL_NAME = "buffalo_s"
PROVIDERS = ['CUDAExecutionProvider', 'CPUExecutionProvider']

# Streamlit Config
st.set_page_config(
    page_title="AI Surveillance Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
    <style>
    :root {
        --primary: #2E86C1;
        --secondary: #F4D03F;
        --background: #1B2631;
    }

    body {
        background-color: var(--background);
        color: white;
        font-family: 'Segoe UI', sans-serif;
    }

    .title {
        text-align: center;
        color: var(--secondary);
        font-size: 3em;
        margin-bottom: 0.2em;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
    }

    .subtitle {
        text-align: center;
        color: #AED6F1;
        font-size: 1.5em;
        margin-top: -10px;
        margin-bottom: 30px;
    }

    .card {
        background: rgba(44, 62, 80, 0.95);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        margin-bottom: 2rem;
    }

    .stButton>button {
        background: linear-gradient(45deg, var(--primary), var(--secondary)) !important;
        color: black !important;
        font-weight: bold;
        border-radius: 10px;
        padding: 0.5rem 1rem;
        transition: all 0.2s ease-in-out;
    }

    .stButton>button:hover {
        transform: scale(1.05);
    }

    .footer {
        text-align: center;
        color: #7F8C8D;
        margin-top: 2rem;
    }

    .footer a {
        color: #7F8C8D;
        text-decoration: none;
    }

    </style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.title("🛡️ MDS25 Surveillance")
    st.markdown("---")
    st.subheader("👥 Team Members")
    st.markdown("""
    - **Yousuf**  
    - **Edison**  
    - **Shadman**  
    - **Brandon**
    """)
    st.markdown("---")
    st.subheader("🧾 Info")
    st.markdown("- **Video Streaming**: streamlit-webrtc")
    st.markdown("- **Model**: InsightFace (buffalo_l / buffalo_s)")

# Title Section
st.markdown("<div class='title'>Hybrid Edge-Cloud AI Surveillance</div>", unsafe_allow_html=True)
st.markdown("<div class='subtitle'>Real-Time Face Detection & Recognition System</div>", unsafe_allow_html=True)

# Recognition Feed
st.markdown("<div class='card'>", unsafe_allow_html=True)
st.subheader("📹 Live Face Recognition Feed (Standard Model)")
webrtc_streamer(
    key="face-recognition",
    video_processor_factory=FaceRecognitionTransformer,
    frontend_rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
    media_stream_constraints={"video": True, "audio": False},
)

st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='card'>", unsafe_allow_html=True)
st.subheader("📦 Lightweight Model for Edge Devices")
webrtc_streamer(
    key="small-face-recognition",
    video_processor_factory=SmallFaceRecognitionTransformer,
    frontend_rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
    media_stream_constraints={"video": True, "audio": False},
)
st.markdown("</div>", unsafe_allow_html=True)

# Footer
st.markdown("""
<hr>
<div class="footer">
    🔒 <strong>AI Surveillance System</strong> | Team MDS25 | © 2025<br>
    <a href="#">Privacy Policy</a>
</div>
""", unsafe_allow_html=True)

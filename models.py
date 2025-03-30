import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from streamlit_webrtc import webrtc_streamer, VideoTransformerBase

# Configuration
KNOWN_FACES_DIR = "known_faces"
MODEL_NAME = "buffalo_l"
SMALL_MODEL_NAME = "buffalo_s"
PROVIDERS = ['CUDAExecutionProvider', 'CPUExecutionProvider']


class SmallFaceRecognitionTransformer(VideoTransformerBase):
    def __init__(self):
        super().__init__()
        # Initialize face analysis model
        self.app = FaceAnalysis(name=SMALL_MODEL_NAME, providers=PROVIDERS)
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
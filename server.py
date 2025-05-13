from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

import cv2
import numpy as np
import pickle
from insightface.app import FaceAnalysis
from typing import List

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ——————————————————————————————————————————————————
# ▶️▶️▶️ NEW: load your recognition model + known embeddings at startup
# ——————————————————————————————————————————————————
MODEL_NAME = "buffalo_quantized_dynamic_v1"
EMB_CACHE_PATH = "embeddings_cache/buffalo_quantized_dynamic_v1_embeddings.pkl"
SIM_THRESHOLD = 0.3


def load_server_embeddings(cache_path):
    with open(cache_path, "rb") as f:
        data = pickle.load(f)
    return data["embeddings"], data["names"]


# Load FaceAnalysis once
face_app: FaceAnalysis = FaceAnalysis(name=MODEL_NAME)
face_app.prepare(ctx_id=0, det_size=(320, 320))

# Load known embeddings/names
known_embeddings, known_names = load_server_embeddings(EMB_CACHE_PATH)

# In-memory store of last frame+meta
latest_frame: bytes | None = None
latest_meta: dict[str, any] = {}


def calculate_average_face_embedding(images: List[np.ndarray]) -> np.ndarray:
    """
    Calculate the average face embedding from a list of images.
    
    Args:
        images: List of numpy arrays containing images
        
    Returns:
        np.ndarray: The average face embedding vector or None if no faces found
    """
    if not images or len(images) == 0:
        return None
        
    all_embeddings = []
    
    # Process each image and extract face embeddings
    for img in images:
        faces = face_app.get(img)
        if faces:
            # Get the embedding from the first detected face
            emb = faces[0].normed_embedding.flatten()
            all_embeddings.append(emb)
    
    # If no faces were detected in any image, return None
    if not all_embeddings:
        return None
        
    # Calculate the average embedding
    avg_embedding = np.mean(all_embeddings, axis=0)
    
    # Normalize the average embedding
    norm = np.linalg.norm(avg_embedding)
    if norm > 0:
        avg_embedding = avg_embedding / norm
        
    return avg_embedding


@app.post("/upload")
async def upload(
    frame: UploadFile = File(...),
    metadata: str = Form(...)
):
    global latest_frame, latest_meta

    # 1) Read in the frame and original metadata
    latest_frame = await frame.read()
    meta = json.loads(metadata)

    # 2) Decode JPEG → OpenCV image
    arr = np.frombuffer(latest_frame, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    # 3) For each bounding box, crop & recognize
    new_bboxes = []
    for box in meta.get("bboxes", []):
        x1, y1, x2, y2 = box
        crop = img[y1:y2, x1:x2]
        faces = face_app.get(crop)
        best_sim = 0
        if faces:
            emb = faces[0].normed_embedding.flatten()
            sims = np.dot(known_embeddings, emb)
            best_idx = int(np.argmax(sims))
            best_sim = float(sims[best_idx])
            name = known_names[best_idx] if best_sim >= SIM_THRESHOLD else "Unknown"
        else:
            name = "NoFaceDetected"

        # Append identity to the box
        new_bboxes.append([x1, y1, x2, y2, name, best_sim])

    # 4) Overwrite metadata's boxes
    meta["bboxes"] = new_bboxes

    # Optional: log to file
    with open("logs.txt", "a") as logf:
        logf.write(json.dumps(meta) + "\n")

    latest_meta = meta
    return {"status": "recognized", "meta": meta}


@app.post("/calculate_average_embedding")
async def calculate_average_embedding(
    files: List[UploadFile] = File(...)
):
    """
    API endpoint to calculate an average face embedding from multiple uploaded images.
    
    Args:
        files: List of uploaded image files
        
    Returns:
        Dictionary containing the average embedding or an error message
    """
    try:
        # Read and decode all the uploaded images
        images = []
        for file in files:
            content = await file.read()
            arr = np.frombuffer(content, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            images.append(img)
        
        # Calculate the average embedding
        avg_embedding = calculate_average_face_embedding(images)
        
        if avg_embedding is not None:
            # Convert numpy array to list for JSON serialization
            return {
                "status": "success", 
                "embedding": avg_embedding.tolist(),
                "count": len(images)
            }
        else:
            return {"status": "error", "message": "No faces detected in any of the images"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def mjpeg_generator():
    global latest_frame, latest_meta
    while True:
        if latest_frame:
            # 1) decode
            arr = np.frombuffer(latest_frame, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            # 2) draw boxes + names
            for box in latest_meta.get("bboxes", []):
                x1, y1, x2, y2, name, sim = box
                # box
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                # name
                cv2.putText(
                    img, name,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8, (0, 255, 0), 2
                )

            # 3) re-encode
            _, jpeg = cv2.imencode('.jpg', img)
            frame = jpeg.tobytes()

            # 4) yield
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" +
                frame +
                b"\r\n"
            )

        await asyncio.sleep(0.05)


@app.get("/video_feed")
def video_feed():
    """
    Clients can point an <img> tag or fetch this URL
    and get a multipart/x-mixed-replace MJPEG stream.
    """
    return StreamingResponse(
        mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/metadata")
def metadata():
    """
    Returns the latest metadata as JSON:
      { "fps": ..., "people_count": ..., ... }
    """
    return JSONResponse(content=latest_meta)


# from flask import Flask, request
# import os
# import time

# app = Flask(__name__)

# SAVE_DIR = "received_images"
# if not os.path.exists(SAVE_DIR):
#     os.makedirs(SAVE_DIR)


# @app.route('/upload', methods=['POST'])
# def upload_image():
#     img_data = request.data
#     if img_data:
#         filename = os.path.join(SAVE_DIR, f"frame_{int(time.time()*1000)}.jpg")
#         with open(filename, "wb") as f:
#             f.write(img_data)
#         print(f"Saved image: {filename}")
#         return "Image received", 200
#     else:
#         print(f'No image: Bruh')
#         return "No image data", 400


# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)
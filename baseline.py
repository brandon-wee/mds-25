import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis

# Configuration
KNOWN_FACES_DIR = "known_faces"  # folder containing known face images
MODEL_NAME = 'buffalo_s'         # InsightFace model pack: 'buffalo_l' (default) or 'buffalo_s' for faster, etc.
PROVIDERS = ['CUDAExecutionProvider', 'CPUExecutionProvider']  # GPU if available, else CPU

# Initialize InsightFace model (face detector + recognizer)
app = FaceAnalysis(name=MODEL_NAME, providers=PROVIDERS)
app.prepare(ctx_id=0, det_size=(640, 640))
# ctx_id=0 uses GPU 0 if available; on CPU-only systems, it will fallback to CPU due to providers setting.
# det_size=(640,640) is the size for face detection, can adjust for speed vs accuracy.

# Load and encode known faces
known_embeddings = []  # list of embedding vectors (normalized)
known_names = []       # list of corresponding names

for file_name in os.listdir(KNOWN_FACES_DIR):
    if file_name.lower().endswith(('.jpg', '.png', '.jpeg')):
        img_path = os.path.join(KNOWN_FACES_DIR, file_name)
        name = file_name.split('_')[0]  # extract the label/name before the first underscore
        # Read the image
        img = cv2.imread(img_path)
        if img is None:
            continue  # skip if image not readable
        # Get face and embedding
        faces = app.get(img)
        if len(faces) == 0:
            print(f"Warning: No face found in {file_name}, skipping this image.")
            continue
        # If multiple faces detected, optionally skip or take the largest face
        face = faces[0]  # take the first face (highest confidence)
        # Use the normalized embedding (L2 normed vector of length 512)
        emb = face.normed_embedding  if hasattr(face, 'normed_embedding') else face.embedding
        emb = emb.flatten()  # ensure it's a 1D numpy array
        # Store the embedding and name
        known_embeddings.append(emb)
        known_names.append(name)

# If there are multiple images of the same person, average their embeddings for a single representative
# We can compute an average for each name and replace entries accordingly
if known_names:
    avg_embeddings = {}
    for name, emb in zip(known_names, known_embeddings):
        avg_embeddings.setdefault(name, []).append(emb)
    # Now average and normalize
    known_embeddings = []
    known_names = []
    for name, emb_list in avg_embeddings.items():
        # Compute average embedding
        avg_emb = np.mean(np.vstack(emb_list), axis=0)
        # L2 normalize the averaged embedding
        norm = np.linalg.norm(avg_emb)
        if norm > 0:
            avg_emb = avg_emb / norm
        known_embeddings.append(avg_emb)
        known_names.append(name)
    print(f"Loaded {len(known_names)} individuals from {KNOWN_FACES_DIR}")
else:
    print("No known faces found. Please add images to the known faces directory.")
    # If no known faces, we can exit or proceed with only unknown identification.

# Start webcam video capture
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit(1)

print("Starting video stream... Press 'q' to quit.")
while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame. Exiting...")
        break

    # Perform face detection and get face embeddings for the frame
    faces = app.get(frame)
    # Loop over detected faces
    for face in faces:
        bbox = face.bbox.astype(int)  # bounding box coordinates (x1, y1, x2, y2)
        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        # Get the embedding for this face
        emb = face.normed_embedding if hasattr(face, 'normed_embedding') else face.embedding
        emb = emb.flatten()
        # Normalize the embedding (just in case it's not already normalized)
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm

        # Identify the face by finding the closest known face (highest cosine similarity)
        identity = "Unknown"
        best_sim = -1  # highest similarity score
        for known_name, known_emb in zip(known_names, known_embeddings):
            # Compute cosine similarity as dot product (since embeddings are normalized)
            sim = np.dot(emb, known_emb)
            if sim > best_sim:
                best_sim = sim
                identity = known_name
        # Threshold for recognition: require similarity above 0.3 to confirm identity
        if best_sim < 0.3:
            identity = "Unknown"

        # Draw bounding box and name on the frame
        color = (0, 255, 0) if identity != "Unknown" else (0, 0, 255)  # green for known, red for unknown
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        # Text label (display name and maybe similarity)
        label = f"{identity}" if identity == "Unknown" else f"{identity}"
        # Position the label above the top-left corner of the face rectangle
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    # Show the annotated frame in a window
    cv2.imshow("Face Recognition", frame)
    # Exit on 'q' key
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up resources
cap.release()
cv2.destroyAllWindows()

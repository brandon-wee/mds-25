"use client";

import { updateUserEmbeddings } from "@/app/lib/actions";
import styles from "./embeddingUpdate.module.css";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

const EmbeddingUpdate = ({ user }) => {
  const [images, setImages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Handle camera activation
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStatus({ error: true, message: "Could not access camera. Please check permissions." });
    }
  };

  // Stop camera when component unmounts or camera is deactivated
  const stopCamera = () => {
    if (cameraActive && videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture image from camera
  const captureImage = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
        setImages(prev => [...prev, file]);
      }
    });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
    }
  };

  // Remove an image from the list
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit the form with images to update embeddings
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      setStatus({ error: true, message: "Please add at least one image" });
      return;
    }

    setStatus({ loading: true, message: "Updating embeddings..." });
    
    const formData = new FormData();
    formData.append("userId", user.id);
    images.forEach(image => {
      formData.append("images", image);
    });
    
    try {
      const result = await updateUserEmbeddings(formData);
      
      if (result.success) {
        setStatus({ success: true, message: result.message });
        setImages([]);
      } else {
        setStatus({ error: true, message: result.message });
      }
    } catch (error) {
      console.error("Error updating embeddings:", error);
      setStatus({ error: true, message: "An error occurred while updating embeddings" });
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.userInfo}>
        <div className={styles.userImageContainer}>
          <Image
            src={user.img || "/noavatar.png"}
            alt={user.username}
            width={100}
            height={100}
            className={styles.userImage}
          />
        </div>
        <div className={styles.userDetails}>
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <p className={styles.embedStatus}>
            {user.embeddings?.length ? 
              `Embeddings available (${user.embeddings.length} values)` : 
              "No embeddings available"}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputSection}>
          <h3>Upload Face Images</h3>
          
          <div className={styles.uploadOptions}>
            <div className={styles.option}>
              <h4>Upload Files</h4>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                ref={fileInputRef}
                className={styles.fileInput}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className={styles.uploadButton}
              >
                Select Images
              </button>
            </div>
            
            <div className={styles.option}>
              <h4>Use Camera</h4>
              {!cameraActive ? (
                <button 
                  type="button" 
                  onClick={startCamera}
                  className={styles.cameraButton}
                >
                  Start Camera
                </button>
              ) : (
                <div className={styles.cameraContainer}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    className={styles.video}
                  ></video>
                  <div className={styles.cameraControls}>
                    <button 
                      type="button" 
                      onClick={captureImage}
                      className={styles.captureButton}
                    >
                      Capture
                    </button>
                    <button 
                      type="button" 
                      onClick={stopCamera}
                      className={styles.stopButton}
                    >
                      Stop Camera
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {images.length > 0 && (
          <div className={styles.previewSection}>
            <h3>Selected Images ({images.length})</h3>
            <div className={styles.imagePreviewContainer}>
              {images.map((image, index) => (
                <div key={index} className={styles.previewItem}>
                  <Image
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index}`}
                    width={100}
                    height={100}
                    className={styles.previewImage}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className={styles.removeButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {status && (
          <div className={`${styles.statusMessage} ${
            status.error ? styles.error : 
            status.success ? styles.success : 
            status.loading ? styles.loading : ""
          }`}>
            {status.message}
          </div>
        )}
        
        <div className={styles.formActions}>
          <button 
            type="submit" 
            disabled={images.length === 0 || status?.loading}
            className={styles.submitButton}
          >
            {status?.loading ? "Updating..." : "Update Embeddings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmbeddingUpdate;

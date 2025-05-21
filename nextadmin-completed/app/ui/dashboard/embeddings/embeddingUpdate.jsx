"use client";

import { updateUserEmbeddings } from "@/app/lib/actions";
import { processUserEmbeddings } from "@/app/lib/cloudApi";
import styles from "./embeddingUpdate.module.css";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

const EmbeddingUpdate = ({ user }) => {
  const [images, setImages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState(null);
  const [showCapturePreview, setShowCapturePreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [videoElement, setVideoElement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoContainerRef = useRef(null);
  const isMounted = useRef(true);

  // Register when the component mounts and unmounts
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, []);
  
  // Use a callback ref to ensure we have the video element
  const setVideoRef = element => {
    videoRef.current = element;
    if (element) {
      setVideoElement(element);
      console.log("Video element ref set successfully");
    }
  };
  
  // Create video element if needed - fallback method
  const ensureVideoElement = () => {
    if (videoRef.current) return videoRef.current;
    
    console.log("Video ref not available, trying to find video element in DOM");
    
    // Try to find video element by ID or within container
    const videoEl = document.querySelector('#cameraVideo') || 
                    videoContainerRef.current?.querySelector('video');
    
    if (videoEl) {
      console.log("Found video element in DOM");
      videoRef.current = videoEl;
      return videoEl;
    }
    
    // Last resort - create a video element dynamically if container exists
    if (videoContainerRef.current) {
      console.log("Creating video element dynamically");
      const newVideo = document.createElement('video');
      newVideo.id = 'cameraVideo';
      newVideo.autoplay = true;
      newVideo.playsInline = true;
      newVideo.muted = true;
      newVideo.className = styles.video;
      
      // Clear container and append new video
      videoContainerRef.current.innerHTML = '';
      videoContainerRef.current.appendChild(newVideo);
      
      videoRef.current = newVideo;
      return newVideo;
    }
    
    return null;
  };
  
  // Handle camera activation with retries
  const startCamera = async (retryCount = 0) => {
    if (!isMounted.current) return;
    
    try {
      console.log(`Attempting to start camera... (try ${retryCount + 1})`);
      setCameraError(null);
      setStatus({ info: true, message: "Activating camera..." });
      
      // Get video element - try multiple approaches
      const videoEl = videoRef.current || ensureVideoElement();
      
      if (!videoEl) {
        console.error("Cannot find or create video element");
        if (retryCount < 2) {
          console.log(`Retrying camera initialization in 500ms...`);
          setTimeout(() => startCamera(retryCount + 1), 500);
          return;
        }
        
        setCameraError("Cannot initialize video element");
        setStatus({ 
          error: true, 
          message: "Camera initialization failed: Video element not available. Please try refreshing the page."
        });
        return;
      }
      
      // Define constraints with fallbacks for different browsers
      const constraints = { 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      console.log("Requesting camera access with constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted:", stream.getVideoTracks()[0].label);
      
      // Make sure component is still mounted
      if (!isMounted.current) {
        console.log("Component unmounted, stopping camera");
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Attach stream to video element
      videoEl.srcObject = stream;
      
      // Different approach for onloadedmetadata event
      videoEl.onloadedmetadata = function() {
        if (!isMounted.current) return;
        console.log("Video metadata loaded");
        
        setTimeout(() => {
          if (!isMounted.current) return;
          try {
            if (videoEl.paused) {
              console.log("Attempting to play video");
              
              const playPromise = videoEl.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    if (!isMounted.current) return;
                    console.log("Camera playing successfully");
                    setCameraActive(true);
                    setShowCapturePreview(false);
                    setCapturedImage(null);
                    setStatus({ success: true, message: "Camera activated successfully" });
                  })
                  .catch(err => {
                    if (!isMounted.current) return;
                    console.error("Error playing video:", err);
                    setCameraError(`Play failed: ${err.message || "Unknown error"}`);
                    setStatus({ error: true, message: "Browser blocked autoplay. Try clicking the video area." });
                  });
              } else {
                if (!isMounted.current) return;
                setCameraActive(true);
                setStatus({ success: true, message: "Camera activated" });
              }
            } else {
              if (!isMounted.current) return;
              console.log("Video is already playing");
              setCameraActive(true);
              setStatus({ success: true, message: "Camera activated" });
            }
          } catch (playErr) {
            if (!isMounted.current) return;
            console.error("Error in onloadedmetadata:", playErr);
            setCameraError(`Metadata error: ${playErr.message}`);
          }
        }, 100);
      };
      
      // Add error handlers for video element
      videoEl.onerror = (event) => {
        if (!isMounted.current) return;
        console.error("Video element error:", event);
        setCameraError(`Video error: ${event.target.error?.message || "Unknown"}`);
      };
      
    } catch (err) {
      if (!isMounted.current) return;
      console.error("Error in startCamera:", err);
      
      let errorMessage = "Camera access failed";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera access denied. Please allow camera access.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No camera found on your device.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "Camera is already in use by another application.";
      } else {
        errorMessage = `Camera error: ${err.message || "Unknown error"}`;
      }
      
      setCameraError(errorMessage);
      setStatus({ error: true, message: errorMessage });
    }
  };
  
  // Stop camera safely
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    console.log("Camera stopped");
  };

  // Capture image from camera
  const captureImage = () => {
    if (!videoRef.current) return;
    
    try {
      console.log("Capturing image from camera");
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const context = canvas.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Show preview of captured image
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);
      setShowCapturePreview(true);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
          setImages(prev => [...prev, file]);
          console.log("Image captured and added to collection");
        }
      });
    } catch (err) {
      console.error("Error capturing image:", err);
      setStatus({ error: true, message: `Failed to capture image: ${err.message}` });
    }
  };

  // Confirm using captured image
  const confirmCapturedImage = () => {
    setShowCapturePreview(false);
    stopCamera();
  };

  // Retake the photo
  const retakePhoto = () => {
    setShowCapturePreview(false);
    setCapturedImage(null);
    
    // Remove the last image if it was added
    if (images.length > 0) {
      setImages(prev => prev.slice(0, -1));
    }
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

  // Submit the form with images to update embeddings using CloudAPI
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      setStatus({ error: true, message: "Please add at least one image" });
      return;
    }

    setStatus({ loading: true, message: "Calculating embeddings..." });
    
    console.log("Submitting with username:", user.username);
    console.log("Number of images:", images.length);
    
    try {
      // Use the CloudAPI service with username instead of ID
      console.log("Sending request to CloudAPI for embedding processing");
      
      // Use the username since that's what the FastAPI endpoint expects
      const result = await processUserEmbeddings(user.username, images);
      console.log("CloudAPI response:", result);
      
      if (result.status === "success") {
        console.log("CloudAPI success, updating local database with userId:", user.id || user._id);
        
        // Update our local database to store the reference to the embedding
        const updateResult = await updateUserEmbeddings({
          userId: user.id || user._id,
          embeddingUpdated: true
        });
        
        console.log("Local database update result:", updateResult);
        
        if (updateResult.success) {
          setStatus({ success: true, message: `Embeddings updated successfully! Used ${result.images} images.` });
          setImages([]);
        } else {
          setStatus({ warning: true, message: `Face data processed but database update failed: ${updateResult.message}` });
        }
      } else {
        setStatus({ error: true, message: result.message || "Face processing failed" });
      }
    } catch (error) {
      console.error("Error updating embeddings:", error);
      
      // Provide more specific error messages
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError") || error.name === "AbortError") {
        setStatus({ error: true, message: "Cannot connect to face recognition server. Is it running?" });
      } else if (error.message.includes("404")) {
        setStatus({ error: true, message: "API endpoint not found. Check server configuration." });
      } else {
        setStatus({ error: true, message: `Error: ${error.message}` });
      }
    } finally {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <h1>Face Recognition Setup</h1>
        <p className={styles.subtitle}>Upload or capture images to enable face recognition</p>
      </div>
      
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
              <span className={styles.embeddingsAvailable}>✓ Embeddings available ({user.embeddings.length} values)</span> : 
              <span className={styles.noEmbeddings}>✗ No embeddings available</span>}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputSection}>
          <h3>Face Image Collection</h3>
          <p className={styles.embedInstructions}>
            Add multiple images of your face to improve recognition accuracy.
            Try to include different angles, expressions and lighting conditions.
          </p>
          
          <div className={styles.cardContainer}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>Upload Files</h4>
                <span className={styles.cardIcon}>📁</span>
              </div>
              <div className={styles.cardContent}>
                <p>Select existing photos from your device</p>
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
                  Browse Files
                </button>
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>Use Camera</h4>
                <span className={styles.cardIcon}>📷</span>
              </div>
              <div className={styles.cardContent}>
                <p>Take photos using your device's camera</p>
                {!cameraActive && !showCapturePreview ? (
                  <button 
                    type="button" 
                    onClick={() => startCamera(0)}
                    className={styles.cameraButton}
                  >
                    Start Camera
                  </button>
                ) : (
                  <div className={styles.enhancedCameraContainer}>
                    {showCapturePreview ? (
                      <div className={styles.capturePreview}>
                        <div className={styles.previewImageContainer}>
                          <img 
                            src={capturedImage} 
                            alt="Captured photo" 
                            className={styles.previewCapturedImage}
                          />
                        </div>
                        <div className={styles.capturePreviewControls}>
                          <button 
                            type="button" 
                            onClick={confirmCapturedImage}
                            className={`${styles.captureButton} ${styles.confirmButton}`}
                          >
                            Use Photo
                          </button>
                          <button 
                            type="button" 
                            onClick={retakePhoto}
                            className={`${styles.captureButton} ${styles.retakeButton}`}
                          >
                            Retake
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Update the video wrapper with ref */}
                        <div className={styles.videoWrapper} ref={videoContainerRef} id="videoContainer">
                          {cameraError && (
                            <div className={styles.cameraErrorOverlay}>
                              <p>{cameraError}</p>
                              <button 
                                onClick={() => {
                                  setCameraError(null);
                                  startCamera(0);
                                }}
                                className={styles.retryButton}
                              >
                                Retry
                              </button>
                            </div>
                          )}
                          <video 
                            ref={setVideoRef}
                            id="cameraVideo"
                            autoPlay 
                            playsInline
                            muted
                            className={styles.video}
                            onClick={() => {
                              if (videoRef.current && videoRef.current.paused) {
                                videoRef.current.play()
                                  .then(() => setCameraActive(true))
                                  .catch(err => console.error("Click to play failed:", err));
                              }
                            }}
                          ></video>
                          <div className={styles.cameraOverlay}>
                            <div className={styles.faceBoundary}></div>
                          </div>
                        </div>
                        <div className={styles.cameraControls}>
                          <button 
                            type="button" 
                            onClick={captureImage}
                            className={styles.captureButton}
                          >
                            Take Photo
                          </button>
                          <button 
                            type="button" 
                            onClick={stopCamera}
                            className={styles.stopButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {cameraActive && (
                  <p className={styles.cameraStatus}>Camera is active. Position your face in the frame.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {images.length > 0 && (
          <div className={styles.imageGallerySection}>
            <h3>Selected Images <span className={styles.imageCount}>({images.length})</span></h3>
            <div className={styles.imageGallery}>
              {images.map((image, index) => (
                <div key={index} className={styles.galleryItem}>
                  <div className={styles.galleryImageContainer}>
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                      width={120}
                      height={120}
                      className={styles.galleryImage}
                    />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      className={styles.removeButton}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.imageIndex}>Image {index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {status && (
          <div className={`${styles.statusMessage} ${
            status.error ? styles.error : 
            status.success ? styles.success : 
            status.loading ? styles.loading : 
            status.info ? styles.info : ""
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
            {status?.loading ? (
              <span className={styles.loadingButtonContent}>
                <span className={styles.spinner}></span>
                <span>Processing...</span>
              </span>
            ) : (
              <span>Update Face Embeddings</span>
            )}
          </button>
          {images.length > 0 && !status?.loading && (
            <p className={styles.readyMessage}>Ready to process {images.length} image(s)</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default EmbeddingUpdate;

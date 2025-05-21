/**
 * Cloud FastAPI Service
 * 
 * This module provides utility functions to interact with the cloud-based FastAPI service
 * running on the EC2 instance at 54.87.49.184:8000
 */

const CLOUD_API_URL = process.env.NEXT_PUBLIC_CLOUD_API_URL || "http://54.87.49.184:8000";
console.log("[CLOUD API DEBUG] Using Cloud API URL:", CLOUD_API_URL);

// Shorter timeout for status checks to prevent long waiting times
const STATUS_TIMEOUT = 2000;
// Default timeout for other operations
const DEFAULT_TIMEOUT = 5000;

/**
 * Get real-time metadata from the edge device API
 */
export const getMetadata = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    
    const response = await fetch(`${CLOUD_API_URL}/metadata`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process metadata to extract names and best similarity score
    let names = [];
    let bestSim = 0;
    
    if (data.bboxes && Array.isArray(data.bboxes) && data.bboxes.length > 0) {
      // Extract names from bboxes (element at index 4 is the name)
      names = data.bboxes.map(bbox => bbox[4]);
      
      // Find the highest similarity score (element at index 5 is the similarity)
      bestSim = Math.max(...data.bboxes.map(bbox => bbox[5] || 0));
      bestSim = parseFloat(bestSim.toFixed(2)); // Format to 2 decimal places
    }
    
    return {
      ...data,
      names,
      best_sim: bestSim
    };
  } catch (error) {
    console.error("Error fetching metadata from cloud API:", error);
    throw error;
  }
};

/**
 * Get video feed URL from the edge device API
 */
export const getVideoFeedUrl = () => {
  return `${CLOUD_API_URL}/video_feed`;
};

/**
 * Process face embeddings for a user
 * @param {string} userId - The user ID
 * @param {File[]} images - Array of image files
 */
export const processUserEmbeddings = async (userId, images) => {
  try {
    // Create a FormData object to send the images
    const formData = new FormData();
    formData.append('user_id', userId);
    
    // Append each image to the form data
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    
    const response = await fetch(`${CLOUD_API_URL}/process-embeddings`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error processing embeddings via cloud API:", error);
    throw error;
  }
};

/**
 * Get cloud API status
 * Returns information about the API health and status
 */
export const getApiStatus = async () => {
  try {
    console.log("[CLOUD API DEBUG] Checking API status");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STATUS_TIMEOUT);
    
    const response = await fetch(`${CLOUD_API_URL}/status`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const status = await response.json();
    console.log("[CLOUD API DEBUG] API status:", status);
    return status;
  } catch (error) {
    console.error("Error checking cloud API status:", error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Get the base API URL for the cloud service
 * @returns {string} The base API URL
 */
export const getCloudApiUrl = () => {
  return CLOUD_API_URL;
};

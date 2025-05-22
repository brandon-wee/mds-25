"use server";

import { revalidatePath } from "next/cache";
import { User, Models, UnknownPerson } from "./models";
import { connectToDB } from "./utils";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { loginUser } from './auth';
import { processUserEmbeddings } from "./cloudApi";

export const addUser = async (formData) => {
  const { username, email, password, phone, address, isAdmin, isActive } =
    Object.fromEntries(formData);

  try {
    connectToDB();

    // No more bcrypt hashing - store password as plain text
    const newUser = new User({
      username,
      email,
      password, // Store password as plain text
      phone,
      address,
      isAdmin,
      isActive,
    });

    await newUser.save();
  } catch (err) {
    console.log(err);
    throw new Error("Failed to create user!");
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
};

export const updateUser = async (formData) => {
  const { id, username, email, password, phone, address, isAdmin, isActive } =
    Object.fromEntries(formData);

  try {
    connectToDB();

    const updateFields = {
      username,
      email,
      password,
      phone,
      address,
      isAdmin,
      isActive,
    };

    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || undefined) && delete updateFields[key]
    );

    await User.findByIdAndUpdate(id, updateFields);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update user!");
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
};

export const deleteUser = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
    connectToDB();
    await User.findByIdAndDelete(id);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to delete user!");
  }

  revalidatePath("/dashboard/products");
};

export const addModel = async (formData) => {
  const { title, desc, accuracy, responseTime, edgeDevice, cat, size } =
    Object.fromEntries(formData);

  try {
    connectToDB();
    const newModel = new Models({
      title,
      desc,
      accuracy,
      responseTime,
      edgeDevice,
      cat,
      size,
    });
    await newModel.save();
  } catch (err) {
    console.log(err);
    throw new Error("Failed to create model!");
  }

  revalidatePath("/dashboard/models");
  redirect("/dashboard/models");
};

export const updateModel = async (formData) => {
  const { id, title, desc, accuracy, responseTime, edgeDevice, cat } =
    Object.fromEntries(formData);

  try {
    connectToDB();
    const updateFields = {
      title,
      desc,
      accuracy,
      responseTime,
      edgeDevice,
      cat,
    };
    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || undefined) && delete updateFields[key]
    );

    await Models.findByIdAndUpdate(id, updateFields);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to update model!");
  }

  revalidatePath("/dashboard/models");
  redirect("/dashboard/models");
};

export const deleteModel = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
    connectToDB();
    await Models.findByIdAndDelete(id);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to delete model!");
  }

  revalidatePath("/dashboard/models");
};

export const authenticate = async (prevState, formData) => {
  const { username, password } = Object.fromEntries(formData);
  
  console.log(`[ACTIONS DEBUG] Authentication attempt for user: ${username}`);
  
  const result = await loginUser({ username, password });
  console.log(`[ACTIONS DEBUG] Login result:`, { 
    success: result.success, 
    message: result.message || 'No message', 
    hasToken: !!result.token,
    username: result.user?.username || 'unknown',
  });
  
  if (result.success && result.user && result.user.username) {
    // Create simplified user info for client
    const userInfo = {
      username: result.user.username,
      isAdmin: !!result.user.isAdmin
    };
    
    console.log("[ACTIONS DEBUG] Setting cookies with user info:", userInfo);
    
    try {
      // Set the auth token cookie (httpOnly for security)
      cookies().set({
        name: 'auth-token',
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      // Set a non-httpOnly cookie for client-side access
      cookies().set({
        name: 'user-info',
        value: JSON.stringify(userInfo),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      // This is a direct approach to set localStorage during login
      // The script will run on the client side
      const clientUsername = result.user.username.replace(/'/g, "\\'"); // Escape single quotes
      const script = `
        localStorage.setItem('username', '${clientUsername}');
        localStorage.setItem('isAdmin', ${result.user.isAdmin ? 'true' : 'false'});
        console.log('[CLIENT] Username stored in localStorage:', '${clientUsername}');
      `;
      
      console.log("[ACTIONS DEBUG] Auth cookies set successfully with username:", userInfo.username);
      return { 
        success: true, 
        script,
        // Include the username directly in the response for immediate display
        username: result.user.username 
      };
    } catch (error) {
      console.error("[ACTIONS ERROR] Error setting cookies:", error);
      return { success: true, username: result.user.username }; // Still return success with username
    }
  } else {
    console.log("[ACTIONS DEBUG] Authentication failed:", result.message);
    return result.message || "Wrong Credentials";
  }
};

export const updateUserEmbeddings = async (data) => {
  console.log("updateUserEmbeddings received data:", data);
  
  try {
    const { userId, embeddingUpdated } = data;
    
    if (!userId) {
      console.error("No userId provided to updateUserEmbeddings");
      return { success: false, message: "No user ID provided" };
    }
    
    // Connect to database
    connectToDB();
    
    console.log(`Updating user ${userId} with embeddingsUpdated=true`);
    
    // Update user record to indicate embeddings have been updated
    const result = await User.findByIdAndUpdate(userId, {
      $set: {
        embeddingsUpdated: true,
        updatedAt: new Date()
      }
    });
    
    if (!result) {
      console.error(`User with ID ${userId} not found`);
      return { success: false, message: "User not found" };
    }
    
    console.log("User updated successfully:", result.username || userId);
    
    return { 
      success: true, 
      message: "Embedding status updated successfully!" 
    };
  } catch (error) {
    console.error("Error in updateUserEmbeddings:", error);
    return { success: false, message: `Database error: ${error.message}` };
  }
};

// Helper function to upload image (implementation depends on your storage solution)
async function uploadImage(file, userId) {
  // Example implementation - adjust according to your storage mechanism
  // For cloud storage like AWS S3, you'd use their SDK here
  // For local file system in Next.js:
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create unique filename
  const filename = `${userId}_profile_${Date.now()}.${file.name.split('.').pop()}`;
  const path = `/uploads/profiles/${filename}`;
  
  // Save file
  // Implementation depends on your setup (e.g., local file system, S3, etc.)
  
  return path; // Return the path to the uploaded image
}

export const findUserByUsername = async (username) => {
  try {
    connectToDB();
    const user = await User.findOne({ username: username });
    console.log(`[ACTIONS DEBUG] Found user by username ${username}:`, user ? user.username : 'not found');
    return user;
  } catch (err) {
    console.error("[ACTIONS ERROR] Error finding user:", err);
    throw new Error("Failed to find user");
  }
};

export const registerUser = async (formData) => {
  const { username, email, password } = Object.fromEntries(formData);
  
  console.log(`[ACTIONS DEBUG] Registration attempt for user: ${username}`);
  
  try {
    await connectToDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });
    
    if (existingUser) {
      console.log("[ACTIONS DEBUG] User already exists");
      return { 
        success: false, 
        message: existingUser.username === username 
          ? "Username already taken" 
          : "Email already registered" 
      };
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      isAdmin: false,
      isActive: true
    });
    
    await newUser.save();
    
    console.log("[ACTIONS DEBUG] User registered successfully");
    return { success: true };
  } catch (err) {
    console.error("[ACTIONS ERROR]", err);
    return { success: false, message: "Failed to register: " + err.message };
  }
};

export const resetPassword = async (formData) => {
  const { email, newPassword } = Object.fromEntries(formData);
  
  console.log(`[ACTIONS DEBUG] Password reset attempt for email: ${email}`);
  
  try {
    await connectToDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("[ACTIONS DEBUG] User not found for password reset");
      return { success: false, message: "No account found with this email" };
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    console.log("[ACTIONS DEBUG] Password reset successful");
    return { success: true };
  } catch (err) {
    console.error("[ACTIONS ERROR]", err);
    return { success: false, message: "Failed to reset password: " + err.message };
  }
};

// Maximum number of confidence history entries to keep per user
const MAX_CONFIDENCE_HISTORY = 100;

// Update user confidence level and add to history
export const updateUserConfidence = async (username, confidence) => {
  try {
    await connectToDB();
    
    // Find the user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User not found: ${username}`);
      return null;
    }
    
    const now = new Date();
    
    // Update the user's last confidence and detection time
    user.lastConfidence = confidence;
    user.lastDetectedAt = now;
    
    // Initialize confidenceHistory if it doesn't exist
    if (!user.confidenceHistory) {
      user.confidenceHistory = [];
    }
    
    // Add new entry to confidenceHistory array
    user.confidenceHistory.push({
      confidence: confidence,
      timestamp: now
    });
    
    // Trim history if it exceeds the maximum size
    if (user.confidenceHistory.length > MAX_CONFIDENCE_HISTORY) {
      user.confidenceHistory = user.confidenceHistory.slice(-MAX_CONFIDENCE_HISTORY);
    }
    
    // Save the updated user
    await user.save();
    console.log(`Updated ${username} confidence history, total entries: ${user.confidenceHistory.length}`);
    
    // Return the updated user
    return user;
  } catch (err) {
    console.error(`Error updating user confidence for ${username}:`, err);
    throw new Error(`Failed to update user confidence: ${err.message}`);
  }
};

// Get all users with detection history
export const getAllUsers = async () => {
  try {
    await connectToDB();
    console.log("Getting all users from database");
    
    // Get ALL users with only the specific fields we need
    // Avoid selecting fields that might have circular references
    const users = await User.find({})
      .select('_id username isAdmin isActive img lastConfidence lastDetectedAt')
      .lean(); // Use lean() to get plain objects instead of Mongoose documents
    
    console.log(`Retrieved ${users.length} users from database`);
    
    // Debug the first user if available - only log primitive values
    if (users.length > 0) {
      console.log("Sample user:", {
        id: users[0]._id,
        username: users[0].username,
        hasLastDetected: !!users[0].lastDetectedAt
      });
    }
    
    return users;
  } catch (err) {
    console.error("Error getting all users:", err);
    throw new Error(`Failed to get all users: ${err.message}`);
  }
};

// Get all users with confidence history
export const getAllUsersWithConfidenceHistory = async (timeRange = 'minutes') => {
  try {
    await connectToDB();
    
    // Calculate date range based on timeRange
    const now = new Date();
    let cutoffDate;
    
    switch(timeRange) {
      case 'seconds':
        cutoffDate = new Date(now.getTime() - 60 * 1000); // Last 60 seconds
        break;
      case 'minutes':
        cutoffDate = new Date(now.getTime() - 10 * 60 * 1000); // Last 10 minutes
        break;
      case 'hours':
        cutoffDate = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Last 6 hours
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case 'all':
        cutoffDate = null;
        break;
      default:
        cutoffDate = new Date(now.getTime() - 10 * 60 * 1000); // Default to 10 minutes
    }
    
    // Find only users who have been detected (lastDetectedAt not null)
    let query = { lastDetectedAt: { $ne: null } };
    
    // Add time range filter if applicable
    if (cutoffDate && timeRange !== 'all') {
      query.lastDetectedAt = { $ne: null, $gte: cutoffDate };
    }
    
    // Get users with their confidence history
    const users = await User.find(query)
      .select('username lastConfidence lastDetectedAt confidenceHistory');
    
    // Filter confidenceHistory based on time range if needed
    if (cutoffDate && timeRange !== 'all') {
      users.forEach(user => {
        if (user.confidenceHistory && Array.isArray(user.confidenceHistory)) {
          // Filter confidenceHistory entries based on cutoff date
          user.confidenceHistory = user.confidenceHistory.filter(entry => 
            entry.timestamp && new Date(entry.timestamp) >= cutoffDate
          );
        }
      });
    }
    
    return users;
  } catch (err) {
    console.error("Error getting users with confidence history:", err);
    throw new Error(`Failed to get users with confidence history: ${err.message}`);
  }
};

// Maximum number of unknown persons to keep in the database
const MAX_UNKNOWN_PERSONS = 100;

// Save unknown person detection with better handling of timestamps
export const saveUnknownPerson = async (personData) => {
  try {
    await connectToDB();
    
    // Check if the name starts with "Unknown"
    if (!personData.name || !personData.name.startsWith("Unknown")) {
      throw new Error("Not an unknown person");
    }
    
    // Format data for the database
    const unknownData = {
      name: personData.name,
      faceImage: personData.crop || null,
      lastConfidence: personData.similarity || 0,
      bbox: personData.bbox || null,
      lastDetectedAt: personData.lastDetectedAt || new Date()
    };
    
    // Try to find existing record with similar name
    let existingPerson = await UnknownPerson.findOne({
      name: personData.name
    });
    
    if (existingPerson) {
      // Update existing record
      existingPerson.lastConfidence = unknownData.lastConfidence;
      existingPerson.lastDetectedAt = unknownData.lastDetectedAt;
      existingPerson.detectionCount += 1;
      
      // Only update face image if provided and it's better quality (determined by confidence)
      if (unknownData.faceImage && (
          !existingPerson.faceImage || 
          unknownData.lastConfidence > existingPerson.lastConfidence
      )) {
        existingPerson.faceImage = unknownData.faceImage;
      }
      
      // Update bbox if provided
      if (unknownData.bbox) {
        existingPerson.bbox = unknownData.bbox;
      }
      
      await existingPerson.save();
      console.log(`Updated unknown person ${personData.name}, detection #${existingPerson.detectionCount}`);
      return existingPerson;
    } else {
      // Create new unknown person record
      const newUnknown = new UnknownPerson(unknownData);
      await newUnknown.save();
      console.log(`Created new unknown person ${personData.name}`);
      
      // Limit the number of unknown persons in the database
      const count = await UnknownPerson.countDocuments();
      if (count > MAX_UNKNOWN_PERSONS) {
        // Delete oldest unknown persons
        const oldest = await UnknownPerson.find()
          .sort({ lastDetectedAt: 1 })
          .limit(count - MAX_UNKNOWN_PERSONS);
        
        if (oldest.length > 0) {
          await UnknownPerson.deleteMany({
            _id: { $in: oldest.map(item => item._id) }
          });
          console.log(`Deleted ${oldest.length} old unknown person records to limit database size`);
        }
      }
      
      return newUnknown;
    }
  } catch (err) {
    console.error("Error saving unknown person:", err);
    throw new Error(`Failed to save unknown person: ${err.message}`);
  }
};

// Get all unknown persons
export const getAllUnknownPersons = async () => {
  try {
    await connectToDB();
    console.log("Getting all unknown persons from database");
    
    // Get all unknown persons, sorted by last detection time
    const unknownPersons = await UnknownPerson.find()
      .sort({ lastDetectedAt: -1 });
    
    console.log(`Retrieved ${unknownPersons.length} unknown persons from database`);
    
    // Debug the first unknown person if available
    if (unknownPersons.length > 0) {
      console.log("Sample unknown person:", {
        id: unknownPersons[0].unknownId,
        name: unknownPersons[0].name,
        hasImage: !!unknownPersons[0].faceImage
      });
    }
    
    return unknownPersons;
  } catch (err) {
    console.error("Error fetching unknown persons:", err);
    throw new Error(`Failed to fetch unknown persons: ${err.message}`);
  }
};

// Update an existing unknown person
export const updateUnknownPerson = async (unknownId, confidence) => {
  try {
    await connectToDB();
    
    const unknownPerson = await UnknownPerson.findOne({ unknownId });
    
    if (!unknownPerson) {
      throw new Error(`Unknown person with ID ${unknownId} not found`);
    }
    
    unknownPerson.lastConfidence = confidence;
    unknownPerson.lastDetectedAt = new Date();
    unknownPerson.detectionCount += 1;
    
    await unknownPerson.save();
    return unknownPerson;
  } catch (err) {
    console.error(`Error updating unknown person with ID ${unknownId}:`, err);
    throw new Error(`Failed to update unknown person: ${err.message}`);
  }
};

// Delete an unknown person
export const deleteUnknownPerson = async (unknownId) => {
  try {
    await connectToDB();
    
    const result = await UnknownPerson.deleteOne({ unknownId });
    
    if (result.deletedCount === 0) {
      throw new Error(`Unknown person with ID ${unknownId} not found`);
    }
    
    return { success: true };
  } catch (err) {
    console.error(`Error deleting unknown person with ID ${unknownId}:`, err);
    throw new Error(`Failed to delete unknown person: ${err.message}`);
  }
};

// Get models count
export const getModelsCount = async () => {
  try {
    await connectToDB();
    return await Models.countDocuments();
  } catch (err) {
    console.error("Error getting models count:", err);
    return 0;
  }
};

// Get users with embeddings count
export const getUsersWithEmbeddingsCount = async () => {
  try {
    await connectToDB();
    // Count users who have embeddings set (not null)
    return await User.countDocuments({ 
      embeddings: { $ne: null }
    });
  } catch (err) {
    console.error("Error getting users with embeddings count:", err);
    return 0;
  }
};

// Get unknown persons count
export const getUnknownPersonsCount = async () => {
  try {
    await connectToDB();
    return await UnknownPerson.countDocuments();
  } catch (err) {
    console.error("Error getting unknown persons count:", err);
    return 0;
  }
};
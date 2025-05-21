"use server";

import { revalidatePath } from "next/cache";
import { User, Models } from "./models";
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
"use server";

import { revalidatePath } from "next/cache";
import { User, Models } from "./models";
import { connectToDB } from "./utils";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { loginUser } from './auth';

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
    hasToken: !!result.token 
  });
  
  if (result.success) {
    // Set the auth token cookie
    cookies().set({
      name: 'auth-token',
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // 7 days in seconds
      maxAge: 60 * 60 * 24 * 7
    });
    
    console.log("[ACTIONS DEBUG] Auth cookie set successfully");
    // Return an object with just the success property to avoid serialization issues
    return { success: true };
  } else {
    console.log("[ACTIONS DEBUG] Authentication failed:", result.message);
    // Return just the error message as a string
    return result.message || "Wrong Credentials";
  }
};

export const updateUserEmbeddings = async (formData) => {
  const { userId, images } = Object.fromEntries(formData);

  try {
    connectToDB();

    // In a real implementation:
    // 1. Temporarily store the images or convert to Base64
    // 2. Send images to your FastAPI backend
    // 3. Receive embeddings from FastAPI
    // 4. Update user record with embeddings

    // This is a placeholder for the FastAPI call
    // Replace with actual API call when you set up FastAPI
    const response = await fetch("YOUR_FASTAPI_ENDPOINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        userId, 
        images: Array.from(images).map(img => img.name) // In real implementation, send actual image data
      }),
    });

    const data = await response.json();
    
    // Update user with received embeddings
    // In a real scenario, this would be the embedding data from your FastAPI
    const mockEmbeddings = [0.1, 0.2, 0.3, 0.4, 0.5]; // Replace with actual embeddings
    
    await User.findByIdAndUpdate(userId, {
      embeddings: mockEmbeddings, // or data.embeddings from your API
      faceId: `face_${userId}`, // Generate a face ID or get from API
    });

    revalidatePath("/dashboard/embeddings");
    return { success: true, message: "Embeddings updated successfully" };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to update embeddings" };
  }
};

export const findUserByUsername = async (username) => {
  try {
    connectToDB();
    const user = await User.findOne({ username: username });
    return user;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to find user");
  }
};
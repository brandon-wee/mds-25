import { cookies } from 'next/headers';
import { User } from "./models";
import { connectToDB } from "./utils";

// Simple token generation
const generateToken = (payload) => {
  const data = JSON.stringify(payload);
  const buffer = Buffer.from(data).toString('base64');
  return buffer;
};

// Simple token verification
const verifyToken = (token) => {
  try {
    const data = Buffer.from(token, 'base64').toString();
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

// Debug function to log without exposing passwords
const debugLog = (message, data) => {
  console.log(`[AUTH DEBUG] ${message}`, data);
};

// Login function to authenticate user
export async function loginUser(credentials) {
  debugLog("Login attempt with username:", credentials.username);
  
  try {
    await connectToDB();
    
    // Find user by username and explicitly select password field
    const user = await User.findOne({ username: credentials.username }).select('+password');
    
    if (!user) {
      debugLog("User not found");
      return { success: false, message: "User not found!" };
    }
    
    debugLog("User found:", { 
      id: user._id, 
      username: user.username,
      hasPassword: !!user.password
    });
    
    // Log the actual stored password for debugging (remove in production)
    debugLog("Stored password:", user.password);
    debugLog("Provided password:", credentials.password);
    
    // Simple string comparison - no hashing
    const passwordMatches = credentials.password === user.password;
    debugLog("Password match:", passwordMatches);
    
    if (!passwordMatches) {
      return { success: false, message: "Wrong password!" };
    }
    
    // Create token with user info
    const tokenPayload = { 
      id: user._id.toString(),
      username: user.username,
      isAdmin: user.isAdmin || false,
      img: user.img || null,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days expiry
    };
    
    const token = generateToken(tokenPayload);
    
    // Fix the undefined in log by not passing second parameter when not needed
    debugLog("Login successful, token generated"); // Removed undefined parameter
    
    return { 
      success: true, 
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        img: user.img
      }
    };
  } catch (err) {
    console.error("[AUTH ERROR]", err);
    return { success: false, message: "Failed to login: " + err.message };
  }
}

// Get the current user from the cookie
export function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  const userData = verifyToken(token);
  
  // Check if token has expired
  if (userData && userData.exp && userData.exp < Date.now()) {
    return null; // Token has expired
  }
  
  return userData;
}

// Check if the user is authenticated
export function isAuthenticated() {
  const user = getUser();
  return !!user;
}

// Check if the user is an admin
export function isAdmin() {
  const user = getUser();
  return user?.isAdmin === true;
}

// Logout function
export function logout() {
  cookies().delete('auth-token');
}

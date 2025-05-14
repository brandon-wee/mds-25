"use client";

import { authenticate } from "@/app/lib/actions";
import styles from "./loginForm.module.css";
import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  // Initialize with undefined, not a function call result
  const [state, formAction] = useFormState(authenticate, undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Add effect to handle state changes from the server action
  useEffect(() => {
    console.log("Current form state:", state);
    if (state?.success) {
      console.log("Login successful from useEffect, redirecting to dashboard");
      router.push("/dashboard");
    } else if (state && typeof state === "string") {
      setError(state);
    }
  }, [state, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Submitting login form with username:", username);
      
      // Create FormData manually
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      
      // Let the formAction handle the submission
      // The result will come back through the state update
      formAction(formData);
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1>Login</h1>
      <div className={styles.inputContainer}>
        <input 
          type="text" 
          placeholder="Username" 
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
          aria-label="Username"
          className={error ? styles.errorInput : ""}
        />
      </div>
      <div className={styles.inputContainer}>
        <input 
          type="password" 
          placeholder="Password" 
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-label="Password"
          className={error ? styles.errorInput : ""}
        />
      </div>
      <div className={styles.forgotPassword}>
        <a href="/reset-password">Forgot Password?</a>
      </div>
      <button 
        type="submit" 
        disabled={isLoading || !username || !password}
        className={isLoading ? styles.loadingButton : ""}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
      {error && <div className={styles.error}>{error}</div>}
      
      {/* Debug info */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <div>State: {JSON.stringify(state)}</div>
          <button 
            type="button" 
            onClick={() => {
              console.log("Current state:", state);
              if (state?.success) {
                router.push("/dashboard");
              }
            }}
            style={{ fontSize: '10px', padding: '2px', marginTop: '5px' }}
          >
            Force Redirect
          </button>
        </div>
      )}
    </form>
  );
};

export default LoginForm;

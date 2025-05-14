"use client";

import { authenticate } from "@/app/lib/actions";
import styles from "./loginForm.module.css";
import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LoginForm = () => {
  // Initialize with undefined, not a function call result
  const [state, formAction] = useFormState(authenticate, undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for success messages from redirects
  useEffect(() => {
    if (searchParams.has('registered')) {
      setSuccess("Registration successful! Please log in.");
      setTimeout(() => setSuccess(""), 5000);
    } else if (searchParams.has('reset')) {
      setSuccess("Password reset successful! Please log in with your new password.");
      setTimeout(() => setSuccess(""), 5000);
    }
  }, [searchParams]);
  
  // Add effect to handle state changes from the server action
  useEffect(() => {
    console.log("Current form state:", state);
    if (state?.success) {
      console.log("Login successful from useEffect, redirecting to dashboard");
      // Show success animation/message before redirecting
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
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
      <h1>Sign In</h1>
      <div className={styles.inputContainer}>
        <input 
          type="text" 
          placeholder="Username or Email" 
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
        <Link href="/reset-password">Forgot Password?</Link>
      </div>
      <button 
        type="submit" 
        disabled={isLoading || !username || !password}
        className={isLoading ? styles.loadingButton : ""}
      >
        {isLoading ? "Authenticating..." : "Log In"}
      </button>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      <div className={styles.registerPrompt}>
        New here? <Link href="/register">Create an Account</Link>
      </div>
    </form>
  );
};

export default LoginForm;

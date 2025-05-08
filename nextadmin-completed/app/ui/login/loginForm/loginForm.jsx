"use client";

import { authenticate } from "@/app/lib/actions";
import styles from "./loginForm.module.css";
import { useFormState } from "react-dom";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [state, formAction] = useFormState(authenticate, undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      await formAction(formData);
      // If no error is thrown, we assume login was successful
      if (!state || !state.includes("Wrong")) {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className={styles.form}>
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
          className={state ? styles.errorInput : ""}
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
          className={state ? styles.errorInput : ""}
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
      {state && <div className={styles.error}>{state}</div>}
    </form>
  );
};

export default LoginForm;

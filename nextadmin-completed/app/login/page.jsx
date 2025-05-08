"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import styles from "@/app/ui/login/login.module.css";
import LoginForm from "../ui/login/loginForm/loginForm";

const LoginPage = () => {
  const vantaRef = useRef(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({
    three: false,
    vanta: false
  });
  const [backgroundInitialized, setBackgroundInitialized] = useState(false);

  // Initialize VANTA effect once both scripts are loaded
  useEffect(() => {
    if (scriptsLoaded.three && scriptsLoaded.vanta && vantaRef.current && !backgroundInitialized) {
      try {
        // Access VANTA from window object after scripts load
        window.VANTA.NET({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x3a3a5c,
          backgroundColor: 0x10101a,
          maxDistance: 22.00,
          spacing: 19.00
        });
        setBackgroundInitialized(true);
      } catch (error) {
        console.error("Error initializing VANTA effect:", error);
      }
    }
  }, [scriptsLoaded, backgroundInitialized]);

  return (
    <>
      {/* Load Three.js from CDN */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, three: true }))}
        onError={() => console.error("Failed to load Three.js")}
      />
      
      {/* Load VANTA.js from CDN */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, vanta: true }))}
        onError={() => console.error("Failed to load VANTA.js")}
      />
      
      <div 
        className={`${styles.container} ${!backgroundInitialized ? styles.fallbackBackground : ''}`} 
        ref={vantaRef}
      >
        <LoginForm />
      </div>
    </>
  );
};

export default LoginPage;
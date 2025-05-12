"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/app/ui/dashboard/analytics/realtime/realtime.module.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdVideocam, MdPeopleAlt, MdSpeed, MdWarning, MdSync, MdErrorOutline } from "react-icons/md";

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"; // Update with your actual API URL
const FETCH_INTERVAL = 1000; // 1 second interval for data fetching

// Debug mode to help troubleshoot API issues
const DEBUG = true;

const RealTimeDataPage = () => {
  const [metaData, setMetaData] = useState({ fps: 0, people_count: 0 });
  const [fpsHistory, setFpsHistory] = useState([]);
  const [peopleCountHistory, setPeopleCountHistory] = useState([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ connected: false, lastAttempt: null, error: null });
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationInterval = useRef(null);

  // Fetch metadata at regular intervals
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        setApiStatus(prev => ({ ...prev, lastAttempt: new Date() }));
        
        if (DEBUG) console.log(`Attempting to fetch metadata from: ${API_BASE_URL}/metadata`);
        
        const response = await fetch(`${API_BASE_URL}/metadata`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
          const data = await response.json();
          
          if (DEBUG) console.log("Received metadata:", data);
          
          setMetaData(data);
          setApiStatus({ connected: true, lastAttempt: new Date(), error: null });
          
          // Update time series data
          const timestamp = new Date();
          const timeStr = timestamp.toLocaleTimeString();
          
          setFpsHistory(prev => {
            const newHistory = [...prev, { time: timeStr, fps: data.fps || 0 }];
            return newHistory.slice(-20); // Keep last 20 data points
          });
          
          setPeopleCountHistory(prev => {
            const newHistory = [...prev, { time: timeStr, count: data.people_count || 0 }];
            return newHistory.slice(-20); // Keep last 20 data points
          });
          
          // If we successfully connected, stop any simulated data
          if (isSimulating) {
            setIsSimulating(false);
            if (simulationInterval.current) {
              clearInterval(simulationInterval.current);
              simulationInterval.current = null;
            }
          }
        } else {
          const errorText = await response.text();
          console.error(`API returned error status ${response.status}: ${errorText}`);
          setApiStatus({
            connected: false, 
            lastAttempt: new Date(), 
            error: `HTTP ${response.status}: ${response.statusText}`
          });
          startSimulation();
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setApiStatus({
          connected: false, 
          lastAttempt: new Date(), 
          error: error.message || "Failed to fetch metadata"
        });
        startSimulation();
      }
    };

    // Start a simulation if API isn't responding
    const startSimulation = () => {
      if (!isSimulating && !simulationInterval.current) {
        setIsSimulating(true);
        console.log("Starting simulation due to API connection issues");
      }
    };

    fetchMetaData(); // Initial fetch
    const intervalId = setInterval(fetchMetaData, FETCH_INTERVAL);

    return () => {
      clearInterval(intervalId);
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [isSimulating]);

  // Generate simulated data if API connection fails
  useEffect(() => {
    if (!isSimulating) return;

    const generateSimulatedData = () => {
      const timestamp = new Date();
      const timeStr = timestamp.toLocaleTimeString();
      
      // Simulate FPS between 15-30
      const simulatedFps = Math.floor(Math.random() * 15) + 15;
      
      // Simulate people count between 1-5
      const simulatedPeopleCount = Math.floor(Math.random() * 5) + 1;
      
      setMetaData({ fps: simulatedFps, people_count: simulatedPeopleCount });
      
      setFpsHistory(prev => {
        const newHistory = [...prev, { time: timeStr, fps: simulatedFps }];
        return newHistory.slice(-20);
      });
      
      setPeopleCountHistory(prev => {
        const newHistory = [...prev, { time: timeStr, count: simulatedPeopleCount }];
        return newHistory.slice(-20);
      });
    };

    if (simulationInterval.current === null) {
      simulationInterval.current = setInterval(generateSimulatedData, 1000);
      generateSimulatedData(); // Generate initial data immediately
    }

    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    };
  }, [isSimulating]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Real-time Edge Device Data</h1>
        <div className={styles.summary}>
          Monitor live video and analytics from connected edge devices
          <div className={styles.apiStatus}>
            {isSimulating ? (
              <span className={styles.simulating}>
                <MdSync className={styles.spinningIcon} /> Using simulated data (API not responding)
              </span>
            ) : apiStatus.connected ? (
              <span className={styles.connected}>
                ✓ Connected to API
              </span>
            ) : (
              <span className={styles.disconnected}>
                <MdErrorOutline /> API connection error: {apiStatus.error}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.videoSection}>
        <h2><MdVideocam /> Live Video Feed</h2>
        <div className={styles.videoContainer}>
          {isVideoLoading && <div className={styles.videoLoader}>Loading video stream...</div>}
          <img 
            src={`${API_BASE_URL}/video_feed`} 
            alt="Live video feed" 
            className={styles.videoFeed}
            onLoad={() => setIsVideoLoading(false)}
            onError={(e) => {
              console.error("Video feed error:", e);
              setIsVideoLoading(false);
            }}
          />
        </div>
        {DEBUG && (
          <div className={styles.debugInfo}>
            <strong>API URL:</strong> {API_BASE_URL}<br />
            <strong>Last metadata:</strong> {JSON.stringify(metaData)}
          </div>
        )}
      </div>

      <div className={styles.charts}>
        <div className={styles.chartContainer}>
          <h2><MdPeopleAlt /> People Count</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={peopleCountHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 128, 128, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00CED1" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h2><MdSpeed /> Frames Per Second</h2>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={fpsHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 128, 128, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="fps" 
                  stroke="#20B2AA" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statBox}>
          <MdPeopleAlt className={styles.statIcon} />
          <h3>People Count</h3>
          <span className={styles.statNumber}>{metaData.people_count || 0}</span>
          {isSimulating && <span className={styles.simulatedTag}>Simulated</span>}
        </div>
        <div className={styles.statBox}>
          <MdSpeed className={styles.statIcon} />
          <h3>Current FPS</h3>
          <span className={styles.statNumber}>{metaData.fps || 0}</span>
          {isSimulating && <span className={styles.simulatedTag}>Simulated</span>}
        </div>
        <div className={styles.statBox}>
          <MdWarning className={styles.statIcon} />
          <h3>Alerts</h3>
          <span className={styles.statNumber}>{metaData.alerts || 0}</span>
          {isSimulating && <span className={styles.simulatedTag}>Simulated</span>}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataPage;

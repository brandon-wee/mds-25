"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/app/ui/dashboard/analytics/realtime/realtime.module.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdVideocam, MdPeopleAlt, MdSpeed, MdWarning, MdSync, MdErrorOutline, MdPlayArrow, MdPause, MdFace } from "react-icons/md";

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"; // Update with your actual API URL
const FETCH_INTERVAL = 5000; // 5 second interval for data fetching (changed from 1000)

// Debug mode to help troubleshoot API issues
const DEBUG = true;

const RealTimeDataPage = () => {
  const [metaData, setMetaData] = useState({ fps: 0, people_count: 0, names: [], best_sim: 0 });
  const [fpsHistory, setFpsHistory] = useState([]);
  const [peopleCountHistory, setPeopleCountHistory] = useState([]);
  const [similarityHistory, setSimilarityHistory] = useState([]); // New state for similarity scores
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ connected: false, lastAttempt: null, error: null });
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationInterval = useRef(null);

  // Toggle simulation manually
  const toggleSimulation = () => {
    if (isSimulating) {
      // Turn off simulation
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
      setIsSimulating(false);
    } else {
      // Turn on simulation
      setIsSimulating(true);
    }
  };

  // Fetch metadata at regular intervals
  useEffect(() => {
    const fetchMetaData = async () => {
      // Skip API fetch if simulation is active
      if (isSimulating) return;
      
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
          
          // Extract names and best similarity from bboxes
          let names = [];
          let bestSim = 0;
          
          if (data.bboxes && Array.isArray(data.bboxes) && data.bboxes.length > 0) {
            // Extract names from bboxes (element at index 4 is the name)
            names = data.bboxes.map(bbox => bbox[4]);
            
            // Find the highest similarity score (element at index 5 is the similarity)
            bestSim = Math.max(...data.bboxes.map(bbox => bbox[5] || 0));
            bestSim = parseFloat(bestSim.toFixed(2)); // Format to 2 decimal places
          }
          
          // Update metadata with extracted information
          setMetaData({
            ...data,
            names: names,
            best_sim: bestSim
          });
          
          setApiStatus({ connected: true, lastAttempt: new Date(), error: null });
          
          // Update time series data
          const timestamp = new Date();
          const timeStr = timestamp.toLocaleTimeString();
          
          setFpsHistory(prev => {
            const newHistory = [...prev, { time: timeStr, fps: data.fps || 0 }];
            return newHistory.slice(-12); // Keep fewer data points for slower updates
          });
          
          setPeopleCountHistory(prev => {
            const newHistory = [...prev, { time: timeStr, count: data.people_count || 0 }];
            return newHistory.slice(-12); // Keep fewer data points for slower updates
          });
          
          // Add similarity history using the extracted best similarity
          setSimilarityHistory(prev => {
            const newHistory = [...prev, { time: timeStr, similarity: bestSim }];
            return newHistory.slice(-12);
          });
        } else {
          const errorText = await response.text();
          console.error(`API returned error status ${response.status}: ${errorText}`);
          setApiStatus({
            connected: false, 
            lastAttempt: new Date(), 
            error: `HTTP ${response.status}: ${response.statusText}`
          });
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setApiStatus({
          connected: false, 
          lastAttempt: new Date(), 
          error: error.message || "Failed to fetch metadata"
        });
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

  // Generate simulated data when simulation is active
  useEffect(() => {
    if (!isSimulating) return;

    // Smooth data generation for simulation
    const generateSmoothedData = () => {
      // Get the current time
      const timestamp = new Date();
      const timeStr = timestamp.toLocaleTimeString();
      
      // Get previous values to smooth transitions
      const prevFps = metaData.fps || 20;
      const prevPeopleCount = metaData.people_count || 2;
      const prevSim = metaData.best_sim || 0.7; // Add previous similarity
      
      // Calculate target values with some randomness
      const targetFps = Math.floor(Math.random() * 15) + 15;
      const targetPeopleCount = Math.floor(Math.random() * 5) + 1;
      const targetSim = Math.min(0.99, Math.max(0.3, Math.random() * 0.5 + 0.4)); // Random between 0.4 and 0.9
      
      // Smoother transition (only move 10-15% toward target for slower updates)
      const smoothingFactor = 0.1 + (Math.random() * 0.05);
      const newFps = prevFps + (targetFps - prevFps) * smoothingFactor;
      const newPeopleCount = Math.round(prevPeopleCount + (targetPeopleCount - prevPeopleCount) * smoothingFactor);
      const newSim = prevSim + (targetSim - prevSim) * smoothingFactor;
      
      // Generate fake names for simulation
      const fakeNames = ["Alice", "Bob", "Charlie", "David", "Emma", "Unknown"];
      
      // Always ensure we have at least one name for each person detected
      const simulatedNames = Array.from(
        { length: newPeopleCount }, 
        () => fakeNames[Math.floor(Math.random() * (fakeNames.length - 1))]
      );
      
      setMetaData({ 
        fps: parseFloat(newFps.toFixed(1)), 
        people_count: newPeopleCount,
        alerts: Math.max(0, Math.floor((Math.random() * 5) - 3)),
        best_sim: parseFloat(newSim.toFixed(2)),
        names: simulatedNames // Ensure this is populated properly
      });
      
      setFpsHistory(prev => {
        const newHistory = [...prev, { time: timeStr, fps: parseFloat(newFps.toFixed(1)) }];
        return newHistory.slice(-12); // Keep fewer data points for slower updates
      });
      
      setPeopleCountHistory(prev => {
        const newHistory = [...prev, { time: timeStr, count: newPeopleCount }];
        return newHistory.slice(-12); // Keep fewer data points for slower updates
      });
      
      // Add similarity history update with cleaner value
      setSimilarityHistory(prev => {
        const newHistory = [...prev, { 
          time: timeStr, 
          similarity: parseFloat(newSim.toFixed(2)) 
        }];
        return newHistory.slice(-12);
      });
    };

    if (simulationInterval.current === null) {
      generateSmoothedData(); // Generate initial data immediately
      simulationInterval.current = setInterval(generateSmoothedData, FETCH_INTERVAL); // Use same interval as API
    }

    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    };
  }, [isSimulating, metaData]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Real-time Edge Device Data</h1>
          <div className={styles.summary}>
            Monitor live video and analytics from connected edge devices
          </div>
        </div>
        
        <div className={styles.controls}>
          <button 
            className={`${styles.simulationToggle} ${isSimulating ? styles.simulating : ''}`}
            onClick={toggleSimulation}
            title={isSimulating ? "Stop Simulation" : "Start Simulation"}
          >
            {isSimulating ? (
              <><MdPause /> Stop Simulation</>
            ) : (
              <><MdPlayArrow /> Start Simulation</>
            )}
          </button>
          
          <div className={styles.apiStatus}>
            {isSimulating ? (
              <span className={styles.simulating}>
                <MdSync className={styles.spinningIcon} /> Using simulated data
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
        {/* First row of charts - two side by side */}
        <div className={styles.chartRow}>
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
                  <YAxis domain={[0, 'auto']} />
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
                    animationDuration={2000} // Slower animation (increased from 800ms)
                    animationEasing="ease-in-out"
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
                  <YAxis domain={[0, 'auto']} />
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
                    animationDuration={2000} // Slower animation (increased from 800ms)
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Second row - similarity chart full width */}
        <div className={styles.chartRow}>
          <div className={styles.chartContainer} style={{width: '100%'}}>
            <h2><MdFace /> Face Recognition Similarity</h2>
            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={similarityHistory}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 1]} />
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
                    dataKey="similarity" 
                    name="Face Similarity" 
                    stroke="#FF8C00" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                    animationDuration={2000}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
        <div className={styles.statBox}>
          <MdFace className={styles.statIcon} />
          <h3>Similarity Score</h3>
          <span className={styles.statNumber}>{metaData.best_sim?.toFixed(2) || 0}</span>
          {isSimulating && <span className={styles.simulatedTag}>Simulated</span>}
        </div>
        <div className={styles.statBox} style={{width: '100%', maxWidth: '600px'}}>
          <MdPeopleAlt className={styles.statIcon} />
          <h3>Recognized People</h3>
          <div className={styles.namesList}>
            {metaData.names && metaData.names.length > 0 ? (
              <ul className={styles.nameList}>
                {metaData.names.map((name, index) => (
                  <li key={index} className={styles.nameItem}>
                    <span className={styles.nameLabel}>Person {index+1}:</span> {name}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.noData}>No one recognized</span>
            )}
          </div>
          {isSimulating && <span className={styles.simulatedTag}>Simulated</span>}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataPage;

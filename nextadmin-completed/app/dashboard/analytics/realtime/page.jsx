"use client";

import { useState, useEffect } from "react";
import styles from "@/app/ui/dashboard/analytics/realtime/realtime.module.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdVideocam, MdPeopleAlt, MdSpeed, MdErrorOutline, MdFace } from "react-icons/md";
import { getMetadata, getVideoFeedUrl, getCloudApiUrl } from "@/app/lib/cloudApi";

// Debug mode to help troubleshoot API issues
const DEBUG = true;
const FETCH_INTERVAL = 5000; // 5 second interval for data fetching

const RealTimeDataPage = () => {
  const [metaData, setMetaData] = useState({ fps: 0, people_count: 0, names: [], best_sim: 0 });
  const [fpsHistory, setFpsHistory] = useState([]);
  const [peopleCountHistory, setPeopleCountHistory] = useState([]);
  const [similarityHistory, setSimilarityHistory] = useState([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ connected: false, lastAttempt: null, error: null });
  const apiUrl = getCloudApiUrl();

  // Fetch metadata at regular intervals
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        setApiStatus(prev => ({ ...prev, lastAttempt: new Date() }));
        
        if (DEBUG) console.log(`Attempting to fetch metadata from: ${apiUrl}/metadata`);
        
        const data = await getMetadata();
        
        if (DEBUG) console.log("Received metadata:", data);
        
        // Update metadata with processed information from cloud API
        setMetaData(data);
        
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
          const newHistory = [...prev, { time: timeStr, similarity: data.best_sim || 0 }];
          return newHistory.slice(-12);
        });
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
    };
  }, [apiUrl]);

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
          <div className={styles.apiStatus}>
            {apiStatus.connected ? (
              <span className={styles.connected}>
                ✓ Connected to Cloud API
              </span>
            ) : (
              <span className={styles.disconnected}>
                <MdErrorOutline /> API connection error: {apiStatus.error}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats section above the video */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <MdPeopleAlt className={styles.statIcon} />
          <h3>People Count</h3>
          <span className={styles.statNumber}>{metaData.people_count || 0}</span>
        </div>
        <div className={styles.statBox}>
          <MdSpeed className={styles.statIcon} />
          <h3>Current FPS</h3>
          <span className={styles.statNumber}>{metaData.fps || 0}</span>
        </div>
        <div className={styles.statBox}>
          <MdFace className={styles.statIcon} />
          <h3>Similarity Score</h3>
          <span className={styles.statNumber}>{metaData.best_sim?.toFixed(2) || 0}</span>
        </div>
        <div className={styles.statBox}>
          <h2><MdPeopleAlt /> Recognized People</h2>
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
        </div>
      </div>
      
      {/* Video container */}
      <div className={styles.videoSection}>
        <h2><MdVideocam /> Live Video Feed</h2>
        <div className={styles.videoContainer} style={{height: '340px'}}>
          {isVideoLoading && <div className={styles.videoLoader}>Loading video stream...</div>}
          <img 
            src={getVideoFeedUrl()} 
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
            <strong>API URL:</strong> {apiUrl}<br />
            <strong>Last metadata:</strong> {JSON.stringify(metaData)}
          </div>
        )}
      </div>
      
      {/* People count chart and Similarity chart side by side */}
      <div className={styles.chartsRow}>
        {/* People Count Chart */}
        <div className={styles.chartContainer} style={{flex: 1}}>
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
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Similarity Chart */}
        <div className={styles.chartContainer} style={{flex: 1}}>
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
      
      {/* FPS chart at the bottom center */}
      <div className={styles.chartContainer} style={{width: '60%', margin: '0 auto'}}>
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
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataPage;

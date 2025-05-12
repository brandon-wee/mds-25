"use client";

import { useState, useEffect } from "react";
import styles from "@/app/ui/dashboard/analytics/realtime/realtime.module.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdVideocam, MdPeopleAlt, MdSpeed, MdWarning } from "react-icons/md";

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"; // Update with your actual API URL
const FETCH_INTERVAL = 1000; // 1 second interval for data fetching

const RealTimeDataPage = () => {
  const [metaData, setMetaData] = useState({ fps: 0, people_count: 0 });
  const [fpsHistory, setFpsHistory] = useState([]);
  const [peopleCountHistory, setPeopleCountHistory] = useState([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Fetch metadata at regular intervals
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/metadata`);
        if (response.ok) {
          const data = await response.json();
          setMetaData(data);
          
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
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    fetchMetaData(); // Initial fetch
    const intervalId = setInterval(fetchMetaData, FETCH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Real-time Edge Device Data</h1>
        <div className={styles.summary}>
          Monitor live video and analytics from connected edge devices
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
          <h3>Active Devices</h3>
          <span className={styles.statNumber}>24</span>
        </div>
        <div className={styles.statBox}>
          <MdSpeed className={styles.statIcon} />
          <h3>Current FPS</h3>
          <span className={styles.statNumber}>{metaData.fps || 0}</span>
        </div>
        <div className={styles.statBox}>
          <MdWarning className={styles.statIcon} />
          <h3>Alerts</h3>
          <span className={styles.statNumber}>3</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataPage;

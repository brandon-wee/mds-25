"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/app/ui/dashboard/analytics/realtime/realtime.module.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdPeopleAlt, MdSpeed, MdErrorOutline, MdFace, MdSwapHoriz, MdHistory, MdDelete, MdDeleteSweep } from "react-icons/md";
import { getMetadata, getCloudApiUrl } from "@/app/lib/cloudApi";
import { updateUserConfidence, saveUnknownPerson, findUserByUsername } from "@/app/lib/actions";

// Debug mode to help troubleshoot API issues
const DEBUG = true;
const FETCH_INTERVAL = 5000; // 5 second interval for data fetching
const MAX_STORED_PERSONS = 50; // Maximum number of stored persons to avoid memory issues

const RealTimeDataPage = () => {
  const [metaData, setMetaData] = useState({ fps: 0, people_count: 0, names: [], best_sim: 0, raw: {} });
  const [fpsHistory, setFpsHistory] = useState([]);
  const [peopleCountHistory, setPeopleCountHistory] = useState([]);
  const [similarityHistory, setSimilarityHistory] = useState([]);
  // New state for tracking all detected persons across API calls
  const [detectedPersons, setDetectedPersons] = useState([]);
  const [apiStatus, setApiStatus] = useState({ 
    connected: false, 
    lastAttempt: null, 
    error: null,
    endpointChanged: false,
    previousEndpoint: null
  });
  
  const apiUrl = getCloudApiUrl();
  const prevApiUrlRef = useRef(apiUrl);

  // Track processed users to avoid duplicate processing
  const [processedUsers, setProcessedUsers] = useState(new Set());

  // Handle deleting a person from history
  const deletePerson = (personId) => {
    setDetectedPersons(prevPersons => 
      prevPersons.filter(person => person.id !== personId)
    );
  };

  // Clear all detection history
  const clearAllHistory = () => {
    setDetectedPersons([]);
  };

  // Fetch metadata at regular intervals
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000;
    
    const fetchMetaData = async () => {
      try {
        // Check if API endpoint has changed
        const endpointChanged = prevApiUrlRef.current !== apiUrl;
        if (endpointChanged) {
          console.log(`[API ENDPOINT CHANGE] From ${prevApiUrlRef.current} to ${apiUrl}`);
        }
        
        // Update the ref with current URL
        prevApiUrlRef.current = apiUrl;
        
        if (isMounted) {
          setApiStatus(prev => ({ 
            ...prev, 
            lastAttempt: new Date(),
            endpointChanged: endpointChanged,
            previousEndpoint: endpointChanged ? prev.previousEndpoint || 'unknown' : prev.previousEndpoint
          }));
        }
        
        if (DEBUG) console.log(`Attempting to fetch metadata from: ${apiUrl}/metadata`);
        
        const data = await getMetadata();
        
        if (DEBUG) console.log("Received processed metadata:", data);
        
        // Reset retry count on success
        retryCount = 0;
        
        if (!isMounted) return;
        
        // Update metadata with processed information from cloud API
        setMetaData(data);
        
        // Process detected persons when API is connected
        if (data.raw?.bboxes && Array.isArray(data.raw.bboxes) && data.raw.bboxes.length > 0) {
          const timestamp = new Date();
          const currentProcessed = new Set();
          
          // Process each detected person and update database
          for (const person of data.raw.bboxes) {
            const personKey = `${person.name}-${timestamp.getTime()}`;
            
            try {
              if (!person.name.startsWith("Unknown")) {
                // Known person - update in user database with confidence history
                const userData = await findUserByUsername(person.name);
                
                if (userData) {
                  // Update with current detection data - appending to confidence array
                  await updateUserConfidence(person.name, person.similarity);
                  
                  if (DEBUG) {
                    console.log(`[DETECTION] Updated known user ${person.name} with confidence ${person.similarity}`);
                    console.log(`[DETECTION] Added entry to confidence history arrays`);
                  }
                } else {
                  console.warn(`User ${person.name} detected but not found in database`);
                }
                
                currentProcessed.add(personKey);
              } else {
                // Unknown person - save to unknown persons database with last confidence & timestamp
                await saveUnknownPerson({
                  ...person,
                  lastDetectedAt: timestamp
                });
                
                if (DEBUG) {
                  console.log(`[DETECTION] Saved unknown person ${person.name} with confidence ${person.similarity}`);
                }
              }
            } catch (error) {
              console.error(`Failed to process person ${person.name}:`, error);
            }
          }
          
          // Update processed users set
          setProcessedUsers(currentProcessed);
          
          // Update the UI with detected persons
          setDetectedPersons(prevPersons => {
            // Add timestamp to each person detected in this frame
            const newPersons = data.raw.bboxes.map(person => ({
              ...person,
              detectedAt: timestamp.toLocaleTimeString(),
              detectionTime: timestamp,
              id: `${timestamp.getTime()}-${person.name}-${Math.random().toString(36).substring(2, 9)}`
            }));
            
            // Combine with previous persons and limit total number
            const combinedPersons = [...newPersons, ...prevPersons];
            return combinedPersons.slice(0, MAX_STORED_PERSONS);
          });
        }
        
        setApiStatus(prev => ({ 
          connected: true, 
          lastAttempt: new Date(), 
          error: null,
          endpointChanged: prev.endpointChanged,
          previousEndpoint: prev.previousEndpoint
        }));
        
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
        
        if (!isMounted) return;
        
        // Add special handling for AbortError (timeout)
        const errorMessage = error.name === 'AbortError' 
          ? "Connection timed out. Please check your network or API server."
          : error.message || "Failed to fetch metadata";
          
        setApiStatus(prev => ({
          connected: false, 
          lastAttempt: new Date(), 
          error: errorMessage,
          endpointChanged: prev.endpointChanged,
          previousEndpoint: prev.previousEndpoint,
          retrying: retryCount < MAX_RETRIES
        }));
        
        // Auto-retry with exponential backoff if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES && isMounted) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          console.log(`[RETRY] Will retry in ${delay/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          setTimeout(fetchMetaData, delay);
          retryCount++;
        }
      }
    };

    fetchMetaData(); // Initial fetch
    const intervalId = setInterval(fetchMetaData, FETCH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [apiUrl]);

  return (
    <div className={styles.container}>
      {/* Header section with status */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Real-time Edge Device Data</h1>
          <div className={styles.summary}>
            Monitor real-time person detection from connected edge devices
          </div>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.apiStatus}>
            {apiStatus.connected ? (
              <span className={styles.connected}>
                ✓ Connected to Cloud API {apiStatus.endpointChanged && (
                  <span className={styles.endpointChanged}>
                    <MdSwapHoriz /> API endpoint changed
                  </span>
                )}
              </span>
            ) : (
              <span className={styles.disconnected}>
                <MdErrorOutline /> API connection error: {apiStatus.error}
                {apiStatus.retrying && (
                  <span className={styles.retrying}> (Retrying...)</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <MdPeopleAlt className={styles.statIcon} />
          <h3>People Count</h3>
          <span className={styles.statNumber}>{metaData.people_count || 0}</span>
        </div>
        <div className={styles.statBox}>
          <MdSpeed className={styles.statIcon} />
          <h3>Current FPS</h3>
          <span className={styles.statNumber}>{metaData.fps?.toFixed(1) || 0}</span>
        </div>
        <div className={styles.statBox}>
          <MdFace className={styles.statIcon} />
          <h3>Best Confidence</h3>
          <span className={styles.statNumber}>{(metaData.best_sim * 100).toFixed(1) || 0}%</span>
        </div>
      </div>
      
      {/* Detected Persons Section - Improved with cards and scrolling */}
      <div className={styles.detectedPersonsSection}>
        <div className={styles.sectionHeader}>
          <h2><MdHistory /> Detected Persons History</h2>
          {detectedPersons.length > 0 && (
            <button 
              className={styles.clearAllBtn} 
              onClick={clearAllHistory}
              title="Clear all detection history"
            >
              <MdDeleteSweep /> Clear All
            </button>
          )}
        </div>
        
        <div className={styles.personsHistoryContainer}>
          {detectedPersons.length === 0 ? (
            <div className={styles.noPersonsDetected}>
              <p>No persons have been detected yet</p>
            </div>
          ) : (
            <div className={styles.personsList}>
              {detectedPersons.map((person) => (
                <div key={person.id} className={styles.personHistoryItem}>
                  <div className={styles.personThumbnail}>
                    {person.crop ? (
                      <img 
                        src={`data:image/png;base64,${person.crop}`} 
                        alt={`Person ${person.name}`} 
                        className={styles.personThumbnailImage}
                      />
                    ) : (
                      <div className={styles.noThumbnail}>No Image</div>
                    )}
                  </div>
                  <div className={styles.personHistoryDetails}>
                    <div className={styles.personHistoryName}>{person.name}</div>
                    <div className={styles.personHistoryMeta}>
                      <span className={styles.personConfidence}>
                        Confidence: {(person.similarity * 100).toFixed(1)}%
                      </span>
                      <span className={styles.personTime}>
                        Detected at: {person.detectedAt}
                      </span>
                    </div>
                  </div>
                  <button 
                    className={styles.deletePersonBtn} 
                    onClick={() => deletePerson(person.id)}
                    title="Remove from history"
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Current frame detection */}
        <h2 className={styles.sectionTitle}><MdPeopleAlt /> Current Frame</h2>
        
        <div className={styles.personsContainer}>
          {(!metaData.raw?.bboxes || !Array.isArray(metaData.raw.bboxes) || metaData.raw.bboxes.length === 0) ? (
            <div className={styles.noPersonsDetected}>
              <p>No persons detected in the current frame</p>
            </div>
          ) : (
            <div className={styles.personsGrid}>
              {metaData.raw.bboxes.map((face, index) => (
                <div key={index} className={styles.personCard}>
                  {face.crop ? (
                    <img 
                      src={`data:image/png;base64,${face.crop}`} 
                      alt={`Person ${index + 1}`} 
                      className={styles.personImage} 
                    />
                  ) : (
                    <div className={styles.noImagePlaceholder}>No Image</div>
                  )}
                  <div className={styles.personDetails}>
                    <h3 className={styles.personName}>{face.name}</h3>
                    <div className={styles.confidenceBar}>
                      <div 
                        className={styles.confidenceFill} 
                        style={{width: `${(face.similarity * 100).toFixed(1)}%`}}
                      ></div>
                      <span className={styles.confidenceLabel}>
                        Confidence: {(face.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.detectionDetails}>
                      <span>Position: [{face.bbox.join(', ')}]</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {DEBUG && (
          <div className={styles.debugInfo}>
            <strong>API URL:</strong> {apiUrl}<br />
            {apiStatus.endpointChanged && (
              <>
                <strong>Previous API:</strong> {apiStatus.previousEndpoint}<br />
              </>
            )}
            <strong>People count:</strong> {metaData.people_count}<br />
            <strong>FPS:</strong> {metaData.fps?.toFixed(2)}<br />
            <strong>Names:</strong> {metaData.names?.join(', ') || 'None'}<br />
            <strong>Best similarity:</strong> {(metaData.best_sim * 100).toFixed(2)}%<br />
            <strong>History count:</strong> {detectedPersons.length} persons
          </div>
        )}
      </div>
      
      {/* Charts section - unchanged */}
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
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Similarity Chart - renamed to Confidence */}
        <div className={styles.chartContainer} style={{flex: 1}}>
          <h2><MdFace /> Face Recognition Confidence</h2>
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
                  name="Face Confidence" 
                  stroke="#FF8C00" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* FPS chart - unchanged */}
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
                animationDuration={1000}
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

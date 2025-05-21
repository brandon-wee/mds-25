"use client";

import styles from "@/app/ui/dashboard/people/people.module.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MdDeleteSweep, MdRefresh, MdSearchOff, MdAdminPanelSettings, MdPersonOff } from "react-icons/md";
import { getMetadata } from "@/app/lib/cloudApi";
import { findUserByUsername } from "@/app/lib/actions";

const PeoplePage = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [detectedPeople, setDetectedPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Fetch detected people and match with database users
  useEffect(() => {
    const fetchDetectedPeople = async () => {
      setIsLoading(true);
      try {
        // Get latest metadata from the API
        const data = await getMetadata();
        
        if (data && data.raw && data.raw.bboxes) {
          // Process all detected people
          const processedPeople = await Promise.all(
            data.raw.bboxes.map(async (person, index) => {
              // Check if name starts with "Unknown"
              const isKnown = !person.name.startsWith("Unknown");
              let userData = null;
              
              // If it's a known person, try to find them in the database
              if (isKnown) {
                try {
                  userData = await findUserByUsername(person.name);
                } catch (err) {
                  console.error(`Error finding user: ${person.name}`, err);
                }
              }
              
              // Create a standardized person object
              return {
                id: `detection-${Date.now()}-${index}`,
                name: person.name,
                isAdmin: userData?.isAdmin || false,
                isActive: userData?.isActive || false,
                image: userData?.image || "/noavatar.png",
                status: isKnown ? "known" : "unknown",
                confidenceScore: person.similarity * 100,
                lastDetected: new Date().toLocaleString(),
                rawData: person
              };
            })
          );
          
          // Update the state with new people
          setDetectedPeople(prevPeople => {
            // Combine with existing people, avoiding duplicates by name
            const nameMap = new Map();
            
            // First add new detections
            processedPeople.forEach(person => {
              nameMap.set(person.name, person);
            });
            
            // Then add previous detections that aren't duplicates
            prevPeople.forEach(person => {
              if (!nameMap.has(person.name)) {
                nameMap.set(person.name, person);
              }
            });
            
            return Array.from(nameMap.values());
          });
        }
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching detected people:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchDetectedPeople();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(fetchDetectedPeople, 15000); // 15 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle clearing all detection history
  const clearAllDetections = () => {
    setDetectedPeople([]);
  };
  
  // Manually refresh detections
  const refreshDetections = async () => {
    try {
      setIsLoading(true);
      const data = await getMetadata();
      // Process the data and update state
      // (Similar logic to useEffect)
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing detections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter people based on detection status only
  const filteredPeople = detectedPeople.filter(person => 
    statusFilter === "all" || person.status === statusFilter
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Face Detection Results</h1>
        <div className={styles.actions}>
          <button 
            className={styles.refreshButton}
            onClick={refreshDetections}
            disabled={isLoading}
          >
            <MdRefresh className={isLoading ? styles.spinning : ""} /> Refresh
          </button>
          
          <button 
            className={styles.clearButton}
            onClick={clearAllDetections}
            disabled={detectedPeople.length === 0}
          >
            <MdDeleteSweep /> Clear History
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <select 
          className={styles.filter}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Detections</option>
          <option value="known">Known Faces</option>
          <option value="unknown">Unknown Faces</option>
        </select>
        
        {lastUpdated && (
          <span className={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {isLoading && <div className={styles.loadingIndicator}>Loading detection data...</div>}
      
      {!isLoading && filteredPeople.length === 0 && (
        <div className={styles.noResults}>
          <MdSearchOff size={48} />
          <p>No detected people match your filters</p>
        </div>
      )}

      {filteredPeople.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Person</td>
              <td>Status</td>
              <td>Admin</td>
              <td>Active</td>
              <td>Confidence</td>
              <td>Last Detected</td>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.map((person) => (
              <tr key={person.id} className={styles[person.status]}>
                <td>
                  <div className={styles.person}>
                    <Image
                      src={person.image}
                      alt={person.name}
                      width={40}
                      height={40}
                      className={styles.personImage}
                    />
                    {person.name}
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[person.status]}`}>
                    {person.status === "known" ? "Known" : "Unknown"}
                  </span>
                </td>
                <td>
                  {person.isAdmin ? (
                    <div className={styles.adminBadge}>
                      <MdAdminPanelSettings size={18} /> Admin
                    </div>
                  ) : (
                    "No"
                  )}
                </td>
                <td>
                  {person.isActive ? (
                    <span className={styles.activeBadge}>Active</span>
                  ) : (
                    <span className={styles.inactiveBadge}>
                      <MdPersonOff size={16} /> Inactive
                    </span>
                  )}
                </td>
                <td>{person.confidenceScore.toFixed(1)}%</td>
                <td>{person.lastDetected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PeoplePage;
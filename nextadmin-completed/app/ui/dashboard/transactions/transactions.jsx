"use client";

import Image from "next/image";
import styles from "./transactions.module.css";
import { useState, useEffect } from "react";

const Detections = () => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    setAnimate(true);
  }, []);

  // Sample detection data
  const detections = [
    {
      id: 1,
      name: "Alex Johnson",
      status: "unverified",
      timestamp: "Today, 10:45 AM",
      confidence: 92.7,
      img: "/noavatar.png",
    },
    {
      id: 2,
      name: "Sarah Williams",
      status: "verified",
      timestamp: "Today, 09:32 AM",
      confidence: 98.5,
      img: "/noavatar.png",
    },
    {
      id: 3,
      name: "Unknown Person",
      status: "falseAlarm",
      timestamp: "Today, 08:17 AM",
      confidence: 67.3,
      img: "/noavatar.png",
    },
    {
      id: 4,
      name: "Michael Chen",
      status: "unverified",
      timestamp: "Today, 07:45 AM",
      confidence: 89.2,
      img: "/noavatar.png",
    }
  ];

  return (
    <div className={`${styles.container} ${animate ? styles.animate : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Latest Person Detections</h2>
        <button className={styles.viewAll}>View All</button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <td>Person</td>
              <td>Status</td>
              <td>Timestamp</td>
              <td>Confidence</td>
            </tr>
          </thead>
          <tbody>
            {detections.map((detection, index) => (
              <tr key={detection.id} style={{animationDelay: `${index * 0.1}s`}}>
                <td>
                  <div className={styles.user}>
                    <div className={styles.imgContainer}>
                      <Image
                        src={detection.img}
                        alt=""
                        width={40}
                        height={40}
                        className={styles.userImage}
                      />
                    </div>
                    <span className={styles.userName}>{detection.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.status} ${styles[detection.status]}`}>
                    {detection.status === "unverified" && "Unverified"}
                    {detection.status === "verified" && "Verified"}
                    {detection.status === "falseAlarm" && "False Alarm"}
                  </span>
                </td>
                <td>
                  <span className={styles.timestamp}>{detection.timestamp}</span>
                </td>
                <td>
                  <div className={styles.confidenceWrapper}>
                    <div className={styles.confidenceBar}>
                      <div 
                        className={styles.confidenceFill} 
                        style={{
                          width: `${detection.confidence}%`,
                          backgroundColor: 
                            detection.confidence > 90 ? "var(--success)" : 
                            detection.confidence > 80 ? "var(--warning)" : 
                            "var(--error)"
                        }}
                      ></div>
                    </div>
                    <span className={styles.confidenceText}>{detection.confidence}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Detections;

"use client";

import styles from "@/app/ui/dashboard/people/people.module.css";
import Image from "next/image";
import { useState } from "react";

const PeoplePage = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Updated people data with detection status
  const people = [
    { 
      id: 1, 
      name: "John Doe", 
      role: "Developer", 
      team: "Engineering", 
      image: "/noavatar.png",
      status: "known",
      confidenceScore: 98.5,
      lastDetected: "2023-11-05 14:30" 
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      role: "Designer", 
      team: "Design", 
      image: "/noavatar.png",
      status: "known",
      confidenceScore: 97.2,
      lastDetected: "2023-11-05 15:45" 
    },
    { 
      id: 3, 
      name: "Mike Johnson", 
      role: "Product Manager", 
      team: "Product", 
      image: "/noavatar.png",
      status: "known",
      confidenceScore: 99.1,
      lastDetected: "2023-11-05 13:20" 
    },
    { 
      id: 4, 
      name: "Unknown Person 1", 
      role: "Unidentified", 
      team: "Unknown", 
      image: "/noavatar.png",
      status: "unknown",
      confidenceScore: 45.2,
      lastDetected: "2023-11-05 16:20" 
    },
    { 
      id: 5, 
      name: "Unknown Person 2", 
      role: "Unidentified", 
      team: "Unknown", 
      image: "/noavatar.png",
      status: "unknown",
      confidenceScore: 38.7,
      lastDetected: "2023-11-05 17:05" 
    },
  ];

  // Filter people based on detection status
  const filteredPeople = statusFilter === "all" 
    ? people 
    : people.filter(person => person.status === statusFilter);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Face Detection Results</h1>
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

        <select className={styles.filter}>
          <option value="">All Teams</option>
          <option value="engineering">Engineering</option>
          <option value="design">Design</option>
          <option value="product">Product</option>
          <option value="data">Data</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <td>Person</td>
            <td>Role</td>
            <td>Team</td>
            <td>Status</td>
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
              <td>{person.role}</td>
              <td>{person.team}</td>
              <td>
                <span className={`${styles.statusBadge} ${styles[person.status]}`}>
                  {person.status === "known" ? "Known" : "Unknown"}
                </span>
              </td>
              <td>{person.confidenceScore.toFixed(1)}%</td>
              <td>{person.lastDetected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PeoplePage;
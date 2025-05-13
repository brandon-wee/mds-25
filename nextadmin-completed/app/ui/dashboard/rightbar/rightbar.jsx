import Image from "next/image";
import styles from "./rightbar.module.css";
import { MdPlayCircleFilled, MdReadMore } from "react-icons/md";
import Link from "next/link";
import { fetchTopModelsByAccuracy } from "@/app/lib/data";

// TopModelsChart component to handle data fetching and rendering
const TopModelsChart = async () => {
  let topModels = [];
  let error = null;
  
  try {
    topModels = await fetchTopModelsByAccuracy(5);
  } catch (err) {
    error = "Failed to load top models";
    // Fallback data in case of error
    topModels = [
      { name: "Model 1", accuracy: 90.0 },
      { name: "Model 2", accuracy: 85.0 },
      { name: "Model 3", accuracy: 80.0 },
    ];
  }

  return (
    <>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.chartContainer}>
        {topModels.map((model) => (
          <div key={model.name} className={styles.barChartItem}>
            <span className={styles.modelName}>{model.name}</span>
            <div className={styles.barContainer}>
              <div 
                className={styles.bar} 
                style={{ width: `${model.accuracy}%` }}
              />
              <span className={styles.accuracy}>{model.accuracy}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// Make Rightbar a Server Component
const Rightbar = async () => {
  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <div className={styles.text}>
          <span className={styles.notification}>📊 Model Performance</span>
          <h3 className={styles.title}>
            Top 5 Models with Highest Accuracy
          </h3>
          {/* @ts-expect-error Server Component */}
          <TopModelsChart />
        </div>
      </div>
      
      <div className={styles.item}>
        <div className={styles.text}>
          <span className={styles.notification}>🚀 Edge Computing</span>
          <h3 className={styles.title}>
            Test Our Models on Edge Devices
          </h3>
          <span className={styles.subtitle}>Optimize for real-world performance</span>
          <p className={styles.desc}>
            Deploy and evaluate model performance directly on edge devices to ensure optimal 
            accuracy and speed in real-world applications. Monitor real-time metrics
            and make data-driven decisions.
          </p>
          <Link href="/dashboard/analytics/realtime">
            <button className={styles.button}>
              <MdPlayCircleFilled />
              Go to Realtime Testing
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Rightbar;

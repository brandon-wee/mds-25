import styles from "@/app/ui/dashboard/analytics/realtime/realtime.module.css";

const RealTimeDataPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Real-time Data</h1>
        <div className={styles.summary}>
          Monitor real-time data from connected edge devices
        </div>
      </div>
      <div className={styles.charts}>
        <div className={styles.chart}>
          <h2>Live Data Feed</h2>
          <div className={styles.chartPlaceholder}>
            {/* Chart component would go here */}
            Real-time chart visualization
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.statBox}>
            <h3>Active Devices</h3>
            <span className={styles.statNumber}>24</span>
          </div>
          <div className={styles.statBox}>
            <h3>Data Points/min</h3>
            <span className={styles.statNumber}>1,453</span>
          </div>
          <div className={styles.statBox}>
            <h3>Alerts</h3>
            <span className={styles.statNumber}>3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataPage;

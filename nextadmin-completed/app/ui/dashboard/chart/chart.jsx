"use client"

import styles from './chart.module.css'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { useState, useEffect } from 'react';

const data = [
  {
    name: "Sun",
    accuracy: 92.7,
    processTime: 24,
  },
  {
    name: "Mon",
    accuracy: 93.0,
    processTime: 21,
  },
  {
    name: "Tue",
    accuracy: 91.8,
    processTime: 19,
  },
  {
    name: "Wed",
    accuracy: 94.2,
    processTime: 22,
  },
  {
    name: "Thu",
    accuracy: 93.5,
    processTime: 20,
  },
  {
    name: "Fri",
    accuracy: 94.8,
    processTime: 18,
  },
  {
    name: "Sat",
    accuracy: 95.2,
    processTime: 17,
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{`${label}`}</p>
        <p className={styles.tooltipData}>
          <span className={styles.accuracyDot}></span>
          {`Accuracy: ${payload[0].value}%`}
        </p>
        <p className={styles.tooltipData}>
          <span className={styles.processTimeDot}></span>
          {`Processing: ${payload[1].value}ms`}
        </p>
      </div>
    );
  }
  return null;
};

const Chart = () => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className={`${styles.container} ${animate ? styles.animate : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Edge Device Performance</h2>
        <div className={styles.tabs}>
          <span className={styles.activeTab}>Weekly</span>
          <span className={styles.tab}>Monthly</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={data}
          margin={{
            top: 15,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProcessTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="var(--textSoft)" />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke="#8884d8" 
            domain={[85, 100]} 
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#82ca9d" 
            domain={[0, 50]} 
            tickFormatter={(value) => `${value}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "10px" }}
            formatter={(value) => <span className={styles.legendText}>{value}</span>}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="accuracy" 
            stroke="#8884d8" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAccuracy)"
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} 
            name="Accuracy (%)" 
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="processTime" 
            stroke="#82ca9d" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorProcessTime)"
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            name="Processing Time (ms)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
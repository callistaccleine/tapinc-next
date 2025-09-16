import React from 'react';
import { Line } from 'react-chartjs-2';
import styles from "@/styles/Analytics.module.css";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, ChartOptions, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const ActivityTable = () => {
  const data = {
    labels: ['1', '2', '3', '4'],
    datasets: [
      {
        label: 'Activity Count every week',
        data: [20, 13, 3, 5],
        borderColor: 'rgba(0, 0, 0, 0.5)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        tension: 0.4, 
        pointRadius: 5, 
        pointBackgroundColor: '#ffff',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Recent Activity Overview',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Weeks',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Activity Count',
        },
      },
    },
  };

  return (
    <div className={styles.activityContainer}>
      <div className={styles.activityTable}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ActivityTable;
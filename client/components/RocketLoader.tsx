"use client";

import React from 'react';
import styles from './rocket-loader.module.css';

const RocketLoader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.moon}>
        <div className={`${styles.crater} ${styles.crater1}`} />
        <div className={`${styles.crater} ${styles.crater2}`} />
        <div className={`${styles.crater} ${styles.crater3}`} />
        <div className={`${styles.crater} ${styles.crater4}`} />
        <div className={`${styles.crater} ${styles.crater5}`} />
        
        <div className={styles.shadow} />
        
        {/* Phần khuôn mặt */}
        <div className={`${styles.eye} ${styles.eyeL}`} />
        <div className={`${styles.eye} ${styles.eyeR}`} />
        <div className={styles.mouth} />
        <div className={`${styles.blush} ${styles.blush1}`} />
        <div className={`${styles.blush} ${styles.blush2}`} />
      </div>
      
      <div className={styles.orbit}>
        <div className={styles.rocket}>
          <div className={styles.window} />
          <div className={styles.fire} />
          <div className={styles.gas} />
          <div className={styles.gas} />
          <div className={styles.gas} />
          <div className={styles.gas} />
          <div className={styles.gas} />
          <div className={styles.gas} />
          <div className={styles.gas} />
        </div>
      </div>
      
      <div className={styles.curve}>
        <svg viewBox="0 0 500 500">
          <path id="loading" d="M73.2,148.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
          <text width={500} className={styles.curveText}>
            <textPath xlinkHref="#loading">Translating.....</textPath>
          </text>
        </svg>
      </div>
    </div>
  );
};

export default RocketLoader;
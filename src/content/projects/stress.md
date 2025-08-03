---
title: "Stress Detection"
year: 2025
stack: ["Python", "Scikitlearn", "Pygame", "Pandas", "NumPy", "MongoDB"]
summary: "Implementation of Machine Learning algorithms to detect stress levels in individuals using physiological data."
repo: "https://github.com/gerardoaboulafia/WESAD"
featured: true
---
This project builds a subject-independent stress detector using the WESAD physiological dataset. We focus on high-fidelity chest-worn RespiBAN signals (ECG, EDA, EMG, respiration, temperature, and 3-axis accelerometer), segment them with sliding windows (60 s, 0.25 s hop), and derive statistical features to train supervised models.

Generalisation is assessed with Leave-One-Subject-Out cross-validation, comparing a Random Forest baseline against an XGBoost classifier. XGBoost reaches ~73% mean LOSO accuracy with more balanced errors across subjects, indicating a viable path toward reliable stress-monitoring pipelines in real-world settings. The implementation is in Python (scikit-learn, pandas, NumPy), with reproducible preprocessing and evaluation.

---
title: "Stress Detection"
year: 2025
stack: ["Python", "Scikitlearn", "Pygame", "Pandas", "NumPy", "MongoDB"]
summary: "Implementation of Machine Learning algorithms to detect stress levels in individuals using physiological data."
repo: "https://github.com/gerardoaboulafia/WESAD"
featured: true
---
This project develops a subject-independent stress detector on the WESAD dataset, focusing on chest-worn RespiBAN signals (ECG, EDA, EMG, respiration, temperature, and 3-axis accelerometer). Signals are segmented into 60-s windows with a 0.25-s hop, and statistical features are extracted for supervised learning.

Generalization is assessed using leave-one-subject-out (LOSO) cross-validation, comparing a Random Forest baseline with an XGBoost model. **XGBoost attains ~73% mean LOSO accuracy** with more balanced errors across subjects, supporting the feasibility of reliable, real-world stress-monitoring pipelines. The codebase is in Python (scikit-learn, pandas, NumPy) with reproducible preprocessing and evaluation.

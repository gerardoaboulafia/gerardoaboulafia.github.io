---
title: "Property Price Prediction"
year: 2024
stack: ["Python", "scikit-learn", "XGBoost", "Pygame"]
summary: "Predicting Buenos Aires property prices with engineered transit-access features from open civic data."
repo: "https://github.com/gerardoaboulafia/Property_price_prediction"
featured: true
---
This project builds a supervised model to estimate property prices in Buenos Aires. The dataset was cleaned and standardized, then enriched with **public transportation accessibility** features sourced from the Buenos Aires City Government. Feature engineering and preprocessing pipelines were implemented to ensure consistent inputs and reproducible training.

Several regressors were evaluated; **XGBoost** delivered the best performance with an **R² ≈ 0.76**, providing strong baseline accuracy. A lightweight **Pygame** interface allows stakeholders to explore predictions interactively and run quick “what-if” scenarios based on property attributes and transit access.

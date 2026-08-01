---
title: "Wildfire Susceptibility Mapping"
year: 2026
stack: ["Python", "scikit-learn", "XGBoost", "LightGBM", "SHAP", "Google Earth Engine", "Next.js", "Deck.gl"]
summary: "End-to-end geospatial ML pipeline that maps wildfire susceptibility across Córdoba Province, Argentina — from satellite data ingestion to an interactive 3D dashboard."
repo: "https://github.com/gerardoaboulafia/wildfire_detection"
featured: true
order: 1
---
This project builds a full geospatial machine-learning pipeline to map wildfire susceptibility across Córdoba Province, Argentina. Satellite fire detections (MODIS FIRMS for training, VIIRS for validation) define a binary fire/no-fire target, which is modeled against roughly 15 environmental features: topography from SRTM, vegetation indices and land surface temperature from MODIS, climate from ERA5-Land, soil properties from SoilGrids, roads and rivers from OpenStreetMap, population from WorldPop, and land cover from Copernicus. Feature layers are assembled through Google Earth Engine and other APIs, then harmonized, resampled, and filtered by VIF and correlation. Negative samples are drawn more than 5 km from any detection and stratified by land cover to avoid spatial bias.

On the modeling side, **Random Forest, XGBoost, and LightGBM** are tuned with **Optuna** and tracked in **MLflow**, with **SHAP** used to interpret feature contributions. AUC-ROC is the primary metric, and predictions are turned into a ~500 m susceptibility grid classified into four risk zones via Jenks natural breaks. The pipeline is validated temporally — trained on MODIS 2001–2022 and tested against VIIRS 2023–2024 — targeting more than 80% of actual fires falling in the High and Very High zones.

The results are served through an interactive **3D dashboard** (Next.js, Deck.gl, and Mapbox GL) that lets users explore the susceptibility surface across the province. Developed as a research project at Universidad Católica Argentina (Laboratorio III), it spans the complete workflow: remote-sensing data engineering, model training and interpretability, geospatial validation, and front-end visualization.

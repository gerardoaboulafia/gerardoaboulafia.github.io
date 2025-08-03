---
title: "Disaster Recovery Facility Location Optimization"
year: 2024
stack: ["Matlab"]
summary: "Exact P-Median, Tabu Search, and Simulated Annealing implementations in MATLAB to choose the best locations for emergency logistics centres across the United States."

repo: "https://github.com/gerardoaboulafia/Disaster_Recovery_Facility_Location_Optimization"
report: "https://github.com/gerardoaboulafia/Disaster_Recovery_Facility_Location_Optimization/blob/main/Aboulafia_final.pdf"
featured: true
---
This work addresses disaster-recovery facility location through a p-median model that selects five sites to serve nationwide demand. The objective minimizes travel distance weighted by population and by state-level disaster probabilities, reflecting both exposure and impact. The dataset combines geocoded demand points with demographic and risk information, and includes a service-radius constraint to enforce feasible coverage.

On the solution side, the project implements an exact 0–1 integer programming formulation alongside Tabu Search and Simulated Annealing in MATLAB, providing a practical trade-off between optimality and computational time. A second scenario expands the candidate set with West Coast locations; the resulting solutions reduce the total weighted distance and improve coverage distribution, with outputs exported to CSV and a GeoJSON for mapping.


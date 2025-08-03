---
title: "Truck Logistics Simulator"
year: 2025
stack: ["Python", "Salabim", "Monte Carlo", "Pytest"]
summary: "Discrete-event simulation to compare truck-dispatch heuristics and size the shared fleet."
repo: "https://github.com/gerardoaboulafia/Truck_Simulator"
report: "https://github.com/gerardoaboulafia/Truck_Simulator/blob/main/Truck_simulator.pdf"
featured: true
---
This project implements a discrete-event simulator (Python + Salabim) to size the tractor fleet and evaluate dispatch policies for a three-plant network and a central distribution center. It contrasts a dedicated-truck baseline with a shared-fleet rule that selects the next plant via an ETA and workload-weighted score, measuring deliveries per shift, waiting times (plant/CD), and truck utilisation.

Monte Carlo experiments with reproducible scenarios show that a properly tuned shared fleet with an additional tractor improves throughput and significantly reduces empty trailer waits at the CD versus the baseline, providing data-driven guidance for capacity and policy decisions.

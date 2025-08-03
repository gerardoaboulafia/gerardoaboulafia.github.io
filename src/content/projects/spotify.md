---
title: "Spotify Expert System"
year: 2024
stack: ["Python", "scikit-learn", "Prolog", "Pygame"]
summary: "Hybrid expert system for song recommendations that mixes a Prolog knowledge base built from Spotify playlists with feature-based similarity (KNN) in Python."
repo: "https://github.com/gerardoaboulafia/Spotify_Expert_System"
report: "https://github.com/gerardoaboulafia/Spotify_Expert_System/blob/main/Sistema_Experto.pdf"
featured: true
---
This project combines symbolic reasoning with data-driven similarity to recommend music. A pipeline ingests personal playlists via the Spotify Web API, enriches tracks with audio features, and generates a Prolog knowledge base (~3,300 facts). In parallel, a Python module normalizes numeric features and builds a NearestNeighbors index to retrieve similar songs.

A CLI guides the user through genre → song → artist and returns a 10-track “radio.” When the seed track exists in the knowledge base, Prolog rules provide filtering and explanation; otherwise, the KNN layer operates purely on audio features. The result shows how explainable rules and scalable vector search complement each other in a simple, reproducible system.

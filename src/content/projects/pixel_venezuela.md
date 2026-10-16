---
title: "Pixel Venezuela"
year: 2026
stack: ["Python", "Qwen-Image-Edit", "LoRA", "Diffusers", "Modal", "CesiumJS", "Playwright", "SQLite", "OpenSeadragon"]
summary: "A 415-megapixel pixel-art map of Valencia, Venezuela, generated cell by cell from Google's 3D map tiles with a fine-tuned image-editing model."
featured: true
order: 0
---
Pixel Venezuela is a pixel-art map of Valencia, Venezuela: 1,584 cells covering about 36 km², stitched into a single 18,432 × 22,528-pixel image that you can explore at **[pixelvenezuela.com/valencia](https://pixelvenezuela.com/valencia/)**. Every cell was drawn by an image model fine-tuned for the job, from top-down renders of Google's 3D model of the city.

The pipeline starts with **Google Photorealistic 3D Tiles**, rendered straight down in **CesiumJS** inside headless Chromium (**Playwright**) with a near-orthographic camera, one image per zoom-17 map tile. Training targets were made with **Gemini** and turned into an infill dataset (nine 2×2 layouts per tile, mixing finished pixel art with the photo still to be drawn), which was used to fine-tune **LoRA** adapters for **Qwen-Image-Edit**: one for the city and one for natural terrain, chosen per cell from the photo. Generation runs on serverless **H100 GPUs on Modal**, filling the map two-by-two cells at a time, always anchored on finished neighbors. A seam-aware planner, validated by an offline simulator that replays it on a copy of the **SQLite** state database, cut the number of seams drawn without context roughly in half.

Cells were reviewed by hand next to their photos in a small **Flask** review app, and the bad ones were redrawn. At export, per-cell tone gains solved by sparse least squares and a shared 48-color palette make 1,584 separate generations read as one map. The result is cut into a **Deep Zoom** pyramid, exported in bands to fit in 8 GB of RAM, and served with **OpenSeadragon** from **Cloudflare Pages**.

[Explore the map](https://pixelvenezuela.com/valencia/) · [Read the full technical write-up](/blog/pixel-venezuela/)

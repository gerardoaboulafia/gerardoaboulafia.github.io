---
title: "Pixel Venezuela: Redrawing Valencia One Tile at a Time"
date: "October 2026"
tags: ["Generative AI", "Fine-tuning", "Computer Vision", "Python", "Maps"]
summary: "How I turned Google's 3D map of Valencia, Venezuela, into a seamless 415-megapixel pixel-art map: a headless 3D renderer, a fine-tuned image-editing model, a seam-aware scheduler, and a lot of manual review."
---

I left Venezuela eight years ago. I grew up in Prebo, in Valencia, and every now and then I try to remember the streets I used to walk and the route to my school in El Trigal. This project is my way of keeping them: a pixel-art map of Valencia, drawn cell by cell by an image model I fine-tuned. You can explore it at **[pixelvenezuela.com/valencia](https://pixelvenezuela.com/valencia/)**.

The idea comes from Andy Coenen's [isometric.nyc](https://isometric.nyc), a pixel-art map of New York, and from [his write-up](https://cannoneyed.com/projects/isometric-nyc) of how he built it. This post is the long version of how mine works: the pipeline, what broke, what I measured, and what I would do differently.

![The full pixel-art map of Valencia](/blog/pixel-venezuela/map-overview.jpg)
*Figure 1: The whole map, about 5.4 × 6.6 km, from Guaparo and El Trigal in the north down to the historic center at the bottom edge. North is up.*

| | |
|---|---|
| Area | ~36 km², an 18 × 22 grid of zoom-17 map tiles |
| Cells | 1,584 cells of 512 × 512 px, each about 150 m on a side |
| Final image | 18,432 × 22,528 px (415 megapixels), ~0.29 m per pixel |
| Source | Google Photorealistic 3D Tiles, rendered top-down with CesiumJS |
| Model | Qwen-Image-Edit with two LoRA fine-tunes (city and terrain) |
| Inference | Serverless H100 GPUs on Modal, ~45 s per call |
| Viewer | OpenSeadragon deep zoom, static files on Cloudflare Pages |

---

## The Pipeline at a Glance

1. **Render.** Capture 396 top-down images of the city from Google's 3D tiles.
2. **Make training pairs.** Convert 23 of them into pixel art with Gemini.
3. **Fine-tune.** Teach an image-editing model to *continue* existing pixel art across a border, not just restyle a photo.
4. **Generate.** Fill the map two-by-two cells at a time, always anchored on finished neighbors.
5. **Review.** Check the cells next to their photos and redraw the bad ones.
6. **Color.** Level brightness across cells and snap everything to one shared palette.
7. **Export and host.** Cut a deep-zoom pyramid and serve it as static files.

Everything hangs off one SQLite table. Each row is a cell, addressed by its map tile and quadrant, with the path to its photo, the path to its art, and a status (`pending`, `generated`, `approved` or `flagged`). Every tool reads and writes that table, so any run can stop and resume, and a database snapshot before each batch is a complete rollback point.

---

## 1. Capturing the City

The source is Google's Photorealistic 3D Tiles, the textured 3D mesh behind Google Earth. A headless Chromium driven by Playwright loads it into CesiumJS and saves one 1024 × 1024 image per zoom-17 slippy-map tile (about 300 m on a side). That tile grid is the backbone of the project: every file and database row is addressed by tile coordinates.

**Why top-down instead of isometric.** The original plan copied isometric.nyc's oblique camera, and it failed for two reasons. An oblique camera sees a rotated, foreshortened parallelogram of ground, which can't be laid onto a north-up square grid without neighboring tiles missing or duplicating geography. And Venezuela gets Google's low-resolution 3D tier: rendered by the same pipeline, a block of Manhattan has crisp facades, while Valencia's buildings come out soft and melted. There is nothing worth seeing from an angle. So the camera looks straight down, and the map is top-down pixel art.

**Faking an orthographic camera.** Cesium's orthographic frustum broke texture sampling in the version I used (1.116). Instead, the camera is a perspective camera with a very narrow field of view, placed 100 tile-widths away (about 30 km), where perspective distortion all but disappears. The rest of the setup:

- **An unlit shader**, so colors are the raw textures, not sun-dependent shading.
- **Fog and dynamic screen-space error off**, because both throw away detail at long range.
- **A 4-pixel margin**, rendered and then cropped, because at 30 km the outermost pixel row is sometimes left uncovered.
- **Rendering at the tile's true aspect ratio** and then resizing. A slippy tile isn't exactly square in meters, and skipping this put every seam about 7 px off.

**API sessions.** Google bills each request for the root tileset, which in practice means one per browser session, not each of the hundreds of mesh files a render downloads. The free tier is 1,000 sessions a month. My first capture opened one session per tile (375 requests); the batched re-capture of all 396 tiles took 33, at about 30 tiles per session. Longer sessions started dropping pieces of the mesh, so the capture harness restarts every 30 or so.

**Three bugs that looked like Google's fault.** A month into generation I noticed renders that looked cropped or zoomed in. All three causes were in my own capture code:

- **A height probe that fell through a seam.** To aim the camera I cast a ray at the tile center to find the ground height. Every slippy tile's center sits exactly on a longitude where two of Google's mesh pieces meet. A ray within about 2 cm of that line misses both and hits the bare ellipsoid at 0 m instead of ~470 m, which zoomed three tiles in by 1.46×. The fix is a 9 × 9 grid of probes, offset from the seams, using the median of the outer ring.
- **Relief parallax.** My first renders used a camera only 1.5 km away. Valencia's hills have 100–170 m of relief inside a single tile, and at that range content shifted about 0.34 px per meter of height, so seams on 116 hill tiles jumped by tens of pixels. Moving the camera to 30 km cut the shift to under a pixel.
- **The data gap that wasn't.** A flat, untextured band across one row of tiles looked like a permanent hole in Google's data, and I even ran a repair pass to inpaint it. It was the 1.5 km camera again: at 30 km the band shows the real city.

The lesson I keep relearning: before blaming the data, vary the capture.

---

## 2. Training Data: Pixel Art From Gemini

A fine-tune needs pairs: a photo and the pixel art it should become. I made 23 targets with Google's Nano Banana Pro (Gemini 3 Pro Image), and the tricks that made them consistent were mostly about what *not* to show the model:

- **A style swatch instead of a reference tile.** Given a full finished tile as a style reference, Gemini copied its buildings and streets into the next tile. The fix was a swatch made of scrambled crops of one approved tile: the same palette, saturation and pixel size, but no street layout to copy.
- **A fresh conversation every 8–10 tiles.** Long image conversations start leaking content from earlier tiles.
- **An explicit list of don'ts.** Keep the street grid and building footprints exactly, and add no sky, horizon or text. Image models love to add a sky to a straight-down photo.
- **A QA script.** It checks each target's similarity to its photo and its pixel-block size, which must stay within ±30% of the median (about 6 px per art pixel). I accepted random noise like a stray car and rejected anything systematic, like a sky band, palette drift or a different pixel scale, because systematic errors get learned.

Two tiles were held out of everything, to evaluate the model on ground it had never seen.

![A 1:1 crop of the map in Prebo](/blog/pixel-venezuela/detail-prebo.jpg)
*Figure 2: A 1:1 crop from Prebo, at the map's full resolution.*

---

## 3. Teaching the Model to Continue, Not Restyle

The base Qwen-Image-Edit model restyled single photos well, but it had two problems for a map. It added sky and clouds even when told not to. Worse, when given a block that already contained finished art, it redrew the finished part instead of continuing it, so neighboring cells didn't line up.

The fix, borrowed from isometric.nyc, is to train on **infill**. Each training input is a 2 × 2 block of cells. Some cells already show the target pixel art (the anchors), and the rest show the photo, outlined in red. The target is always the complete pixel-art tile. The model learns to draw inside the red line and to continue whatever is outside it.

![The nine infill training variants](/blog/pixel-venezuela/infill-variants.svg)
*Figure 3: The nine inputs built from every training tile. The eight anchored layouts follow isometric.nyc's infill dataset. The ninth has no anchors, because the first cell of any new region has no finished neighbor.*

The red outline is drawn by one shared function in both training and inference, so the model sees pixel-identical markings at both stages. Images stay PNG end to end, because JPEG compression measurably softened the pixel blocks.

23 tiles × 9 variants gave 207 pairs. I trained a LoRA on Qwen-Image-Edit with oxen.ai: rank 16, alpha 16, learning rate 2e-4, batch size 1, 3,000 steps. The metric that mattered was how much the model changes the anchor pixels it is supposed to leave alone. That mean absolute difference dropped from about 65 with the base model to about 10 with the fine-tune.

---

## 4. Generating 1,584 Cells Without Seams

Each generation call sends a 1024 × 1024 block (2 × 2 cells) to Modal and gets 1024 × 1024 back. Only the cells that weren't anchors are kept. Inference runs Hugging Face Diffusers' Qwen-Image-Edit pipeline with the LoRA in bfloat16, at 40 steps and a true CFG scale of 4.0, on one H100: about 45 seconds per warm call. Some blocks fill two to four cells at once, so the map averaged about 0.75 calls per cell.

**The seam-safety rule.** A 2 × 2 block that contains a given cell can extend only one way vertically (north or south) and one way horizontally (east or west). So if a cell's north *and* south neighbors are already finished, no block can anchor both, and one edge will be drawn blind. The planner only picks cells that are seam-safe given what is already done. It spirals outward from the center of the region, greedily taking the nearest safe cell.

Greedy ordering still boxes in 15–20% of the cells in each zone. Those are forced at the end, anchored on at most two sides, and logged for a seam audit.

**Parallelism versus seams.** To go faster, I ran several calls at once, choosing blocks that didn't overlap. That wasn't enough. Two blocks that write *adjacent* cells each draw their side of the shared edge blind, and a block whose anchors were being drawn in the same batch had no anchors at all. At six parallel calls, about 29% of cells were drawn with no finished neighbor, and the first version of the map was built that way. The fix: a batch accepts only anchored blocks, and never two blocks that write cells touching each other.

**Simulate before running.** Rather than guess at the trade-off, I wrote an offline simulator that replays the planner on a copy of the database and counts *blind edges*: borders drawn without the neighbor as an anchor. For the south-west zone:

| Strategy | Model calls | Blind edges |
|---|---:|---:|
| 3 in parallel, original batching | 147 | 126 |
| 3 in parallel, fixed batching | 165 | 102 |
| Sequential | 191 | 66 |

Sequential costs about 30% more calls and leaves about half the blind edges, so I ran it sequentially. When I did, the live run's call count matched the simulator's prediction exactly, so from then on every run was simulated before it started.

---

## 5. When the Model Invents a City

The fine-tune's training tiles were almost all city, and it showed. On forest, the model drew street grids. On a bare hill, it drew a whole town, with every random seed.

**Attempt 1: prompt steering.** I measured each photo's vegetation fraction (the share of pixels where green beats both red and blue). Above 0.35 the prompt gets a "mixed: keep trees as trees and buildings as buildings" note. Above 0.65 it gets "dense forest: do NOT invent buildings, streets or parking lots". In an A/B test on 8 cases, the model drew downtowns over canopy without the note and forest with it. But about 3 of the 8 test cells still grew small invented hamlets.

**Attempt 2: a terrain fine-tune.** I trained a second LoRA (v2) with forest and terrain tiles added: 315 pairs, 3,300 steps. Gemini could no longer reproduce the first model's style, so these targets were drawn by the first model with steering, keeping the best parts of several seeds. v2 stopped inventing towns: on the held-out forest tiles, its built-up area matched the photo (0.012 and 0.032, against 0.043 and 0.032 in the photos), where v1 had 0.115 and 0.171.

But when I started regenerating the map with v2, it turned out to draw **46% less detail**. Edge density fell from 0.299 to 0.163, and 53 of 53 comparable cells were worse: cars, lane markings and crisp roof outlines were gone. My evaluation had measured absolute numbers on held-out tiles and never compared them against v1's real output on the same inputs. That is the most useful lesson of the project: when you evaluate a replacement, diff it against the incumbent on identical inputs, and include a detail measure.

So I went back to v1 with steering, which fixed 12 of the 18 cells where it had drawn city over forest. On bare hills, though, v1 still drew a town with every seed.

**What actually worked: each model where it's good, chosen per cell.** v1 draws anything with buildings, and v2 draws pure nature. I first split the map into zones, but a v2 cell with a few houses next to v1's city looked like two different squares, so the choice moved to individual cells. The rule: v1 if buildings cover roughly a quarter of the cell or more, v2 only for pure forest, dry grass or bare ground.

The vegetation fraction was useless for this. It reads dry brown grass *and* shadowed forest as "not vegetation", and trusting it once put a hamlet on a hill. The model for each cell is chosen by looking at photo contact sheets instead.

![v1 draws a town on a bare hill; v2 keeps it bare](/blog/pixel-venezuela/v1-vs-v2.jpg)
*Figure 4: The same cells with the same inputs. v1 (left) builds a town on a bare hillside; v2 (right) keeps the hill bare and the forest ravine intact.*

---

## 6. Reviewing by Hand

Andy's write-up says AI review couldn't reliably catch the failure modes, so he reviewed his map by hand. I ended up in the same place. A small Flask app shows each cell's art next to its photo, with one key to approve and one to flag. There are two ways through it:

- **A triage ranking.** Three z-scored signals are added up: built-up area in the art beyond what the photo has (invented structures), correlation between art and photo at 48 × 48 px (the art stopped following the photo), and the worst brightness step against a finished neighbor (seams). The built-up signal counts roads as "built", so highway interchanges rank high for no reason. Metrics triage; eyes decide.
- **A map sweep.** It walks the whole map in 4 × 4-cell windows. I click the bad cells and press space; the rest are approved.

The first full pass approved 1,121 cells and flagged 195.

Two repair lessons came out of it. First, **reset clusters, not single cells**. A bad neighbor drags its invented city back into the redraw, and a lone reset cell inside finished art has no legal 2 × 2 block left. Second, **"eventually" is not "well"**. At one point, the two worst cells on the whole map weren't even flagged. They were pending cells at the map's edge that a repair block pulled in and drew with almost no anchoring.

For the final repair pass (211 cells), every v1 cell with a blind edge got **two candidates**, and a seam score picked the winner. The score is the jump across the shared edge minus the typical jump between adjacent pixel rows inside each image, after removing brightness offsets. A known bad seam scores 67; good joins score 1–15. The gain was modest (1.8 points on average), but it cost only one extra call per cell.

---

## 7. Making 1,584 Cells Look Like One Map

Each cell comes out of the model with 70,000–140,000 unique colors and its own overall tone. Stitched raw, the map shows faint rectangles, worst on the hills, where there are no buildings to distract the eye.

**Tone matching.** Each cell gets one brightness gain, and all the gains are solved together: minimize the brightness mismatch along every shared edge, in log space, with a ridge penalty (λ = 0.3) and the mean pinned at zero, as one sparse least-squares problem. The brightness step across borders went from 1.59× the step inside a cell to 1.08×, with every gain within ±26%. The obvious alternative, pulling each cell toward a smoothed brightness field, made things worse (1.7–2.2×), because it fights real contrast like dark forest next to a bright plaza.

**One shared palette.** Every pixel is quantized to the same 48 colors, after compressing saturation above 110 by a factor of 0.4 (the model boosts saturation). Water is only 0.26% of the pixels, so a frequency-based palette gave it zero colors, and every pool turned grey. So 4 of the 48 slots are reserved for water, detected by RGB blue dominance (`b > g + 15` and `b > r + 25`). An HSV hue band picked up dark cyan forest shadows instead. The palette is built once and never rebuilt, because rebuilding it would recolor every published tile.

**The blue cast.** v2 paints grey-purple bare hills with bluish pixels, and those quantized into the water slots: 21.5% of the pixels in the south-west turned into blue specks. The fix: water colors only for connected blue clumps of at least 150 px (scaled per zoom level), and the nearest land color for everything else. That brought the south-west down to 0.6% and changed 0.2% of city pixels, with every pool kept.

All of this runs at export time, and the raw art is never modified. The palette step is also deterministic per pixel, so it can't create new seams.

![Raw model output vs the published map](/blog/pixel-venezuela/color-correction.jpg)
*Figure 5: The same 3 × 3 cells straight from the model (left) and as published (right), after tone matching and the shared palette.*

---

## 8. Export and Hosting

The viewer reads a Deep Zoom (DZI) pyramid: 16 levels of 512-px PNG tiles, about 2,150 files and 170 MB in total. The palette is applied to each level separately, because the downscale that builds each level blends in new, off-palette colors.

The full-resolution level is 18,432 × 22,528 px. Applying the palette to it in one go needed about 15 GB of RAM on my 8 GB Mac: swap grew 4 GB in 20 seconds before a disk watchdog stopped it. The export now processes one 512-px row of tiles at a time, with 256 rows of context above and below for the water-clump rule, and its output is byte-identical.

The viewer is OpenSeadragon with image smoothing off, so pixels stay crisp, and zoom stops at 1:1, so the art is never enlarged. On phones, the zoom buttons and minimap are hidden so they don't cover the Google attribution. It is all static files on Cloudflare Pages, with the domain on Cloudflare Registrar.

---

## What I Learned

- **Infill is the whole game.** A model that restyles one photo beautifully is useless for a map if it can't continue its neighbors.
- **Simulate before you run.** A database copy and a planner replay predicted every run and settled the parallel-versus-sequential question before a single GPU call.
- **Compare against the incumbent.** Absolute metrics on held-out tiles hid a 46% detail regression that a side-by-side caught immediately.
- **Metrics triage; eyes decide.** Every metric said one replacement cell was fine. The image showed a water tank flattened into a grey disc.
- **Before blaming the data, vary the capture.** Three "Google problems" were my camera.

![An invented lake](/blog/pixel-venezuela/invented-lake.jpg)
*Figure 6: Not every error got caught. The photo shows a dry hillside here; the terrain model drew a lake and continued it into the next cell. If you find it on the map, you found my favorite bug.*

---

## What's Next

The map stops at El Trigal and Guaparo. Next is north into Naguanagua, a few rows of tiles at a time, starting with Mañongo and La Granja. And maybe, eventually, the lake gets fixed.

---

## Technical Appendix

<details>
<summary>Parameters, tools and numbers</summary>

### Capture
- CesiumJS 1.116 in headless Chromium (Playwright), Google Photorealistic 3D Tiles
- Nadir camera, narrow-FOV perspective at 100× the tile width (~30 km), unlit shader, fog and dynamic SSE off
- One 1024 × 1024 render per zoom-17 tile, rendered at true aspect plus a 4 px margin, then cropped and resized
- Ground height: median of the outer ring of a 9 × 9 probe grid, offset off mesh seams
- ~30 tiles per browser session (one billable root request per session)

### Training
- Targets: 23 tiles converted by Nano Banana Pro (Gemini 3 Pro Image) with a scrambled style swatch
- Infill dataset: 9 variants per tile (8 anchored + 1 seed), red 2-px outline around the region to draw
- v1: 207 pairs, LoRA r16 / α16, lr 2e-4, batch 1, 3,000 steps on Qwen-Image-Edit (oxen.ai)
- v2: 315 pairs (35 tiles, vegetation and terrain added), same recipe, 3,300 steps
- Held-out evaluation tiles never used in training

### Inference
- Modal, one H100 per call, bfloat16, 40 steps, true CFG 4.0
- LoRA selected per call; each LoRA keeps its own warm container pool (180 s scale-down)
- ~45 s per warm call; ~0.75 calls per cell
- Prompt steering by vegetation fraction: ≥ 0.35 mixed note, ≥ 0.65 dense-forest note

### Planning
- A cell is seam-safe unless both its N and S, or both its E and W, neighbors are finished
- Outward spiral from the region's center; boxed-in cells forced last and logged
- Parallel batches: anchored blocks only, no two blocks writing 4-adjacent cells

### Color and export
- Tone gains: sparse least squares over shared-edge brightness, log space, λ = 0.3
- Palette: 48 colors (4 reserved for water), saturation above 110 compressed × 0.4
- Water: `b > g + 15` and `b > r + 25`, connected clumps ≥ 150 px at full resolution
- DZI: 16 levels, 512-px PNG tiles, palette applied per level, exported one tile row at a time

</details>

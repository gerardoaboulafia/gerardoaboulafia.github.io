# gerardoaboulafia.github.io

Personal portfolio and blog of **Gerardo Aboulafia** — Data Architect at MetLife and Data Science student. Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), deployed to GitHub Pages.

**Live:** https://gerardoaboulafia.github.io

## Tech stack

- **Astro 5** — static site generator
- **Tailwind CSS 4** (via `@tailwindcss/vite`) with the typography plugin
- **Content Collections** (`src/content/`) for projects and blog posts, validated with Zod
- **GitHub Pages** deploy via GitHub Actions (`.github/workflows/deploy.yml`)

## Project structure

```text
src/
├── components/      # Reusable UI (ProjectCard)
├── content/
│   ├── projects/    # Project entries (Markdown + frontmatter)
│   ├── blog/        # Blog posts (Markdown + frontmatter)
│   └── config.ts    # Collection schemas
├── layouts/         # BaseLayout (head/meta, nav, theme toggle)
├── pages/           # Routes (home, projects, blog, resume)
└── styles/          # Global CSS
public/              # Static assets (images, resume.pdf, favicon)
```

## Adding content

Create a Markdown file in `src/content/projects/` or `src/content/blog/`. Frontmatter fields are defined in [`src/content/config.ts`](src/content/config.ts) — a project needs `title`, `year`, and `summary`, plus optional `stack`, `repo`, `report`, and `featured`. Set `featured: true` to surface a project on the home page.

## Commands

Run from the project root:

| Command           | Action                                   |
| :---------------- | :--------------------------------------- |
| `npm install`     | Install dependencies                     |
| `npm run dev`     | Start the dev server at `localhost:4321` |
| `npm run build`   | Build the production site to `./dist/`   |
| `npm run preview` | Preview the production build locally     |

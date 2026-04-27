# FA-T-T.github.io

This site is now an Astro static site deployed to GitHub Pages through GitHub Actions.

The main content model is intentionally small. The homepage is an academic profile with publications and repositories. Blog and notes are currently empty styled entry pages, with a single reusable writing template in `templates/content-template.md`. Public repositories, skills, experiment packages, and toolkits all live under the unified project model in `src/data/projects.json`.

Project pages are built from repository manifests. During `npm run build`, `scripts/sync-projects.mjs` reads `src/data/projects.json`, fetches each configured GitHub repository tree, caches previewable text files under `public/project-data`, and lets the browser render the static manifest. The deployed site does not call the GitHub API at runtime.

To add a project or skill, add one object to `src/data/projects.json`. Use `kind` to distinguish `repository`, `skill`, `experiment`, or `toolkit`; use `featuredPaths` to choose the first files the viewer should prefer. Markdown, shell scripts, Python, text, LaTeX, JSON, YAML, and PDF files are supported by the current viewer.

The visual direction is split by section: the homepage is academic, the blog index is terminal/geek styled, the notes index is paper-like, and project pages use a macOS-window style around the repository browser.

Run locally with:

```bash
npm install
npm run dev
```

Build and validate with:

```bash
npm run check
npm run build
```

Deployment happens from `main` through `.github/workflows/deploy.yml`.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectsPath = path.join(root, "src", "data", "projects.json");
const outputRoot = path.join(root, "public", "project-data");
const maxPreviewBytes = 220_000;
const maxPreviewFiles = 140;

const previewExtensions = new Set([
  ".md",
  ".mdx",
  ".markdown",
  ".txt",
  ".text",
  ".py",
  ".sh",
  ".bash",
  ".zsh",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".tex",
  ".bib",
  ".css",
  ".html",
  ".rs",
  ".go",
  ".c",
  ".cpp",
  ".h",
  ".hpp"
]);

const previewNames = new Set([
  "README",
  "README.md",
  "LICENSE",
  "Makefile",
  "Dockerfile",
  "requirements.txt",
  "environment.yml",
  "pyproject.toml",
  "setup.py"
]);

const ignoredSegments = new Set([
  ".git",
  ".github",
  ".ipynb_checkpoints",
  "__pycache__",
  "node_modules",
  "dist",
  "build",
  ".venv",
  "venv",
  "site",
  ".mypy_cache",
  ".pytest_cache"
]);

function apiHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "fattt-personal-site"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function rawUrl(repo, branch, filePath) {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function safeOutputPath(filePath) {
  const parts = filePath.split("/").filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error(`Unsafe file path: ${filePath}`);
  }
  return path.join(...parts);
}

function shouldIgnore(filePath) {
  return filePath.split("/").some((segment) => ignoredSegments.has(segment));
}

function extensionOf(filePath) {
  return path.extname(filePath).toLowerCase();
}

function isPreviewable(file) {
  if (file.type !== "blob") return false;
  if (shouldIgnore(file.path)) return false;
  if (typeof file.size === "number" && file.size > maxPreviewBytes) return false;
  const name = path.basename(file.path);
  const ext = extensionOf(file.path);
  return previewExtensions.has(ext) || previewNames.has(name);
}

function isPdf(file) {
  return file.type === "blob" && extensionOf(file.path) === ".pdf" && !shouldIgnore(file.path);
}

function sortFiles(files, featuredPaths = []) {
  const featured = new Map(featuredPaths.map((filePath, index) => [filePath, index]));

  return [...files].sort((a, b) => {
    const aFeatured = featured.has(a.path) ? featured.get(a.path) : Number.MAX_SAFE_INTEGER;
    const bFeatured = featured.has(b.path) ? featured.get(b.path) : Number.MAX_SAFE_INTEGER;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;
    const aDepth = a.path.split("/").length;
    const bDepth = b.path.split("/").length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.path.localeCompare(b.path);
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: apiHeaders() });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: apiHeaders() });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.text();
}

async function syncProject(project) {
  const [owner, repoName] = project.repo.split("/");
  if (!owner || !repoName) {
    throw new Error(`Invalid repository name for ${project.slug}: ${project.repo}`);
  }

  const projectDir = path.join(outputRoot, project.slug);
  await mkdir(path.join(projectDir, "files"), { recursive: true });

  const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${encodeURIComponent(
    project.branch
  )}?recursive=1`;
  const treeData = await fetchJson(treeUrl);
  const tree = Array.isArray(treeData.tree) ? treeData.tree : [];

  const files = sortFiles(
    tree.filter((item) => item.type === "blob" && !shouldIgnore(item.path)),
    project.featuredPaths
  ).map((item) => ({
    path: item.path,
    type: item.type,
    size: item.size ?? null,
    extension: extensionOf(item.path),
    rawUrl: rawUrl(project.repo, project.branch, item.path),
    preview: false,
    cachedPath: null
  }));

  const previewCandidates = sortFiles(
    files.filter((file) => isPreviewable(file)),
    project.featuredPaths
  ).slice(0, maxPreviewFiles);
  const previewPaths = new Set(previewCandidates.map((file) => file.path));
  const pdfPaths = new Set(files.filter((file) => isPdf(file)).map((file) => file.path));

  for (const file of files) {
    if (previewPaths.has(file.path)) {
      const text = await fetchText(file.rawUrl);
      const localPath = path.join(projectDir, "files", safeOutputPath(file.path));
      await mkdir(path.dirname(localPath), { recursive: true });
      await writeFile(localPath, text, "utf8");
      file.preview = true;
      file.cachedPath = `/project-data/${project.slug}/files/${file.path}`;
    } else if (pdfPaths.has(file.path)) {
      file.preview = true;
      file.cachedPath = file.rawUrl;
    }
  }

  const manifest = {
    ...project,
    syncedAt: new Date().toISOString(),
    truncated: Boolean(treeData.truncated),
    fileCount: files.length,
    previewCount: files.filter((file) => file.preview).length,
    files
  };

  await writeFile(path.join(projectDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`synced ${project.slug}: ${manifest.fileCount} files, ${manifest.previewCount} previewable`);
}

async function writeFailure(project, error) {
  const projectDir = path.join(outputRoot, project.slug);
  await mkdir(projectDir, { recursive: true });
  const manifest = {
    ...project,
    syncedAt: new Date().toISOString(),
    truncated: false,
    fileCount: 0,
    previewCount: 0,
    error: error instanceof Error ? error.message : String(error),
    files: []
  };
  await writeFile(path.join(projectDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.warn(`failed ${project.slug}: ${manifest.error}`);
}

const projects = JSON.parse(await readFile(projectsPath, "utf8"));
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const project of projects) {
  try {
    await syncProject(project);
  } catch (error) {
    await writeFailure(project, error);
  }
}

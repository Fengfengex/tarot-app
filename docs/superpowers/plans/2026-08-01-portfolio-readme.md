# Portfolio README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic README with an accurate, English-language portfolio page that showcases the application, screenshots, engineering work, and correct GitHub URL.

**Architecture:** Keep all presentation content in the root `README.md` and reference the three screenshots from `docs/` with relative paths. Use GitHub-compatible Markdown and minimal inline HTML for a compact two-column screenshot comparison.

**Tech Stack:** Markdown, HTML, Three.js, MediaPipe Hands, JavaScript, WebGL

## Global Constraints

- All README copy must be in polished English.
- The canonical repository is `https://github.com/Fengfengex/tarot-app`.
- The clone command must be `git clone https://github.com/Fengfengex/tarot-app.git`.
- Do not include an unverified live-demo URL.
- Do not claim backend services, custom-trained models, automated tests, deployment infrastructure, or a license file.
- Use only features and controls verified in `index.html`.

---

### Task 1: Build and verify the portfolio README

**Files:**
- Modify: `README.md`
- Verify: `docs/main.png`
- Verify: `docs/mid-card.png`
- Verify: `docs/result.png`

**Interfaces:**
- Consumes: the current UI behavior in `index.html` and screenshot assets under `docs/`
- Produces: a self-contained GitHub project overview rendered from `README.md`

- [x] **Step 1: Replace the generic README**

Write an English README containing:

- `Ether Tarot` title, concise positioning statement, and verified technology badges
- A hero screenshot using `docs/main.png`
- A two-column interaction showcase using `docs/mid-card.png` and `docs/result.png`
- Sections for highlights, interaction flow, engineering details, stack, setup, controls, structure, and browser notes
- The canonical repository and exact clone command from the global constraints

- [x] **Step 2: Validate content and asset references**

Run:

```powershell
$repo = 'D:\VS_code\project\tarot-app'
$readme = Get-Content -Raw -LiteralPath (Join-Path $repo 'README.md')
@('docs/main.png', 'docs/mid-card.png', 'docs/result.png') | ForEach-Object {
    if (-not (Test-Path -LiteralPath (Join-Path $repo $_))) { throw "Missing asset: $_" }
    if ($readme -notmatch [regex]::Escape($_)) { throw "README does not reference: $_" }
}
if ($readme -notmatch [regex]::Escape('https://github.com/Fengfengex/tarot-app.git')) {
    throw 'Incorrect or missing clone URL'
}
if ($readme -match 'yourusername|TBD|TODO') {
    throw 'README contains placeholder content'
}
```

Expected: command exits successfully without output.

- [x] **Step 3: Check Markdown whitespace and repository diff**

Run:

```powershell
git -c safe.directory='D:/VS_code/project/tarot-app' -C 'D:\VS_code\project\tarot-app' diff --check
git -c safe.directory='D:/VS_code/project/tarot-app' -C 'D:\VS_code\project\tarot-app' diff -- README.md
```

Expected: `diff --check` reports no errors; the README diff contains only the intended portfolio content.

- [x] **Step 4: Commit the documentation update**

Run:

```powershell
git -c safe.directory='D:/VS_code/project/tarot-app' -C 'D:\VS_code\project\tarot-app' add README.md docs/main.png docs/mid-card.png docs/result.png docs/superpowers/plans/2026-08-01-portfolio-readme.md
git -c safe.directory='D:/VS_code/project/tarot-app' -C 'D:\VS_code\project\tarot-app' commit -m "docs: create portfolio project showcase"
```

Expected: Git records the rewritten README, screenshots, and implementation plan in one documentation commit.

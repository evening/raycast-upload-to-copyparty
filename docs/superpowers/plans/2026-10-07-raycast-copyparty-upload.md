# Raycast Copyparty Upload Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Raycast extension that uploads a clipboard file path to Copyparty, copies the generated share URL, and shows the actual `Clipboard.read()` field values for debugging.

**Architecture:** Start from Raycast's official Detail command template. Use Raycast's Clipboard API to distinguish file, text, and HTML payloads, Node filesystem/network APIs for the PUT upload, and Raycast secure preferences for credentials. The first version will not handle raw clipboard bitmap data.

**Tech Stack:** Raycast API, React, TypeScript, Node.js, npm.

**Spec:** `docs/superpowers/specs/2026-10-07-raycast-copyparty-upload-design.md`

## Global Constraints

- Create and work in `upload-to-copyparty-extension`.
- Do not add a Swift helper or third-party runtime dependency.
- Upload only a local file path returned by `Clipboard.read()`.
- Show the actual clipboard field values Raycast returns for debugging, including text, HTML, and a file path when present. Never display credentials.
- Store the password as a Raycast `password` preference and never log credentials.
- Copy the Copyparty-generated share URL only after a successful upload.
- Do not add or run tests unless the user asks.

---

### Task 1: Scaffold the Raycast command and implement clipboard upload

**Files:**
- Create: `package.json` (Raycast Detail template metadata, command declaration, and preferences)
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/upload-clipboard.tsx` (clipboard inspection, filename form, PUT upload, result/error feedback)
- Create: `README.md` (local setup, preferences, clipboard support and bitmap limitation)

**Interfaces:**
- Consumes: `Clipboard.read()` result and preferences `uploadUrl`, `username`, and `password`.
- Produces: a Raycast command named `upload-clipboard`; for a file path, a form with editable filename prefilled from the basename; HTTPS PUT to the encoded filename under `uploadUrl` using Basic auth; copies the final Copyparty URL from the response.

- [ ] Scaffold the extension from Raycast's official Detail command template in this directory.
- [ ] Read the clipboard once when the command opens. For `file`, show a Form with the basename as its editable initial filename and display the raw `Clipboard.read()` fields for debugging. Otherwise, display the returned field values (`file`, `text`, and `html`) so the user can inspect exactly what Raycast exposes; do not display credentials.
- [ ] Add required upload URL, username, and secure password preferences; default the URL to `https://f.chuu.moe/files/` and username to `adm`.
- [ ] On submit, read the source file bytes, PUT to `uploadUrl + encodeURIComponent(filename)`, use HTTP Basic authentication, show a clear failure on HTTP/network errors, and copy the final valid HTTP(S) URL from Copyparty's successful response. Preserve leading/trailing spaces in valid filenames; reject only empty/whitespace-only names and path/control characters.
- [ ] Prevent concurrent submissions from issuing duplicate PUT requests while an upload is in progress.
- [ ] Document import/setup, preference configuration, that clipboard values are shown in the command while debugging, and that screenshot bitmap uploads remain unsupported until diagnostics show Raycast exposes them as a file.
- [ ] Run the Raycast distribution build (`npm run build`) and inspect the final diff; do not run a test suite.
- [ ] Commit the completed extension.

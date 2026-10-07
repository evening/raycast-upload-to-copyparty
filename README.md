# Upload to Copyparty

This private Raycast command uploads one file copied to the clipboard and copies Copyparty's returned share URL.

## Set up

1. Install Node.js 22.22.2 or newer and run `npm install` in this directory.
2. In Raycast, use **Import Extension** and select this directory. Raycast may require you to sign in first.
3. Set the extension preferences: **Upload URL** is the HTTPS Copyparty folder URL (default `https://f.chuu.moe/files/`), **Username** defaults to `adm`, and **Password** is a required secure password preference.
4. Run `npm run dev` when developing locally. `npm run build` creates a distribution build without publishing it.

## Use

Copy a single local file in Finder, then run **Upload Clipboard to Copyparty**. Review or edit the prefilled filename and submit. On success, the command copies the HTTP(S) URL returned by Copyparty to the clipboard. The destination filename is URL encoded before the HTTPS PUT request.

The command reads `Clipboard.read()` once on opening. It supports a `file` value that points to a readable local file. When there is no usable file, the diagnostic view reports whether Raycast returned `file`, `text`, or `html`, with character counts and safe file metadata. It does not display clipboard text, HTML, or full file paths.

Clipboard screenshot bitmap uploads are currently unsupported. A CleanShot screenshot can be uploaded only if Raycast exposes it as a local file path in `Clipboard.read()`; the diagnostic view shows whether that happened.

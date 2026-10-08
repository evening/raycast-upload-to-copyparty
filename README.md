# Upload to Copyparty

This private Raycast command uploads a file or text copied to the clipboard and copies Copyparty's returned share URL.

## Set up

1. Install Node.js 22.22.2 or newer and run `npm install` in this directory.
2. In Raycast, use **Import Extension** and select this directory. Raycast may require you to sign in first.
3. Set the extension preferences: **Upload URL** is the Copyparty folder URL (https:// or http://) (default `https://copyparty.example.com/files/`), **Username** defaults to `yourusername`, and **Password** is a required secure password preference.
4. Run `npm run dev` when developing locally. `npm run build` creates a distribution build without publishing it.

## Use

Copy a local file or text, then run **Upload Clipboard to Copyparty**. The upload form shows an editable filename followed by the source file path or the exact text that will be uploaded. If Raycast provides both plain text and HTML, plain text is used. If it provides only HTML, the HTML source is uploaded as `clipboard.txt`. Review or edit the filename, then submit on the same screen. On success, the command copies the HTTP(S) URL returned by Copyparty to the clipboard and returns to Raycast search. The destination filename is URL encoded before the HTTPS PUT request.

Clipboard screenshot bitmap uploads are currently unsupported. A CleanShot screenshot can be uploaded only if Raycast exposes it as a local file path in `Clipboard.read()`.

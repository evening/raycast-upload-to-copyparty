# Raycast Copyparty Upload Extension

## Goal

Create a private Raycast extension in `upload-to-copyparty-extension` that uploads clipboard content to the user's Copyparty server and copies the returned share URL.

## First-version scope

- One Raycast command reads the current clipboard when launched.
- If Raycast exposes a local file path, show an editable filename prefilled from that file's basename. Upload that file on submit.
- If no file path is exposed, show a diagnostic view identifying the clipboard fields Raycast returned (text, HTML, file path, or none). Do not attempt to interpret or upload raw image bitmap data in this version.
- Keep host/volume URL and username configurable in extension preferences; store the password as a secure Raycast password preference.
- Upload the file bytes with HTTPS `PUT` and Basic authentication, matching the successful curl flow. Parse Copyparty's response for its generated share URL and copy that URL to the clipboard.
- Report missing clipboard data, network/auth failures, and an unrecognized response clearly.

## Design choices

Use Raycast's documented `Clipboard.read()` API and Node file/network APIs. No native Swift helper, external uploader binary, background process, or third-party runtime dependency. This keeps the first implementation small and makes actual clipboard behavior observable before adding image extraction support.

Raycast's Clipboard API documents clipboard reads as text, file path, or HTML. CleanShot offers a screenshot-to-clipboard action, but its exact representation may vary. Therefore, raw bitmap upload is explicitly deferred; the diagnostic view will reveal whether the extension API exposes a usable file path for the screenshot.

## User flow

1. Run **Upload Clipboard to Copyparty** in Raycast.
2. For a clipboard file path, review/edit the prefilled destination filename and press Enter to upload.
3. On success, the returned Copyparty URL is copied to the clipboard and Raycast confirms completion.
4. For unsupported clipboard payloads, Raycast shows which clipboard fields were available and explains that no upload occurred.

## Configuration and security

The server URL, username, and password are extension preferences. The password uses Raycast's secure `password` preference type. Requests use HTTPS and HTTP Basic authentication. Do not log or display the password or Authorization header. The URL copied after upload is the server-generated response URL, including its access key when Copyparty returns one.

## Verification

Check that the extension manifest and TypeScript compile. Then exercise the command in Raycast with a Finder-copied file and a CleanShot screenshot; the screenshot run is diagnostic only in this version. Confirm that successful file uploads copy the generated response URL.

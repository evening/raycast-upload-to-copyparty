# Raycast Copyparty Upload Extension

## Goal

Create a private Raycast extension in `upload-to-copyparty-extension` that uploads clipboard content to the user's Copyparty server and copies the returned share URL.

## First-version scope

- One Raycast command reads the current clipboard when launched.
- If Raycast exposes a local file path, show an editable filename prefilled from that file's basename and the returned `file`, `text`, and `html` values. Upload that file on submit.
- Show the actual values Raycast returns for clipboard fields (text, HTML, and file path) while debugging, including when no file can be uploaded. Use JSON string notation to make line breaks and special characters visible. Do not attempt to interpret or upload raw image bitmap data in this version.
- Keep host/volume URL and username configurable in extension preferences; store the password as a secure Raycast password preference.
- Upload the file bytes with HTTPS `PUT` and Basic authentication, matching the successful curl flow. Preserve valid filenames with leading or trailing spaces. Parse the final valid HTTP(S) URL from Copyparty's response and copy that URL to the clipboard.
- Report missing clipboard data, network/auth failures, and an unrecognized response clearly.

## Design choices

Use Raycast's documented `Clipboard.read()` API and Node file/network APIs. No native Swift helper, external uploader binary, background process, or third-party runtime dependency. This keeps the first implementation small and makes actual clipboard behavior observable before adding image extraction support.

Raycast's Clipboard API documents clipboard reads as text, file path, or HTML. CleanShot offers a screenshot-to-clipboard action, but its exact representation may vary. Therefore, raw bitmap upload is explicitly deferred; the diagnostic view will show the actual fields and values Raycast exposes, revealing whether the API provides a usable file path for the screenshot.

## User flow

1. Run **Upload Clipboard to Copyparty** in Raycast.
2. For a clipboard file path, review/edit the prefilled destination filename and press Enter to upload.
3. On success, the returned Copyparty URL is copied to the clipboard and Raycast confirms completion.
4. The command shows the clipboard field values Raycast returned for debugging. For unsupported payloads, it explains that no upload occurred.

## Configuration and security

The server URL, username, and password are extension preferences. The password uses Raycast's secure `password` preference type. Requests use HTTPS and HTTP Basic authentication. Do not log or display the password or Authorization header. Clipboard values are intentionally visible in the command during this debugging phase. The URL copied after upload is the server-generated response URL, including its access key when Copyparty returns one.

## Verification

Check that the extension manifest and TypeScript compile. Then exercise the command in Raycast with a Finder-copied file and a CleanShot screenshot; the screenshot run is diagnostic only in this version. Confirm that successful file uploads copy the generated response URL.

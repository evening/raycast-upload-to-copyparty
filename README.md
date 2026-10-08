# Upload to Copyparty

Upload a copied file or text to Copyparty and copy its share link using Raycast.

## Features

- Upload local files or plain text directly from your clipboard.
- Edit the filename before uploading.
- Automatic link copying to the clipboard on success.
- Instantly returns you to Raycast search.

## Install

1. Clone this repository: `git clone https://github.com/evening/raycast-upload-to-copyparty.git`
2. Run `npm ci` to install dependencies.
3. Open Raycast -> Extensions -> **Import Extension** and select the cloned directory.
4. Run `npm run dev` to start development.

## Configure

In Raycast Settings -> Extensions -> Upload to Copyparty, configure:

- **Upload URL**: The Copyparty folder URL (e.g. `https://copyparty.example.com/uploads/` or `http://` for local). _Note: over HTTP the password is sent in clear text on the local network._
- **Username**: Optional. Only needed if the Copyparty server runs with `--usernames`.
- **Password**: Required. The authentication password.

## Usage

1. Copy a file in Finder, or select and copy text.
2. Open Raycast and run **Upload Clipboard to Copyparty**.
3. Confirm or rename the destination file.
4. Hit **Submit** (Cmd+Enter). The Copyparty URL will be copied to your clipboard.

## Limitations

- Clipboard screenshot bitmap uploads are currently unsupported. A CleanShot screenshot can be uploaded only if Raycast exposes it as a local file path.
- By default, if the file exists, behavior depends on the Copyparty server configuration.

## Troubleshooting

- **Upload failed (Copyparty rejected the password...)**: Check your permissions, username, and password.
- **Upload folder not found**: Verify that the Upload URL exists on the server.
- **File too large**: The server rejected the file size.
- **Network errors**: Check your internet connection and verify if the URL uses https:// or http:// correctly.

## Development

- `npm run build`: Build the extension.
- `npm run fix`: Lint and format code.
- `npm test`: Run tests using the native Node runner.

### Contributing

Run `npm ci && npm run build && npx tsc --noEmit && npx eslint src && npx prettier --check . && npm test`. Please submit one change per PR.

## License

MIT

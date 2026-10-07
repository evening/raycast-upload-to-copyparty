import { Action, ActionPanel, Clipboard, Detail, Form, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { useEffect, useRef, useState } from "react";

type Preferences = {
  uploadUrl: string;
  username: string;
  password: string;
};

type ClipboardFields = {
  file?: string;
  text?: string;
  html?: string;
};

type Inspection = {
  fields: ClipboardFields;
  fileName?: string;
  fileSize?: number;
  uploadableFile?: string;
};

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "inspection"; inspection: Inspection }
  | { kind: "complete" };

export default function Command() {
  const didReadClipboard = useRef(false);
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (didReadClipboard.current) return;
    didReadClipboard.current = true;

    void (async () => {
      try {
        const content = await Clipboard.read();
        const fields: ClipboardFields = {
          file: content.file?.toString(),
          text: content.text,
          html: content.html,
        };
        const inspection: Inspection = { fields };

        if (fields.file) {
          inspection.fileName = basename(fields.file);
          try {
            const info = await stat(fields.file);
            if (info.isFile()) {
              inspection.fileSize = info.size;
              inspection.uploadableFile = fields.file;
            }
          } catch {
            // The clipboard can keep a path after its source file disappears.
          }
        }

        setView({ kind: "inspection", inspection });
      } catch {
        setView({ kind: "error", message: "Raycast could not read the clipboard." });
      }
    })();
  }, []);

  async function upload(filePath: string, values: { filename: string }) {
    const filename = values.filename.trim();
    if (!filename || filename === "." || filename === ".." || /[\\/\x00-\x1f\x7f]/.test(filename)) {
      await showToast({ style: Toast.Style.Failure, title: "Enter a valid file name" });
      return;
    }

    let destination: URL;
    const preferences = getPreferenceValues<Preferences>();
    try {
      const base = new URL(preferences.uploadUrl);
      if (base.protocol !== "https:" || base.search || base.hash) throw new Error("Invalid URL");
      const folder = base.toString().endsWith("/") ? base.toString() : `${base.toString()}/`;
      destination = new URL(`${folder}${encodeURIComponent(filename)}`);
    } catch {
      await showToast({ style: Toast.Style.Failure, title: "Invalid upload URL", message: "Set an HTTPS folder URL in extension preferences." });
      return;
    }

    setIsUploading(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Uploading file" });
    try {
      const bytes = await readFile(filePath);
      const authorization = Buffer.from(`${preferences.username}:${preferences.password}`, "utf8").toString("base64");
      const response = await fetch(destination, {
        method: "PUT",
        headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/octet-stream" },
        body: bytes,
        redirect: "error",
      });

      if (!response.ok) {
        toast.style = Toast.Style.Failure;
        toast.title = `Upload failed (HTTP ${response.status})`;
        return;
      }

      const responseBody = await response.text();
      const result = responseBody
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^https?:\/\/\S+$/.test(line))
        .at(-1);
      if (!result) {
        toast.style = Toast.Style.Failure;
        toast.title = "Upload completed, but no share URL was returned";
        return;
      }

      await Clipboard.copy(result);
      toast.style = Toast.Style.Success;
      toast.title = "Copyparty link copied";
      setView({ kind: "complete" });
    } catch {
      toast.style = Toast.Style.Failure;
      toast.title = "Upload failed";
      toast.message = "Check the file, network, and Copyparty settings.";
    } finally {
      setIsUploading(false);
    }
  }

  if (view.kind === "loading") return <Detail isLoading markdown="Reading clipboard…" />;
  if (view.kind === "error") return <Detail markdown={view.message} />;
  if (view.kind === "complete") return <Detail markdown="## Upload complete\n\nThe Copyparty link is on your clipboard." />;

  const { fields, fileName, fileSize, uploadableFile } = view.inspection;
  if (uploadableFile && fileName) {
    return (
      <Form
        isLoading={isUploading}
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Upload to Copyparty" onSubmit={(values: { filename: string }) => upload(uploadableFile, values)} />
          </ActionPanel>
        }
      >
        <Form.Description title="Source" text={`Copied file: ${fileName}${fileSize === undefined ? "" : ` (${fileSize} bytes)`}`} />
        <Form.TextField id="filename" title="Upload as" defaultValue={fileName} />
      </Form>
    );
  }

  const metadata = [
    `- File: ${fields.file ? "present" : "absent"}`,
    ...(fields.file ? [`- File name: ${escapeMarkdown(fileName ?? "unavailable")}`, `- File size: ${fileSize === undefined ? "unavailable" : `${fileSize} bytes`}`] : []),
    `- Text: ${fields.text === undefined ? "absent" : `present (${fields.text.length} characters)`}`,
    `- HTML: ${fields.html === undefined ? "absent" : `present (${fields.html.length} characters)`}`,
  ].join("\n");

  return (
    <Detail
      markdown={`## Clipboard inspection\n\n${metadata}\n\nNo readable local file was found. Copy a file in Finder and run this command again. Screenshot bitmaps are not supported unless Raycast exposes them as a file path.`}
    />
  );
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}\[\]()#+.!|>-]/g, "\\$&");
}

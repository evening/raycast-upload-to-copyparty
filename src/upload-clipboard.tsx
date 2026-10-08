import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Form,
  Toast,
  getPreferenceValues,
  popToRoot,
  showToast,
} from "@raycast/api";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { buildDestination, findFinalHttpUrl, validateFilename } from "./lib/upload";
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

type UploadSource =
  | { kind: "file"; path: string; filename: string }
  | { kind: "text" | "html"; content: string; filename: "clipboard.txt" };

type Inspection = { fields: ClipboardFields; source?: UploadSource };

type ViewState =
  { kind: "loading" } | { kind: "error"; message: string } | { kind: "inspection"; inspection: Inspection };

export default function Command() {
  const didReadClipboard = useRef(false);
  const uploadInProgress = useRef(false);
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
          try {
            const info = await stat(fields.file);
            if (info.isFile()) {
              inspection.source = {
                kind: "file",
                path: fields.file,
                filename: basename(fields.file),
              };
            }
          } catch {
            // The clipboard can keep a path after its source file disappears.
          }
        }

        if (!inspection.source && fields.text !== undefined) {
          inspection.source = { kind: "text", content: fields.text, filename: "clipboard.txt" };
        } else if (!inspection.source && fields.html !== undefined) {
          inspection.source = { kind: "html", content: fields.html, filename: "clipboard.txt" };
        }

        setView({ kind: "inspection", inspection });
      } catch {
        setView({ kind: "error", message: "Raycast could not read the clipboard." });
      }
    })();
  }, []);

  async function upload(source: UploadSource, values: { filename: string }) {
    if (uploadInProgress.current) return;

    const filename = values.filename;
    const errorMsg = validateFilename(filename);
    if (errorMsg) {
      await showToast({ style: Toast.Style.Failure, title: "Enter a valid file name" });
      return;
    }

    let destination: URL;
    const preferences = getPreferenceValues<Preferences>();
    try {
      destination = buildDestination(preferences.uploadUrl, filename);
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid upload URL",
        message: "Set an HTTPS folder URL in extension preferences.",
      });
      return;
    }

    uploadInProgress.current = true;
    setIsUploading(true);
    try {
      const toast = await showToast({ style: Toast.Style.Animated, title: "Uploading file" });
      try {
        const bytes = source.kind === "file" ? await readFile(source.path) : Buffer.from(source.content, "utf8");
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
        const result = findFinalHttpUrl(responseBody);
        if (!result) {
          toast.style = Toast.Style.Failure;
          toast.title = "Upload completed, but no share URL was returned";
          return;
        }

        await Clipboard.copy(result);
        toast.style = Toast.Style.Success;
        toast.title = "Copyparty link copied";
        await popToRoot({ clearSearchBar: true });
      } catch {
        toast.style = Toast.Style.Failure;
        toast.title = "Upload failed";
        toast.message = "Check the file, network, and Copyparty settings.";
      }
    } finally {
      uploadInProgress.current = false;
      setIsUploading(false);
    }
  }

  if (view.kind === "loading") return <Detail isLoading markdown="Reading clipboard…" />;
  if (view.kind === "error") return <Detail markdown={view.message} />;

  const { fields, source } = view.inspection;
  if (source) {
    return <UploadForm source={source} isUploading={isUploading} onUpload={upload} />;
  }

  const debugFields = `    file: ${debugValue(fields.file)}\n    text: ${debugValue(fields.text)}\n    html: ${debugValue(fields.html)}`;

  return (
    <Detail
      markdown={`## Clipboard.read() values\n\n${debugFields}\n\nNo readable local file was found. Copy a file in Finder and run this command again. Screenshot bitmaps are not supported unless Raycast exposes them as a file path.`}
    />
  );
}

function UploadForm(props: {
  source: UploadSource;
  isUploading: boolean;
  onUpload: (source: UploadSource, values: { filename: string }) => Promise<void>;
}) {
  const { source, isUploading, onUpload } = props;
  return (
    <Form
      isLoading={isUploading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Upload to Copyparty"
            onSubmit={(values: { filename: string }) => onUpload(source, values)}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="filename" title="Upload as" defaultValue={source.filename} />
      <Form.Description
        title={source.kind === "file" ? "File path" : "Text to upload"}
        text={source.kind === "file" ? source.path : source.content}
      />
    </Form>
  );
}

function debugValue(value: string | undefined): string {
  return value === undefined ? "undefined" : JSON.stringify(value);
}

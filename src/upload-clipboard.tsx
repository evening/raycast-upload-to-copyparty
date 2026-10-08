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

type ClipboardFields = {
  file?: string;
  text?: string;
  html?: string;
};

type UploadSource =
  { kind: "file"; path: string; filename: string } | { kind: "text"; content: string; filename: string };

type Inspection = { source?: UploadSource };

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
        const inspection: Inspection = {};

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

        if (!inspection.source) {
          const content = fields.text || fields.html || "";
          if (content.trim()) {
            inspection.source = { kind: "text", content: content, filename: "clipboard.txt" };
          }
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
    if (validateFilename(filename)) {
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
        const reqUser = preferences.username || "x";
        const authorization = Buffer.from(`${reqUser}:${preferences.password}`, "utf8").toString("base64");
        const response = await fetch(destination, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${authorization}`,
            "Content-Type": "application/octet-stream",
            Accept: "url",
          },
          body: bytes,
          redirect: "error",
        });

        if (!response.ok) {
          toast.style = Toast.Style.Failure;
          toast.title = `Upload failed (HTTP ${response.status})`;
          return;
        }

        const responseBody = await response.text();
        let result: string | undefined;
        try {
          const parsed = new URL(responseBody.trim());
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            result = parsed.toString();
          }
        } catch {
          // not a single valid URL
        }
        if (!result) result = findFinalHttpUrl(responseBody);
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

  const { source } = view.inspection;
  if (source) {
    return <UploadForm source={source} isUploading={isUploading} onUpload={upload} />;
  }

  return (
    <Detail
      markdown={`## Nothing to upload\n\nCopy a file in Finder or some text, then run this command again. Images copied as pixels (for example, screenshots sent straight to the clipboard) are not supported yet.`}
    />
  );
}

function UploadForm(props: {
  source: UploadSource;
  isUploading: boolean;
  onUpload: (source: UploadSource, values: { filename: string }) => Promise<void>;
}) {
  const { source, isUploading, onUpload } = props;
  const [filenameError, setFilenameError] = useState<string | undefined>();

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
      <Form.TextField
        id="filename"
        title="Upload as"
        defaultValue={source.filename}
        error={filenameError}
        onChange={(newValue) => {
          setFilenameError(validateFilename(newValue));
        }}
        onBlur={(event) => {
          setFilenameError(validateFilename(event.target.value));
        }}
      />
      <Form.Description
        title={source.kind === "file" ? "File path" : "Text to upload"}
        text={source.kind === "file" ? source.path : source.content}
      />
    </Form>
  );
}

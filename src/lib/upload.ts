export function validateFilename(filename: string): string | undefined {
  const hasControlCharacter = [...filename].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (!filename.trim()) return "Filename cannot be blank";
  if (filename === "." || filename === "..") return "Filename cannot be '.' or '..'";
  if (/[\\/]/.test(filename)) return "Filename cannot contain slashes";
  if (hasControlCharacter) return "Filename cannot contain control characters";
  return undefined;
}

export function buildDestination(baseUrl: string, filename: string): URL {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:") throw new Error("Invalid URL: must be https");
  if (base.search || base.hash) throw new Error("Invalid URL: must not contain query or hash");
  const folder = base.toString().endsWith("/") ? base.toString() : `${base.toString()}/`;
  return new URL(`${folder}${encodeURIComponent(filename)}`);
}

export function findFinalHttpUrl(body: string): string | undefined {
  let finalUrl: string | undefined;
  for (const line of body.split(/\r?\n/)) {
    const candidate = line.trim();
    try {
      const parsed = new URL(candidate);
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname) {
        finalUrl = parsed.toString();
      }
    } catch {
      // Other response lines are not share URLs.
    }
  }
  return finalUrl;
}

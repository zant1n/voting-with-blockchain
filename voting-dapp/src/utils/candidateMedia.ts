const DEFAULT_IMAGE = "/images/default.svg";

function parseNumericId(value: string): number | null {
  const cleaned = value.trim();
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }
  const id = Number.parseInt(cleaned, 10);
  return Number.isFinite(id) ? id : null;
}

export function getCandidateImageUrl(input: number | string): string {
  if (typeof input === "number" && Number.isInteger(input) && input >= 0) {
    return `/images/candidate${input}.svg`;
  }

  const text = String(input || "").trim();
  if (!text) {
    return DEFAULT_IMAGE;
  }

  if (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("ipfs://")) {
    return text;
  }

  if (text.startsWith("/")) {
    return text;
  }

  const numeric = parseNumericId(text);
  if (numeric !== null) {
    return `/images/candidate${numeric}.svg`;
  }

  return `/images/${text}`;
}

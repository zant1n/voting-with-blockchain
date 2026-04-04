export function getCandidateImageUrl(imgHash: string): string {
  if (!imgHash) {
    return "https://placehold.co/400x220/e5e7eb/111827?text=Candidate";
  }

  if (imgHash.startsWith("http://") || imgHash.startsWith("https://")) {
    return imgHash;
  }

  return `https://ipfs.io/ipfs/${imgHash}`;
}

export interface CandidateImage {
  id: number;
  name: string;
  imageUrl: string;
  fallbackUrl: string;
}


export const candidateImages: CandidateImage[] = [
  {
    id: 0,
    name: "Alice Johnson",
    imageUrl: "/images/candidate0.jpg",
    fallbackUrl: "https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Alice"
  },
  {
    id: 1,
    name: "Bob Smith",
    imageUrl: "/images/candidate1.jpg",
    fallbackUrl: "https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Bob"
  },
  {
    id: 2,
    name: "Carol Davis",
    imageUrl: "/images/candidate2.jpg",
    fallbackUrl: "https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=Carol"
  },
  {
    id: 3,
    name: "David Wilson",
    imageUrl: "/images/candidate3.jpg",
    fallbackUrl: "https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=David"
  }
];


export function getCandidateImageUrl(candidateId: number): string {
  const candidate = candidateImages.find(c => c.id === candidateId);
  return candidate?.imageUrl || `/images/default.jpg`;
}


export function getFallbackImageUrl(candidateId: number): string {
  const candidate = candidateImages.find(c => c.id === candidateId);
  return candidate?.fallbackUrl || "https://via.placeholder.com/300x300/CCCCCC/FFFFFF?text=Candidate";
}

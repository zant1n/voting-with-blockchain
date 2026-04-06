export const candidateImageUrls: { [key: number]: string } = {
  0: "/images/candidate0.svg",  // Cinderella for Alice Johnson
  1: "/images/candidate1.svg",  // Prince Charming for Bob Smith
  2: "/images/candidate2.svg",  // Belle for Carol Davis
  3: "/images/candidate3.svg",  // Aladdin for David Wilson
};

export const defaultImageUrl = "/images/default.svg";

export function getCandidateImageUrl(candidateId: number): string {
  return candidateImageUrls[candidateId] || defaultImageUrl;
}

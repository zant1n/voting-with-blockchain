import { NextResponse } from 'next/server';
import { getContract } from '@/utils/web3Setup';

export async function GET() {
  try {
    const contract = await getContract();
    const candidateCount = await contract.getCandidateCount();
    const candidates = [];
    
    for (let i = 0; i < candidateCount; i++) {
      const candidate = await contract.candidates(i);
      candidates.push({
        id: i,
        name: candidate.name,
        voteCount: candidate.voteCount.toString()
      });
    }
    
    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

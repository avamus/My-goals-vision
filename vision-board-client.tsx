"use client";

import { useSearchParams } from 'next/navigation';
import VisionBoard from './vision-board';

export default function VisionBoardClient() {
  const searchParams = useSearchParams();
  const memberIdFromUrl = searchParams.get('memberId');
  const teamIdFromUrl = searchParams.get('teamId');
  
  return (
    <VisionBoard 
      memberId={memberIdFromUrl || undefined} 
      teamId={teamIdFromUrl || undefined} 
    />
  );
}

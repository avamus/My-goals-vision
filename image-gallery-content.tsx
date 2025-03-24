"use client";

import { useSearchParams } from 'next/navigation';
import { ImageGallery } from './image-gallery';

export default function ImageGalleryClient() {
  const searchParams = useSearchParams();
  const memberIdFromUrl = searchParams.get('memberId');
  const teamIdFromUrl = searchParams.get('teamId');
  
  return (
    <ImageGallery 
      memberId={memberIdFromUrl || undefined} 
      teamId={teamIdFromUrl || undefined} 
    />
  );
}

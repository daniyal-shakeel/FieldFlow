'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { usePdfStore } from '@/store/usePdfStore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer/Footer';

const UploadZone = dynamic(
  () => import('@/components/Upload/UploadZone').then((m) => m.UploadZone),
  { ssr: false }
);

const DraftsModal = dynamic(
  () => import('@/components/Toolbar/DraftsModal').then((m) => m.DraftsModal),
  { ssr: false }
);

export default function UploadPage() {
  const rawFile = usePdfStore((state) => state.rawFile);
  const router = useRouter();

  useEffect(() => {
    if (rawFile) {
      router.push('/editor');
    }
  }, [rawFile, router]);

  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans transition-colors duration-300 bg-canvas text-ink">
      <Header />
      <main className="flex-1 flex flex-col">
        <UploadZone />
      </main>
      <DraftsModal />
      <Footer />
    </div>
  );
}

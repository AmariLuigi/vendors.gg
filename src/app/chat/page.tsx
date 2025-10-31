'use client';

import { Suspense } from 'react';
import { ChatPageContent } from '@/components/chat/ChatPageContent';

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-background">
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
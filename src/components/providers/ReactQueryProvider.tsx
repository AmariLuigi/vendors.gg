'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Props = {
  children: React.ReactNode;
};

export default function ReactQueryProvider({ children }: Props) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000, // 1 minute
          gcTime: 300_000, // 5 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: 1,
        },
      },
    })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
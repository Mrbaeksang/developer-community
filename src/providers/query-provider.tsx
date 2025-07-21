'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 5분간 fresh하게 유지
        staleTime: 5 * 60 * 1000,
        // 10분간 캐시 유지
        gcTime: 10 * 60 * 1000,
        // 에러 시 3번까지 재시도
        retry: 3,
        // 백그라운드에서 자동 재검증
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // 에러 발생 시 재시도 지연
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // 뮤테이션 에러 시 재시도 안함
        retry: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}
'use client'

import { useEffect } from 'react'
import { Button } from './button'
import { AlertCircle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">문제가 발생했습니다</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
      </div>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  )
}

export function ErrorPage() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mb-4">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
      </div>
      <Button onClick={() => window.location.href = '/'}>
        홈으로 돌아가기
      </Button>
    </div>
  )
}
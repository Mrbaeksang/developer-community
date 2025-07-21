'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 에러 로깅 서비스로 전송 (예: Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <DefaultErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>문제가 발생했습니다</CardTitle>
          <CardDescription>
            예상치 못한 오류가 발생했습니다. 
            {error?.message && (
              <span className="block mt-2 text-sm font-mono text-muted-foreground">
                {error.message}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            {resetError && (
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 특정 컴포넌트용 에러 핸들러 컴포넌트
interface ErrorStateProps {
  error: string | Error
  retry?: () => void
  className?: string
}

export function ErrorState({ error, retry, className = '' }: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className={`text-center p-8 ${className}`}>
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">오류가 발생했습니다</h3>
      <p className="text-muted-foreground mb-4">{errorMessage}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      )}
    </div>
  )
}

// 네트워크 에러용 컴포넌트
export function NetworkError({ retry }: { retry?: () => void }) {
  return (
    <ErrorState 
      error="네트워크 연결을 확인해주세요"
      retry={retry}
    />
  )
}

// 404 에러용 컴포넌트
export function NotFoundError() {
  return (
    <div className="text-center p-8">
      <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
      <h3 className="text-lg font-semibold mb-2">페이지를 찾을 수 없습니다</h3>
      <p className="text-muted-foreground mb-4">
        요청하신 페이지가 존재하지 않습니다.
      </p>
      <Button onClick={() => window.location.href = '/'}>
        <Home className="mr-2 h-4 w-4" />
        홈으로 돌아가기
      </Button>
    </div>
  )
}

// 권한 에러용 컴포넌트
export function UnauthorizedError() {
  return (
    <div className="text-center p-8">
      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">접근 권한이 없습니다</h3>
      <p className="text-muted-foreground mb-4">
        이 페이지에 접근할 권한이 없습니다. 로그인이 필요하거나 관리자 권한이 필요할 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={() => window.location.href = '/auth/login'}>
          로그인
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
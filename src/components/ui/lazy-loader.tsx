'use client'

import { Suspense, lazy, ComponentType, useState, useEffect, useRef } from 'react'
import { PostCardSkeleton } from './skeleton'

// 지연 로딩 래퍼 컴포넌트
interface LazyLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LazyLoader({ children, fallback, className }: LazyLoaderProps) {
  return (
    <Suspense fallback={fallback || <PostCardSkeleton />}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  )
}

// 동적 import 헬퍼 함수
export function createLazyComponent(
  importFn: () => Promise<{ default: ComponentType }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return function WrappedLazyComponent(props: Record<string, unknown>) {
    return (
      <Suspense fallback={fallback || <PostCardSkeleton />}>
        <LazyComponent {...(props as Record<string, unknown>)} />
      </Suspense>
    )
  }
}

// 뷰포트 기반 지연 로딩
interface ViewportLazyLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function ViewportLazyLoader({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '100px',
  once = true
}: ViewportLazyLoaderProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            setHasLoaded(true)
            observer.disconnect()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, once])

  return (
    <div ref={ref}>
      {(isVisible || hasLoaded) ? (
        <Suspense fallback={fallback || <PostCardSkeleton />}>
          {children}
        </Suspense>
      ) : (
        fallback || <PostCardSkeleton />
      )}
    </div>
  )
}

// 프리로드 헬퍼
export function preloadComponent(importFn: () => Promise<unknown>) {
  return importFn()
}

// 중요도 기반 로딩
interface PriorityLoaderProps {
  children: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  fallback?: React.ReactNode
}

export function PriorityLoader({ children, priority, fallback }: PriorityLoaderProps) {
  const [shouldLoad, setShouldLoad] = useState(priority === 'high')

  useEffect(() => {
    if (priority === 'medium') {
      // 짧은 지연 후 로드
      const timer = setTimeout(() => setShouldLoad(true), 100)
      return () => clearTimeout(timer)
    } else if (priority === 'low') {
      // 긴 지연 후 로드 (또는 사용자 상호작용 후)
      const timer = setTimeout(() => setShouldLoad(true), 500)
      return () => clearTimeout(timer)
    }
  }, [priority])

  if (!shouldLoad) {
    return fallback || <PostCardSkeleton />
  }

  return (
    <Suspense fallback={fallback || <PostCardSkeleton />}>
      {children}
    </Suspense>
  )
}

// 네트워크 상태 기반 로딩
export function NetworkAwareLoader({ children, fallback }: LazyLoaderProps) {
  const [isSlowNetwork, setIsSlowNetwork] = useState(false)

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as { connection?: { effectiveType?: string } }).connection
      setIsSlowNetwork(connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g')
    }
  }, [])

  if (isSlowNetwork) {
    return fallback || <PostCardSkeleton />
  }

  return (
    <Suspense fallback={fallback || <PostCardSkeleton />}>
      {children}
    </Suspense>
  )
}
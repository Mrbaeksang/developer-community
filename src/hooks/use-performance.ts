'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

// 성능 메트릭 인터페이스
interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay  
  cls?: number // Cumulative Layout Shift
  
  // 기타 중요 메트릭
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  
  // 메모리 사용량
  memory?: {
    used: number
    total: number
    limit: number
  }
  
  // 네트워크 정보
  connection?: {
    effectiveType: string
    rtt: number
    downlink: number
  }
}

// 성능 모니터링 훅
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const observerRef = useRef<PerformanceObserver | null>(null)

  const measureMetrics = useCallback(() => {
    const newMetrics: PerformanceMetrics = {}

    // Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0]
        newMetrics.ttfb = entry.responseStart - entry.requestStart
      }
    }

    // Memory API
    if ('memory' in performance) {
      const memoryInfo = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      newMetrics.memory = {
        used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)
      }
    }

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as { connection: { effectiveType: string; downlink: number; rtt: number } }).connection
      newMetrics.connection = {
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        downlink: connection.downlink
      }
    }

    setMetrics(prev => ({ ...prev, ...newMetrics }))
  }, [])

  useEffect(() => {
    // Core Web Vitals 측정
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP measurement not supported')
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            // Type assertion for FID entry which has processingStart property
            const fidEntry = entry as PerformanceEventTiming
            setMetrics(prev => ({ ...prev, fid: fidEntry.processingStart - fidEntry.startTime }))
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID measurement not supported')
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            // @ts-expect-error - CLS entry properties are not in TypeScript definitions
            if (!entry.hadRecentInput) {
              // @ts-expect-error - CLS entry properties are not in TypeScript definitions
              clsValue += entry.value
              setMetrics(prev => ({ ...prev, cls: clsValue }))
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS measurement not supported')
      }

      // FCP (First Contentful Paint)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
            }
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (e) {
        console.warn('FCP measurement not supported')
      }
    }

    // 초기 메트릭 측정
    measureMetrics()

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [measureMetrics])

  // 성능 등급 계산
  const getPerformanceGrade = useCallback((metrics: PerformanceMetrics) => {
    let score = 100

    // LCP 점수 (2.5초 이하 = 좋음)
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30
      else if (metrics.lcp > 2500) score -= 15
    }

    // FID 점수 (100ms 이하 = 좋음)
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 25
      else if (metrics.fid > 100) score -= 10
    }

    // CLS 점수 (0.1 이하 = 좋음)
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 25
      else if (metrics.cls > 0.1) score -= 10
    }

    if (score >= 90) return 'A'
    if (score >= 75) return 'B'
    if (score >= 60) return 'C'
    if (score >= 40) return 'D'
    return 'F'
  }, [])

  return {
    metrics,
    grade: getPerformanceGrade(metrics),
    refresh: measureMetrics
  }
}

// 페이지 로드 시간 측정
export function usePageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null)

  useEffect(() => {
    const measureLoadTime = () => {
      if ('performance' in window && 'timing' in performance) {
        const timing = performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        setLoadTime(loadTime)
      }
    }

    if (document.readyState === 'complete') {
      measureLoadTime()
    } else {
      window.addEventListener('load', measureLoadTime)
      return () => window.removeEventListener('load', measureLoadTime)
    }
  }, [])

  return loadTime
}

// 리소스 타이밍 측정
export function useResourceTiming() {
  const [resources, setResources] = useState<PerformanceResourceTiming[]>([])

  useEffect(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      setResources(resourceEntries)
    }
  }, [])

  const getSlowResources = useCallback((threshold = 1000) => {
    return resources.filter(resource => resource.duration > threshold)
  }, [resources])

  const getLargestResources = useCallback((limit = 10) => {
    return resources
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, limit)
  }, [resources])

  return {
    resources,
    slowResources: getSlowResources(),
    largestResources: getLargestResources()
  }
}

// 렌더링 성능 측정
export function useRenderPerformance() {
  const [renderTime, setRenderTime] = useState<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const startMeasure = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  const endMeasure = useCallback(() => {
    if (startTimeRef.current) {
      const endTime = performance.now()
      setRenderTime(endTime - startTimeRef.current)
      startTimeRef.current = null
    }
  }, [])

  return {
    renderTime,
    startMeasure,
    endMeasure
  }
}

// 메모리 누수 감지
export function useMemoryLeakDetection() {
  const [memoryTrend, setMemoryTrend] = useState<number[]>([])

  useEffect(() => {
    if (!('memory' in performance)) return

    const interval = setInterval(() => {
      // @ts-expect-error - performance.memory is not in TypeScript definitions but exists in Chrome
      const memoryInfo = performance.memory
      const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)
      
      setMemoryTrend(prev => {
        const newTrend = [...prev, usedMB]
        // 최근 20개 데이터만 유지
        return newTrend.slice(-20)
      })
    }, 5000) // 5초마다 측정

    return () => clearInterval(interval)
  }, [])

  const isMemoryLeaking = useCallback(() => {
    if (memoryTrend.length < 10) return false
    
    // 최근 10개 데이터에서 상승 추세 확인
    const recent = memoryTrend.slice(-10)
    const increasing = recent.filter((val, i) => i > 0 && val > recent[i - 1])
    
    return increasing.length >= 7 // 70% 이상 상승 추세면 누수 의심
  }, [memoryTrend])

  return {
    memoryTrend,
    isMemoryLeaking: isMemoryLeaking(),
    currentMemory: memoryTrend[memoryTrend.length - 1] || 0
  }
}
import React from 'react'
import { sanitizeHighlight } from '@/lib/sanitize'

/**
 * 검색어를 하이라이트 처리하는 유틸리티 함수
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text

  // sanitizeHighlight를 사용하여 안전하게 하이라이트 처리
  return sanitizeHighlight(text, query)
}

/**
 * HTML을 안전하게 렌더링하기 위한 컴포넌트
 */
export function HighlightedText({ 
  text, 
  query,
  className = ''
}: { 
  text: string
  query: string
  className?: string
}) {
  const highlightedText = highlightText(text, query)
  
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
    />
  )
}
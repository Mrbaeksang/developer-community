import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 날짜를 한국어 형식으로 포맷
 */
export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy년 MM월 dd일', { locale: ko })
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷
 */
export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
}

/**
 * 상대적인 시간 표시 (예: 3분 전, 2시간 전)
 */
export function formatRelativeTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ko })
}

/**
 * 숫자를 천 단위로 콤마 추가
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * URL에서 슬러그 생성
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
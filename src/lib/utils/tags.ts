/**
 * 태그 관리 유틸리티 함수들
 */

/**
 * 태그 추가
 */
export function addTag(
  currentTags: string[], 
  newTag: string, 
  maxTags: number = 5
): string[] {
  const trimmedTag = newTag.trim()
  
  if (!trimmedTag) {
    return currentTags
  }
  
  if (currentTags.includes(trimmedTag)) {
    return currentTags
  }
  
  if (currentTags.length >= maxTags) {
    return currentTags
  }
  
  return [...currentTags, trimmedTag]
}

/**
 * 태그 제거
 */
export function removeTag(currentTags: string[], tagToRemove: string): string[] {
  return currentTags.filter(tag => tag !== tagToRemove)
}

/**
 * 태그 검증
 */
export function validateTag(tag: string): {
  isValid: boolean
  error?: string
} {
  const trimmedTag = tag.trim()
  
  if (!trimmedTag) {
    return { isValid: false, error: '태그를 입력해주세요.' }
  }
  
  if (trimmedTag.length > 20) {
    return { isValid: false, error: '태그는 20자 이하로 입력해주세요.' }
  }
  
  if (!/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-_\s]+$/.test(trimmedTag)) {
    return { isValid: false, error: '태그는 한글, 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.' }
  }
  
  return { isValid: true }
}

/**
 * 태그 정규화 (공백 제거, 소문자 변환 등)
 */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

/**
 * 태그 배열을 문자열로 변환 (쉼표로 구분)
 */
export function tagsToString(tags: string[]): string {
  return tags.join(', ')
}

/**
 * 문자열을 태그 배열로 변환 (쉼표로 구분된 문자열을 파싱)
 */
export function stringToTags(str: string): string[] {
  return str
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
}

/**
 * 태그 검색 (부분 일치)
 */
export function searchTags(tags: string[], query: string): string[] {
  if (!query.trim()) {
    return tags
  }
  
  const lowerQuery = query.toLowerCase()
  return tags.filter(tag => 
    tag.toLowerCase().includes(lowerQuery)
  )
}

/**
 * 인기 태그 추출 (태그별 사용 횟수 계산)
 */
export function getPopularTags(
  allTags: string[][], 
  limit: number = 10
): Array<{ tag: string; count: number }> {
  const tagCounts: Record<string, number> = {}
  
  allTags.flat().forEach(tag => {
    const normalizedTag = normalizeTag(tag)
    tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1
  })
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
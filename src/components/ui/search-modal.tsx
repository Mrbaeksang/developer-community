'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, Clock } from 'lucide-react'
// import { cn } from '@/lib/utils/cn'
import { useSearchSuggestions, useRecentSearches } from '@/hooks/use-debounced-search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 검색 관련 훅
  const { /* query, */ setQuery, result, isSearching } = useSearchSuggestions()
  const { searches: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches()

  // 모달이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 검색어 변경 시 실시간 검색
  useEffect(() => {
    setQuery(searchQuery)
  }, [searchQuery, setQuery])

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addSearch(searchQuery.trim())
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      onClose()
      setSearchQuery('')
    }
  }

  // 검색어 선택
  const handleSelectSuggestion = (suggestion: string) => {
    addSearch(suggestion)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
    onClose()
    setSearchQuery('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="fixed inset-x-0 top-0 bg-white rounded-b-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSearch} className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-11 text-base bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="max-h-[60vh] overflow-y-auto pb-4">
          {/* 검색 중 */}
          {isSearching && (
            <div className="px-4 py-3 text-sm text-gray-500">
              검색 중...
            </div>
          )}

          {/* 검색 결과 */}
          {!isSearching && searchQuery && result.data.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500">검색 결과</div>
              {result.data.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion.title)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="text-base font-medium text-gray-900 line-clamp-1">
                    {suggestion.title}
                  </div>
                  <div className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                    {suggestion.category} · {suggestion.excerpt}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 최근 검색어 */}
          {!searchQuery && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 flex justify-between items-center">
                <span>최근 검색어</span>
                <button
                  onClick={clearSearches}
                  className="text-blue-500 hover:text-blue-600"
                >
                  모두 지우기
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleSelectSuggestion(search)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-700">{search}</span>
                  </button>
                  <button
                    onClick={() => removeSearch(search)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {!isSearching && searchQuery && result.data.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
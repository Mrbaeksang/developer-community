'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Search, User as UserIcon, LogOut, FileText, Shield, ChevronDown, X, Clock, Home, BookOpen, MessageSquare, Users, Menu } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSearchSuggestions, useRecentSearches } from '@/hooks/use-debounced-search'
import { SearchModal } from './search-modal'
import { Badge } from './badge'

import type { User } from '@/types/auth'

interface HeaderProps {
  user?: Pick<User, 'id' | 'email' | 'username' | 'role'>
  loading?: boolean
}

interface NavigationItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number
  requireAuth?: boolean
}

const mainNavItems: NavigationItem[] = [
  { label: '홈', href: '/', icon: Home },
  { label: '지식 공유', href: '/knowledge', icon: BookOpen },
  { label: '자유게시판', href: '/forum', icon: MessageSquare },
  { label: '커뮤니티', href: '/communities', icon: Users },
]

export function Header({ user, loading }: HeaderProps) {
  console.log('Header 컴포넌트 렌더링:', { user, loading })
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // 검색 관련 훅
  const { /* query, */ setQuery, result, isSearching } = useSearchSuggestions()
  const { searches: recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches()

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 키보드 단축키 (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        const searchInput = document.querySelector('input[type="text"][placeholder="검색..."]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        } else {
          setMobileSearchOpen(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 검색어 변경 시 실시간 검색
  useEffect(() => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [searchQuery, setQuery])

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addSearch(searchQuery.trim())
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  // 검색어 선택
  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion)
    addSearch(suggestion)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
    setShowSuggestions(false)
    setSearchQuery('')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* 모바일 메뉴 토글 */}
        <button
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        {/* 로고 */}
        <Link 
          href="/" 
          className="font-semibold text-lg flex-shrink-0 text-gray-900"
        >
          DevCom
        </Link>
        
        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {mainNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
              {item.badge && item.badge > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
        
        {/* 중앙 검색바 - 데스크톱 */}
        <div 
          ref={searchContainerRef}
          className="hidden md:flex flex-1 max-w-xl mx-auto relative"
        >
          <form 
            onSubmit={handleSearch}
            className="w-full"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                className="w-full h-9 pl-10 pr-10 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {!searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">K</kbd>
                </div>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setShowSuggestions(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* 검색 제안 드롭다운 */}
          {showSuggestions && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
              {/* 검색 중 */}
              {isSearching && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  검색 중...
                </div>
              )}

              {/* 검색 결과 */}
              {!isSearching && result.data.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500">검색 결과</div>
                  {result.data.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSelectSuggestion(suggestion.title)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
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
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => handleSelectSuggestion(search)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-700">{search}</span>
                      </button>
                      <button
                        onClick={() => removeSearch(search)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
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
          )}
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 모바일 검색 버튼 */}
          <button 
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>

          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-16 bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-9 w-20 bg-gray-200 animate-pulse rounded-lg" />
            </div>
          ) : user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="hidden sm:inline">{user.username}</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </button>

              {/* 프로필 드롭다운 메뉴 */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/write"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    글쓰기
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    내 프로필
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      관리자 대시보드
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        const response = await fetch('/api/auth/logout', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        })
                        
                        if (response.ok) {
                          // 로그아웃 성공 시 페이지 새로고침
                          window.location.href = '/'
                        }
                      } catch (error) {
                        console.error('로그아웃 에러:', error)
                      }
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/auth/login" 
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                로그인
              </Link>
              <Link 
                href="/auth/signup" 
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                시작하기
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 검색 모달 */}
      <SearchModal 
        isOpen={mobileSearchOpen} 
        onClose={() => setMobileSearchOpen(false)} 
      />
      
      {/* 모바일 메뉴 드롭다운 */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b shadow-lg z-40" ref={mobileMenuRef}>
          <nav className="container py-4">
            {mainNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {item.icon && <item.icon className="w-5 h-5" />}
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
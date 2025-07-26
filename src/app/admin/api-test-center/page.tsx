'use client'

/**
 * API 테스트 센터 메인 페이지
 * 
 * 주요 기능:
 * 1. API 엔드포인트 테스트 - 각 API의 동작 확인
 * 2. 테스트 데이터 생성 - 테스트용 더미 데이터 자동 생성
 * 3. 데이터베이스 상태 모니터링 - 실시간 테이블 상태 확인
 * 4. 토큰 관리 - 인증이 필요한 API 테스트를 위한 토큰 설정
 * 
 * 주요 컴포넌트:
 * - DatabaseStatus: Supabase 테이블 상태 표시 (KST 시간)
 * - TestDataManager: 카테고리별 테스트 데이터 생성
 * - TableTestDataManager: 테이블별 상세 데이터 생성
 * - CategorySidebar: API 카테고리 네비게이션
 * - ApiEndpointCard: 각 API 테스트 카드
 * - LogViewer: 테스트 로그 표시
 * - TokenDialog: 토큰 설정 다이얼로그
 * 
 * 중요 사항: 
 * - 모든 시간은 KST(한국 표준시)로 표시됩니다
 * - 테스트 데이터는 UUID 기반으로 생성되어 롤백 가능합니다
 * - profiles 테이블은 auth.users와 연동되어 직접 생성 불가능합니다
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, Search, Filter, Play, AlertCircle, 
  Info, Code 
} from 'lucide-react'
import CategorySidebar from './components/CategorySidebar'
import ApiEndpointCard from './components/ApiEndpointCard'
import LogViewer from './components/LogViewer'
import TokenDialog from './components/TokenDialog'
import DatabaseStatus from './components/DatabaseStatus'
import UnifiedTestDataManager from './components/UnifiedTestDataManager'
import TableSchemaInfo from './components/TableSchemaInfo'
import TableDataViewer from './components/TableDataViewer'
import { apiCategories } from './api-data'
import { TestResult, LogEntry, ApiTest } from './types'

/**
 * API 테스트 센터 컴포넌트
 * 
 * 관리자가 API 테스트와 데이터 생성을 쉽게 할 수 있도록 도와주는 페이지입니다.
 * 
 * 상태 관리:
 * - selectedCategory: 현재 선택된 API 카테고리
 * - searchTerm: API 검색어
 * - selectedFilter: 필터 옵션 (all, implemented, unimplemented)
 * - results: 각 API 테스트 결과 저장
 * - runningTests: 현재 실행 중인 테스트 목록
 * - completedApis: 완료된 API 목록 (체크박스 상태)
 * - logs: 테스트 로그 기록
 * - token: 인증 토큰 (관리자/일반 사용자)
 */
export default function ApiTestCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())
  const [completedApis, setCompletedApis] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false)
  const [token, setToken] = useState<{ type: string; value: string } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSidebarCategories, setExpandedSidebarCategories] = useState<Set<string>>(new Set())
  const [isRunningAll, setIsRunningAll] = useState(false)

  /**
   * 로컬 스토리지에서 토큰 및 완료 상태 불러오기
   * 
   * 페이지 새로고침 후에도 토큰과 완료 상태를 유지합니다.
   * localStorage 키:
   * - apiTestToken: 인증 토큰 정보
   * - completedApis: 완료된 API 체크 상태
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('apiTestToken')
    const savedCompleted = localStorage.getItem('completedApis')
    
    if (savedToken) {
      try {
        setToken(JSON.parse(savedToken))
      } catch (e) {
        console.error('Failed to parse saved token:', e)
      }
    }
    
    if (savedCompleted) {
      try {
        setCompletedApis(JSON.parse(savedCompleted))
      } catch (e) {
        console.error('Failed to parse completed APIs:', e)
      }
    }
  }, [])

  // 완료 상태 저장
  useEffect(() => {
    localStorage.setItem('completedApis', JSON.stringify(completedApis))
  }, [completedApis])

  const addLog = (type: LogEntry['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, type, message }])
  }

  /**
   * 단일 API 테스트 실행 함수
   * 
   * 각 API 엔드포인트를 테스트하고 결과를 기록합니다.
   * 
   * 테스트 프로세스:
   * 1. 인증 필요 여부 확인
   * 2. 엔드포인트 URL 변환 ([id] → 실제 UUID)
   * 3. API 호출 실행
   * 4. 결과 및 로그 기록
   * 
   * @param test - 테스트할 API 정보
   * @param categoryName - API 카테고리 이름
   */
  const runTest = async (test: ApiTest, categoryName: string) => {
    const testKey = `${test.method} ${test.endpoint}`
    
    // 토큰 체크
    if ((test.requiresAuth || test.requiresAdmin) && !token) {
      addLog('error', `${testKey} - 인증 토큰이 필요합니다`)
      setResults(prev => ({
        ...prev,
        [testKey]: {
          status: 'error',
          error: '인증 토큰이 설정되지 않았습니다. 상단의 토큰 설정 버튼을 클릭하세요.'
        }
      }))
      return
    }

    setRunningTests(prev => new Set(prev).add(testKey))
    addLog('info', `테스트 시작: ${testKey}`)

    try {
      const startTime = Date.now()
      
      /**
       * 동적 URL 파라미터 변환
       * 
       * API 엔드포인트의 [id], [boardId] 등을 실제 테스트 데이터 ID로 변환합니다.
       * 삭제 테스트용 ID와 일반 테스트용 ID를 분리하여 사용합니다.
       * 
       * 테스트 ID 규칙:
       * - 일반 테스트: *0으로 끝나는 UUID
       * - 삭제 테스트: *2로 끝나는 UUID
       */
      let actualEndpoint = test.endpoint
      
      // 엔드포인트별 ID 매핑
      if (actualEndpoint.includes('[id]')) {
        if (test.endpoint.includes('/posts/[id]')) {
          // 게시글 관련
          if (test.method === 'DELETE') {
            actualEndpoint = actualEndpoint.replace('[id]', '550e8400-e29b-41d4-a716-446655440012')
          } else {
            actualEndpoint = actualEndpoint.replace('[id]', '550e8400-e29b-41d4-a716-446655440010')
          }
        } else if (test.endpoint.includes('/free-posts/[id]')) {
          // 자유게시판 관련
          if (test.method === 'DELETE') {
            actualEndpoint = actualEndpoint.replace('[id]', 'aa0e8400-e29b-41d4-a716-446655440052')
          } else {
            actualEndpoint = actualEndpoint.replace('[id]', 'aa0e8400-e29b-41d4-a716-446655440050')
          }
        } else if (test.endpoint.includes('/communities/[id]')) {
          // 커뮤니티 관련
          actualEndpoint = actualEndpoint.replace('[id]', '770e8400-e29b-41d4-a716-446655440020')
        } else if (test.endpoint.includes('/comments/[id]')) {
          // 댓글 관련
          actualEndpoint = actualEndpoint.replace('[id]', '660e8400-e29b-41d4-a716-446655440010')
        } else if (test.endpoint.includes('/categories/[id]')) {
          // 카테고리 관련
          actualEndpoint = actualEndpoint.replace('[id]', '257ea94b-e0a3-4db4-b3fe-dd1363d71205')
        } else if (test.endpoint.includes('/admin/posts/[id]')) {
          // 관리자 게시글 관련
          actualEndpoint = actualEndpoint.replace('[id]', '550e8400-e29b-41d4-a716-446655440012')
        } else if (test.endpoint.includes('/admin/categories/[id]')) {
          // 관리자 카테고리 관련
          actualEndpoint = actualEndpoint.replace('[id]', '257ea94b-e0a3-4db4-b3fe-dd1363d71205')
        }
      }
      
      if (actualEndpoint.includes('[memoId]')) {
        actualEndpoint = actualEndpoint.replace('[memoId]', '990e8400-e29b-41d4-a716-446655440040')
      }
      
      if (actualEndpoint.includes('[boardId]')) {
        actualEndpoint = actualEndpoint.replace('[boardId]', 'knowledge')
      }
      
      if (actualEndpoint.includes('[commentId]')) {
        actualEndpoint = actualEndpoint.replace('[commentId]', '660e8400-e29b-41d4-a716-446655440010')
      }
      
      // 검색 API에 기본 쿼리 파라미터 추가
      if (actualEndpoint === '/api/posts/search' && test.method === 'GET') {
        actualEndpoint += '?q=테스트'
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = token.value
      }

      const options: RequestInit = {
        method: test.method,
        headers,
      }

      if (test.body && test.method !== 'GET') {
        options.body = JSON.stringify(test.body)
      }

      const response = await fetch(actualEndpoint, options)
      const duration = Date.now() - startTime

      let data
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      const result: TestResult = {
        status: response.ok ? 'success' : 'error',
        response: data,
        statusCode: response.status,
        duration,
        error: response.ok ? undefined : data?.error || `HTTP ${response.status}`
      }

      setResults(prev => ({ ...prev, [testKey]: result }))
      
      if (response.ok) {
        addLog('success', `${testKey} - 성공 (${response.status}) [${duration}ms]`)
      } else {
        addLog('error', `${testKey} - 실패 (${response.status}): ${result.error}`)
      }
    } catch (error) {
      const result: TestResult = {
        status: 'error',
        error: error.message || '네트워크 오류'
      }
      setResults(prev => ({ ...prev, [testKey]: result }))
      addLog('error', `${testKey} - 오류: ${error.message}`)
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev)
        next.delete(testKey)
        return next
      })
    }
  }

  const runAllTests = async () => {
    setIsRunningAll(true)
    addLog('info', '=== 전체 테스트 시작 ===')
    
    for (const category of apiCategories) {
      if (selectedCategory && selectedCategory !== category.name) continue
      
      for (const test of category.tests) {
        if (selectedFilter === 'implemented' && !test.implemented) continue
        if (selectedFilter === 'unimplemented' && test.implemented) continue
        
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          const matches = 
            test.endpoint.toLowerCase().includes(search) ||
            test.description.toLowerCase().includes(search) ||
            test.method.toLowerCase().includes(search)
          if (!matches) continue
        }
        
        await runTest(test, category.name)
        // 테스트 간 짧은 딜레이
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    addLog('info', '=== 전체 테스트 완료 ===')
    setIsRunningAll(false)
  }

  const toggleCompleted = (testKey: string) => {
    setCompletedApis(prev => ({
      ...prev,
      [testKey]: !prev[testKey]
    }))
  }

  const clearLogs = () => {
    setLogs([])
  }

  const saveToken = (type: string, value: string) => {
    const tokenData = { type, value }
    setToken(tokenData)
    localStorage.setItem('apiTestToken', JSON.stringify(tokenData))
    addLog('success', `${type === 'admin' ? '관리자' : '일반'} 토큰이 설정되었습니다`)
  }

  const clearToken = () => {
    setToken(null)
    localStorage.removeItem('apiTestToken')
    addLog('info', '토큰이 제거되었습니다')
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryName)) {
        next.delete(categoryName)
      } else {
        next.add(categoryName)
      }
      return next
    })
  }

  const toggleSidebarCategory = (categoryName: string) => {
    setExpandedSidebarCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryName)) {
        next.delete(categoryName)
      } else {
        next.add(categoryName)
      }
      return next
    })
  }

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <div className="p-2 bg-green-100 rounded-lg border border-green-300">
        <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    }
    return <div className="p-2 bg-red-100 rounded-lg border border-red-300">
      <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  }

  const getApiFilePath = (endpoint: string) => {
    const cleanEndpoint = endpoint.replace(/\[.*?\]/g, '[id]')
    return `src/app${cleanEndpoint}/route.ts`
  }

  /**
   * API 테스트 통계 계산
   * 
   * 전체 API 현황을 한눈에 볼 수 있도록 통계를 계산합니다.
   * 
   * 통계 항목:
   * - total: 전체 API 개수
   * - implemented: 구현 완료된 API 개수
   * - tested: 테스트 실행된 API 개수
   * - passed: 테스트 성공 API 개수
   * - failed: 테스트 실패 API 개수
   * - completed: 완료 체크된 API 개수
   */
  const stats = {
    total: apiCategories.reduce((sum, cat) => sum + cat.tests.length, 0),
    implemented: apiCategories.reduce((sum, cat) => 
      sum + cat.tests.filter(t => t.implemented).length, 0
    ),
    tested: Object.keys(results).length,
    passed: Object.values(results).filter(r => r.status === 'success').length,
    failed: Object.values(results).filter(r => r.status === 'error').length,
    completed: Object.keys(completedApis).filter(k => completedApis[k]).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                  <Code className="w-6 h-6 text-white" />
                </div>
                API Test Center
              </h1>
              <p className="mt-2 text-base text-blue-100 font-bold">
                개발자 커뮤니티 플랫폼의 모든 API 엔드포인트를 테스트하고 관리하세요
              </p>
            </div>
            <div className="flex items-center gap-4">
              {token ? (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    {token.type === 'admin' ? '관리자' : '사용자'} 토큰 활성
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearToken}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    제거
                  </Button>
                </div>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 font-medium">
                    인증이 필요한 API 테스트를 위해 토큰을 설정하세요
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={() => setIsTokenDialogOpen(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                토큰 설정
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-5 bg-white hover:shadow-lg transition-all duration-200 border-2 border-gray-100">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm font-bold text-gray-900 mt-1">전체 API</div>
            <div className="text-xs text-gray-800 mt-0.5 font-bold">등록된 엔드포인트</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-200 border-2 border-green-200">
            <div className="text-3xl font-bold text-green-900">{stats.implemented}</div>
            <div className="text-sm font-bold text-green-900 mt-1">구현 완료</div>
            <div className="text-xs text-green-800 mt-0.5 font-bold">{Math.round((stats.implemented / stats.total) * 100)}% 완성</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-sky-50 hover:shadow-lg transition-all duration-200 border-2 border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{stats.tested}</div>
            <div className="text-sm font-bold text-blue-900 mt-1">테스트 실행</div>
            <div className="text-xs text-blue-800 mt-0.5 font-bold">검증 진행</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all duration-200 border-2 border-emerald-200">
            <div className="text-3xl font-bold text-emerald-900">{stats.passed}</div>
            <div className="text-sm font-bold text-emerald-900 mt-1">테스트 성공</div>
            <div className="text-xs text-emerald-800 mt-0.5 font-bold">정상 작동</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-lg transition-all duration-200 border-2 border-red-200">
            <div className="text-3xl font-bold text-red-900">{stats.failed}</div>
            <div className="text-sm font-bold text-red-900 mt-1">테스트 실패</div>
            <div className="text-xs text-red-800 mt-0.5 font-bold">오류 발생</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-lg transition-all duration-200 border-2 border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{stats.completed}</div>
            <div className="text-sm font-bold text-purple-900 mt-1">개발 완료</div>
            <div className="text-xs text-purple-800 mt-0.5 font-bold">검증 완료</div>
          </Card>
        </div>
      </div>

      {/* Control Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 w-5 h-5" />
              <Input
                type="text"
                placeholder="API 엔드포인트, 메소드, 설명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold placeholder:text-gray-700"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[180px] h-10 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium">
                <Filter className="w-4 h-4 mr-2 text-gray-900" />
                <SelectValue className="text-gray-900 font-medium" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                <SelectItem value="all" className="text-gray-900 font-bold hover:bg-blue-50 focus:bg-blue-100 py-3">전체 API</SelectItem>
                <SelectItem value="implemented" className="text-green-900 font-bold hover:bg-green-50 focus:bg-green-100 py-3">구현된 API</SelectItem>
                <SelectItem value="unimplemented" className="text-red-900 font-bold hover:bg-red-50 focus:bg-red-100 py-3">미구현 API</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={runAllTests}
              disabled={isRunningAll || runningTests.size > 0}
              className="h-10 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 mr-2" />
              전체 테스트 실행
            </Button>
          </div>
        </Card>
      </div>

      {/* 데이터베이스 상태 및 테스트 데이터 관리 섹션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supabase 테이블 상태 모니터링 (KST 시간 표시) */}
          <DatabaseStatus />
          {/* 통합 테스트 데이터 관리자 */}
          <UnifiedTestDataManager />
        </div>
      </div>

      {/* 데이터베이스 스키마 및 데이터 뷰어 섹션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSchemaInfo />
          <TableDataViewer />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: 카테고리 사이드바 */}
          <CategorySidebar
            apiCategories={apiCategories}
            selectedCategory={selectedCategory}
            selectedFilter={selectedFilter}
            searchTerm={searchTerm}
            expandedSidebarCategories={expandedSidebarCategories}
            onCategorySelect={setSelectedCategory}
            onToggleSidebarCategory={toggleSidebarCategory}
          />

          {/* 중앙: API 테스트 목록 */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-900" />
                API 엔드포인트
              </h2>
              
              {apiCategories.map((category) => {
                const categoryTests = category.tests.filter(test => {
                  if (selectedFilter === 'implemented' && !test.implemented) return false
                  if (selectedFilter === 'unimplemented' && test.implemented) return false
                  
                  if (searchTerm) {
                    const search = searchTerm.toLowerCase()
                    return (
                      test.endpoint.toLowerCase().includes(search) ||
                      test.description.toLowerCase().includes(search) ||
                      test.method.toLowerCase().includes(search)
                    )
                  }
                  
                  return true
                })

                if (categoryTests.length === 0 && searchTerm) return null
                if (selectedCategory && selectedCategory !== category.name) return null

                return (
                  <div key={category.name} className="mb-6">
                    <div
                      className="flex items-center justify-between mb-3 pb-3 border-b cursor-pointer hover:bg-gray-50 -mx-5 px-5 py-2 rounded-lg transition-colors"
                      onClick={() => toggleCategory(category.name)}
                    >
                      <h3 className="text-lg font-semibold flex items-center gap-3 text-gray-900">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {category.icon}
                        </div>
                        <div>
                          <span>{category.name}</span>
                          <p className="text-sm text-gray-600 font-normal">{category.description}</p>
                        </div>
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-900 font-bold">
                          {categoryTests.length}개
                        </span>
                      </div>
                    </div>

                    {(expandedCategories.has(category.name) || !selectedCategory) && (
                      <div className="space-y-3">
                        {categoryTests.map((test) => {
                          const testKey = `${test.method} ${test.endpoint}`
                          const result = results[testKey]
                          const isRunning = runningTests.has(testKey)
                          const isCompleted = completedApis[testKey]

                          return (
                            <ApiEndpointCard
                              key={testKey}
                              test={test}
                              isRunning={isRunning}
                              isCompleted={isCompleted}
                              result={result}
                              onRun={() => runTest(test, category.name)}
                              onToggleComplete={() => toggleCompleted(testKey)}
                              getApiFilePath={getApiFilePath}
                              getStatusIcon={getStatusIcon}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </Card>
          </div>

          {/* 오른쪽: 로그 및 가이드 */}
          <div className="space-y-6">
            {/* 초보자 가이드 */}
            <Card className="bg-blue-50 border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                초보자 가이드
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>1. <strong>토큰 설정</strong>: 인증이 필요한 API를 테스트하려면 먼저 토큰을 설정하세요.</p>
                <p>2. <strong>필터 사용</strong>: 구현/미구현 API를 필터링하여 필요한 것만 테스트하세요.</p>
                <p>3. <strong>TDD 개발</strong>: 미구현 API를 먼저 테스트하고, 실패를 확인한 후 구현하세요.</p>
                <p>4. <strong>완료 체크</strong>: 테스트가 통과한 API는 체크박스로 완료 표시하세요.</p>
              </div>
            </Card>

            {/* 로그 뷰어 */}
            <LogViewer logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </div>

      {/* Token Dialog */}
      <TokenDialog
        isOpen={isTokenDialogOpen}
        onClose={() => setIsTokenDialogOpen(false)}
        onSave={saveToken}
      />
    </div>
  )
}
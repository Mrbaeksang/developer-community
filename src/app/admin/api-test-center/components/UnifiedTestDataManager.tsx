'use client'

/**
 * 통합 테스트 데이터 관리자
 * 
 * 빠른 시작과 상세 관리 기능을 하나로 통합한 테스트 데이터 관리 컴포넌트입니다.
 * 
 * 주요 기능:
 * 1. 빠른 시작 모드 - 원클릭으로 전체 테스트 데이터 생성
 * 2. 상세 관리 모드 - 테이블별 세밀한 데이터 생성/삭제
 * 3. 실시간 상태 표시 - 생성 진행률과 결과 확인
 * 4. 안전한 데이터 관리 - 기본 데이터 보호 및 참조 무결성 유지
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, Settings, Database, Trash2, Plus, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Info, Loader2,
  Sparkles, Shield, Clock, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import DataPreviewModal from './DataPreviewModal'

// 테이블 정보 및 생성 순서
const TABLE_INFO = [
  { 
    name: 'profiles', 
    label: '사용자 프로필', 
    icon: '👤',
    description: 'auth.users와 연결된 프로필 (읽기 전용)',
    readonly: true,
    protected: true
  },
  { 
    name: 'board_types', 
    label: '게시판 타입', 
    icon: '📋',
    description: '게시판 종류 정의 (지식공유, 자유게시판 등)',
    protected: true,
    defaultData: ['knowledge', 'forum']
  },
  { 
    name: 'categories', 
    label: '카테고리', 
    icon: '🏷️',
    description: '게시판별 카테고리',
    dependencies: ['board_types'],
    protected: true,
    defaultData: ['javascript', 'react', 'typescript', 'nextjs']
  },
  { 
    name: 'posts', 
    label: '게시글', 
    icon: '📝',
    description: '지식공유 게시글',
    dependencies: ['board_types', 'categories', 'profiles']
  },
  { 
    name: 'communities', 
    label: '커뮤니티', 
    icon: '👥',
    description: '소규모 스터디/프로젝트 그룹',
    dependencies: ['profiles']
  },
  { 
    name: 'tags', 
    label: '태그', 
    icon: '🔖',
    description: '게시글 태그'
  },
  { 
    name: 'post_comments', 
    label: '댓글', 
    icon: '💬',
    description: '게시글 댓글',
    dependencies: ['posts', 'profiles']
  },
  { 
    name: 'community_members', 
    label: '커뮤니티 멤버', 
    icon: '👫',
    description: '커뮤니티 참여 멤버',
    dependencies: ['communities', 'profiles']
  },
  { 
    name: 'post_likes', 
    label: '좋아요', 
    icon: '❤️',
    description: '게시글 좋아요',
    dependencies: ['posts', 'profiles']
  }
]

// 빠른 시작 프리셋
const QUICK_START_PRESETS = [
  {
    id: 'minimal',
    name: '최소 설정',
    description: '필수 데이터만 생성 (1-2개씩)',
    icon: '🎯',
    counts: {
      board_types: 2,
      categories: 2,
      posts: 2,
      communities: 1,
      tags: 3
    }
  },
  {
    id: 'standard',
    name: '표준 설정',
    description: '적당한 양의 테스트 데이터 (3-5개씩)',
    icon: '⚡',
    counts: {
      board_types: 3,
      categories: 5,
      posts: 5,
      communities: 3,
      tags: 5,
      post_comments: 3,
      community_members: 3,
      post_likes: 3
    }
  },
  {
    id: 'full',
    name: '전체 설정',
    description: '충분한 테스트 환경 구축 (5-10개씩)',
    icon: '🚀',
    counts: {
      board_types: 5,
      categories: 8,
      posts: 10,
      communities: 5,
      tags: 10,
      post_comments: 10,
      community_members: 10,
      post_likes: 10
    }
  }
]

export default function UnifiedTestDataManager() {
  const [activeTab, setActiveTab] = useState('quick')
  const [selectedTable, setSelectedTable] = useState('board_types')
  const [dataCount, setDataCount] = useState('3')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Record<string, { success: boolean; count: number; message: string }>>({})
  const [selectedPreset, setSelectedPreset] = useState('standard')
  const [showPreview, setShowPreview] = useState(false)

  // 빠른 시작 모드 - 전체 데이터 생성
  const handleQuickStart = async () => {
    const preset = QUICK_START_PRESETS.find(p => p.id === selectedPreset)
    if (!preset) return

    setIsGenerating(true)
    setProgress(0)
    setResults({})

    const tables = TABLE_INFO.filter(t => !t.readonly && preset.counts[t.name])
    const totalSteps = tables.length

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      const count = preset.counts[table.name]

      try {
        toast.info(`${table.label} 생성 중...`, { icon: table.icon })
        
        const response = await fetch(`/api/admin/board-types/${table.name}/test-data?count=${count}`, {
          method: 'POST'
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setResults(prev => ({
            ...prev,
            [table.name]: {
              success: true,
              count: data.count || count,
              message: data.message || `${count}개 생성 완료`
            }
          }))
          toast.success(`${table.label} 생성 완료!`, { icon: '✅' })
        } else {
          throw new Error(data.error || '생성 실패')
        }
      } catch (error) {
        setResults(prev => ({
          ...prev,
          [table.name]: {
            success: false,
            count: 0,
            message: error instanceof Error ? error.message : '생성 실패'
          }
        }))
        toast.error(`${table.label} 생성 실패`, { description: error.message })
      }

      setProgress(((i + 1) / totalSteps) * 100)
    }

    setIsGenerating(false)
    toast.success('테스트 데이터 생성 완료!', { 
      description: `${preset.name} 프리셋으로 데이터가 생성되었습니다.`
    })
  }

  // 상세 관리 모드 - 개별 테이블 데이터 생성
  const handleGenerateData = async () => {
    const selectedTableInfo = TABLE_INFO.find(t => t.name === selectedTable)
    if (!selectedTableInfo || selectedTableInfo.readonly) {
      toast.error('이 테이블은 생성할 수 없습니다.')
      return
    }

    setIsGenerating(true)
    
    try {
      toast.info(`${selectedTableInfo.label} 생성 중...`, { icon: selectedTableInfo.icon })
      
      const response = await fetch(`/api/admin/board-types/${selectedTable}/test-data?count=${dataCount}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`${selectedTableInfo.label} ${data.count}개 생성 완료!`)
      } else {
        throw new Error(data.error || '생성 실패')
      }
    } catch (error) {
      toast.error('데이터 생성 실패', {
        description: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 개별 테이블 데이터 삭제
  const handleClearTable = async () => {
    const selectedTableInfo = TABLE_INFO.find(t => t.name === selectedTable)
    if (!selectedTableInfo || selectedTableInfo.readonly) {
      toast.error('이 테이블은 삭제할 수 없습니다.')
      return
    }

    if (!confirm(`정말 ${selectedTableInfo.label} 데이터를 삭제하시겠습니까?`)) {
      return
    }

    setIsClearing(true)
    
    try {
      const response = await fetch(`/api/admin/board-types/${selectedTable}/test-data`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`${selectedTableInfo.label} ${data.deleted}개 삭제 완료!`)
      } else {
        throw new Error(data.error || '삭제 실패')
      }
    } catch (error) {
      toast.error('데이터 삭제 실패', {
        description: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    } finally {
      setIsClearing(false)
    }
  }

  // 전체 데이터 초기화
  const handleClearAll = async () => {
    if (!confirm('정말 모든 테스트 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setIsClearing(true)
    setProgress(0)
    
    // 의존성 역순으로 삭제 (자식 테이블부터)
    const tablesToClear = [...TABLE_INFO].reverse().filter(t => !t.readonly)
    const totalSteps = tablesToClear.length

    for (let i = 0; i < tablesToClear.length; i++) {
      const table = tablesToClear[i]
      
      try {
        const response = await fetch(`/api/admin/board-types/${table.name}/test-data`, {
          method: 'DELETE'
        })
        
        const data = await response.json()
        
        if (response.ok) {
          toast.success(`${table.label} ${data.deleted}개 삭제`)
        } else {
          toast.error(`${table.label} 삭제 실패`, { description: data.error })
        }
      } catch (error) {
        toast.error(`${table.label} 삭제 중 오류 발생`)
      }

      setProgress(((i + 1) / totalSteps) * 100)
    }

    setIsClearing(false)
    toast.success('전체 테스트 데이터 삭제 완료!')
  }

  const selectedTableInfo = TABLE_INFO.find(t => t.name === selectedTable)

  return (
    <Card className="relative overflow-hidden">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-blue-50 opacity-50" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              통합 테스트 데이터 관리
            </h3>
            <p className="text-sm text-gray-900 font-bold mt-1">
              테스트를 위한 샘플 데이터를 쉽고 빠르게 생성하세요
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={isClearing}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="font-semibold">전체 초기화</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="flex items-center gap-2 text-gray-900 font-bold data-[state=active]:text-purple-900 data-[state=active]:font-bold">
              <Zap className="w-4 h-4" />
              빠른 시작
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 text-gray-900 font-bold data-[state=active]:text-purple-900 data-[state=active]:font-bold">
              <Settings className="w-4 h-4" />
              상세 관리
            </TabsTrigger>
          </TabsList>

          {/* 빠른 시작 탭 */}
          <TabsContent value="quick" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 font-bold">
                원클릭으로 전체 테스트 환경을 구축합니다. 프리셋을 선택하고 생성 버튼을 클릭하세요!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-3">
              {QUICK_START_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPreset === preset.id
                      ? 'border-purple-700 bg-purple-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedPreset(preset.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{preset.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg ${
                        selectedPreset === preset.id ? 'text-purple-900' : 'text-gray-900'
                      }`}>{preset.name}</h4>
                      <p className={`text-sm mt-1 font-bold ${
                        selectedPreset === preset.id ? 'text-purple-900' : 'text-gray-900'
                      }`}>{preset.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(preset.counts).map(([table, count]) => (
                          <Badge 
                            key={table} 
                            variant="outline"
                            className={`text-xs font-medium ${
                              selectedPreset === preset.id 
                                ? 'bg-purple-200 text-purple-900 border-purple-500 font-bold' 
                                : 'bg-gray-100 text-gray-900 border-gray-400 font-semibold'
                            }`}
                          >
                            {TABLE_INFO.find(t => t.name === table)?.label}: {count}개
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {selectedPreset === preset.id && (
                      <CheckCircle className="w-5 h-5 text-purple-700" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(true)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1 border-purple-600 text-purple-800 hover:bg-purple-50 font-bold border-2"
                size="lg"
              >
                <Eye className="w-5 h-5 mr-2" />
                <span className="font-semibold">미리보기</span>
              </Button>
              <Button
                onClick={handleQuickStart}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow font-semibold"
                size="lg"
              >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-semibold">생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span className="font-semibold">테스트 데이터 생성 시작</span>
                </>
              )}
              </Button>
            </div>

            {/* 진행률 표시 */}
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-900 text-center font-bold">
                  진행률: {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* 결과 표시 */}
            {Object.keys(results).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900">생성 결과:</h4>
                {Object.entries(results).map(([table, result]) => {
                  const tableInfo = TABLE_INFO.find(t => t.name === table)
                  return (
                    <div
                      key={table}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tableInfo?.icon}</span>
                        <span className="font-bold text-gray-900">{tableInfo?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-700" />
                            <span className="text-sm text-green-900 font-bold">{result.count}개 생성</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-700" />
                            <span className="text-sm text-red-900 font-bold">{result.message}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* 상세 관리 탭 */}
          <TabsContent value="advanced" className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <Shield className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 font-bold">
                테이블별로 세밀하게 데이터를 관리할 수 있습니다. 의존성이 있는 테이블은 순서대로 생성하세요.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900">테이블 선택</label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="mt-1 h-10 bg-white border-2 border-gray-400 hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold">
                    <SelectValue className="text-gray-900 font-semibold" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                    {TABLE_INFO.map((table) => (
                      <SelectItem key={table.name} value={table.name} className="text-gray-900 font-bold hover:bg-blue-50 focus:bg-blue-100 py-3">
                        <div className="flex items-center gap-2">
                          <span>{table.icon}</span>
                          <span className="font-bold text-gray-900">{table.label}</span>
                          {table.readonly && (
                            <Badge variant="secondary" className="ml-2 text-xs text-gray-900 bg-gray-200 font-bold">읽기 전용</Badge>
                          )}
                          {table.protected && (
                            <Badge variant="secondary" className="ml-2 text-xs text-blue-900 bg-blue-100 font-bold">보호됨</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 선택된 테이블 정보 */}
              {selectedTableInfo && (
                <Card className="p-4 bg-gray-50 border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedTableInfo.icon}</span>
                      <h4 className="font-bold text-gray-900">{selectedTableInfo.label}</h4>
                    </div>
                    <p className="text-sm text-gray-900 font-bold">{selectedTableInfo.description}</p>
                    
                    {selectedTableInfo.dependencies && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-900 font-bold">
                          의존성: {selectedTableInfo.dependencies.join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {selectedTableInfo.protected && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-900 font-bold">
                          기본 데이터 보호: {selectedTableInfo.defaultData?.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {!selectedTableInfo?.readonly && (
                <>
                  <div>
                    <label className="text-sm font-bold text-gray-900">생성할 개수</label>
                    <Select value={dataCount} onValueChange={setDataCount}>
                      <SelectTrigger className="mt-1 h-10 bg-white border-2 border-gray-400 hover:border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold">
                        <SelectValue className="text-gray-900 font-semibold" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                        <SelectItem value="1" className="text-gray-900 font-semibold hover:bg-blue-50 focus:bg-blue-100 py-3">1개</SelectItem>
                        <SelectItem value="3" className="text-gray-900 font-semibold hover:bg-blue-50 focus:bg-blue-100 py-3">3개</SelectItem>
                        <SelectItem value="5" className="text-gray-900 font-semibold hover:bg-blue-50 focus:bg-blue-100 py-3">5개</SelectItem>
                        <SelectItem value="10" className="text-gray-900 font-semibold hover:bg-blue-50 focus:bg-blue-100 py-3">10개</SelectItem>
                        <SelectItem value="20" className="text-gray-900 font-semibold hover:bg-blue-50 focus:bg-blue-100 py-3">20개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateData}
                      disabled={isGenerating || selectedTableInfo?.readonly}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="font-semibold">생성 중...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="font-semibold">데이터 생성</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleClearTable}
                      disabled={isClearing || selectedTableInfo?.readonly}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-400 hover:border-red-500 font-bold"
                    >
                      {isClearing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="font-semibold">삭제 중...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span className="font-semibold">삭제</span>
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* 데이터 생성 가이드 */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                데이터 생성 가이드
              </h4>
              <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside font-bold">
                <li>board_types와 categories는 기본 데이터가 보호됩니다</li>
                <li>profiles는 auth.users와 연결되어 직접 생성할 수 없습니다</li>
                <li>의존성이 있는 테이블은 부모 테이블을 먼저 생성하세요</li>
                <li>삭제 시 참조 무결성을 위해 자식 테이블부터 삭제됩니다</li>
              </ol>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 데이터 미리보기 모달 */}
      <DataPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={() => {
          setShowPreview(false)
          handleQuickStart()
        }}
        presetData={QUICK_START_PRESETS.find(p => p.id === selectedPreset)!}
        tableInfo={TABLE_INFO}
      />
    </Card>
  )
}
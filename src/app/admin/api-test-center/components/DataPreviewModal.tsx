'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, Database, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface DataPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  presetData: {
    id: string
    name: string
    description: string
    icon: string
    counts: Record<string, number>
  }
  tableInfo: Array<{
    name: string
    label: string
    icon: string
    description: string
  }>
}

// 샘플 데이터 생성기
const generateSampleData = (tableName: string, count: number) => {
  const samples: Record<string, any[]> = {
    board_types: [
      { id: 'knowledge', name: '지식공유', description: '개발 지식 공유 게시판', is_active: true },
      { id: 'forum', name: '자유게시판', description: '자유로운 주제의 게시판', is_active: true },
      { id: 'qna', name: 'Q&A', description: '질문과 답변 게시판', is_active: true }
    ],
    categories: [
      { name: 'JavaScript', board_type_id: 'knowledge', description: 'JavaScript 관련 지식' },
      { name: 'React', board_type_id: 'knowledge', description: 'React 프레임워크' },
      { name: 'TypeScript', board_type_id: 'knowledge', description: 'TypeScript 언어' },
      { name: '일상', board_type_id: 'forum', description: '일상 이야기' },
      { name: '취업', board_type_id: 'forum', description: '취업 정보 공유' }
    ],
    posts: [
      { 
        title: 'React 18의 새로운 기능들',
        content: 'React 18에서 추가된 Concurrent Features와 Suspense의 개선사항에 대해 알아봅시다...',
        board_type_id: 'knowledge',
        category_id: 2,
        author_id: 'test-user-1',
        status: 'published'
      },
      {
        title: 'TypeScript 5.0 주요 변경사항',
        content: 'TypeScript 5.0의 데코레이터 표준화와 성능 개선 사항을 정리했습니다...',
        board_type_id: 'knowledge',
        category_id: 3,
        author_id: 'test-user-2',
        status: 'draft'
      }
    ],
    communities: [
      {
        name: 'React 스터디',
        description: 'React를 함께 공부하는 소규모 스터디 그룹',
        max_members: 5,
        is_public: true,
        created_by: 'test-user-1'
      },
      {
        name: '알고리즘 동아리',
        description: '매주 알고리즘 문제를 풀고 리뷰하는 모임',
        max_members: 8,
        is_public: false,
        created_by: 'test-user-2'
      }
    ],
    tags: [
      { name: 'react', slug: 'react' },
      { name: 'javascript', slug: 'javascript' },
      { name: 'typescript', slug: 'typescript' },
      { name: 'nextjs', slug: 'nextjs' },
      { name: 'tailwind', slug: 'tailwind' }
    ],
    post_comments: [
      {
        post_id: 'sample-post-1',
        content: '좋은 글 감사합니다! React 18 정말 기대되네요.',
        author_id: 'test-user-3'
      },
      {
        post_id: 'sample-post-1',
        content: 'Suspense 개선사항이 특히 인상적이네요.',
        author_id: 'test-user-4',
        parent_id: 'sample-comment-1'
      }
    ],
    community_members: [
      {
        community_id: 'sample-community-1',
        user_id: 'test-user-1',
        role: 'owner',
        joined_at: new Date().toISOString()
      },
      {
        community_id: 'sample-community-1',
        user_id: 'test-user-2',
        role: 'member',
        joined_at: new Date().toISOString()
      }
    ],
    post_likes: [
      {
        post_id: 'sample-post-1',
        user_id: 'test-user-2'
      },
      {
        post_id: 'sample-post-2',
        user_id: 'test-user-3'
      }
    ]
  }

  return samples[tableName]?.slice(0, count) || []
}

export default function DataPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  presetData,
  tableInfo
}: DataPreviewModalProps) {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [realData, setRealData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [showSampleData, setShowSampleData] = useState(false)

  // 실제 데이터베이스에서 데이터 가져오기
  const fetchRealData = async (tableName: string) => {
    if (realData[tableName] || loading[tableName]) return
    
    setLoading(prev => ({ ...prev, [tableName]: true }))
    
    try {
      const response = await fetch(`/api/admin/table-data/${tableName}?limit=3`)
      if (response.ok) {
        const result = await response.json()
        setRealData(prev => ({ ...prev, [tableName]: result.data || [] }))
      } else {
        // 실패시 샘플 데이터로 폴백
        const sampleData = generateSampleData(tableName, 3)
        setRealData(prev => ({ ...prev, [tableName]: sampleData }))
      }
    } catch (error) {
      console.error('Failed to fetch real data:', error)
      // 에러시 샘플 데이터로 폴백
      const sampleData = generateSampleData(tableName, 3)
      setRealData(prev => ({ ...prev, [tableName]: sampleData }))
    } finally {
      setLoading(prev => ({ ...prev, [tableName]: false }))
    }
  }

  // 선택된 테이블이 변경될 때 실제 데이터 가져오기
  useEffect(() => {
    if (selectedTable && isOpen) {
      fetchRealData(selectedTable)
    }
  }, [selectedTable, isOpen])

  const getTableData = (tableName: string) => {
    if (showSampleData) {
      const count = presetData.counts[tableName] || 0
      return generateSampleData(tableName, Math.min(count, 3))
    }
    return realData[tableName] || []
  }

  const refreshData = () => {
    if (selectedTable) {
      setRealData(prev => {
        const newData = { ...prev }
        delete newData[selectedTable]
        return newData
      })
      fetchRealData(selectedTable)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-gray-900 font-bold">
            <Eye className="w-5 h-5 text-blue-600" />
            테스트 데이터 미리보기
          </DialogTitle>
          <DialogDescription className="text-gray-900 font-bold">
            <span className="text-2xl mr-2">{presetData.icon}</span>
            <span className="font-bold text-gray-900">{presetData.name}</span> <span className="font-bold text-gray-900">- {presetData.description}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {/* 요약 정보 */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                생성될 데이터 요약
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(presetData.counts).map(([table, count]) => {
                  const info = tableInfo.find(t => t.name === table)
                  return (
                    <Button
                      key={table}
                      variant={selectedTable === table ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTable(table)}
                      className={`justify-start font-semibold ${
                        selectedTable === table 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'text-gray-800 hover:text-gray-900 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="mr-2">{info?.icon}</span>
                      <span className="truncate font-bold text-gray-900">{info?.label}</span>
                      <Badge variant="secondary" className={`ml-auto font-medium ${
                        selectedTable === table 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {count}개
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* 선택된 테이블 데이터 미리보기 */}
            {selectedTable && (
              <Card className="p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {tableInfo.find(t => t.name === selectedTable)?.label} {showSampleData ? '샘플' : '실제'} 데이터
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSampleData(!showSampleData)}
                        className="text-xs font-bold text-gray-900 hover:text-gray-800 border-gray-400 hover:border-gray-500"
                      >
                        {showSampleData ? '실제 데이터 보기' : '샘플 데이터 보기'}
                      </Button>
                      {!showSampleData && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={refreshData}
                          disabled={loading[selectedTable]}
                          className="font-bold text-gray-900 hover:text-gray-800 border-gray-400 hover:border-gray-500"
                        >
                          <RefreshCw className={`w-3 h-3 ${loading[selectedTable] ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 mt-1 font-bold">
                    {showSampleData 
                      ? `실제로 생성될 ${presetData.counts[selectedTable]}개 중 최대 3개까지 미리보기`
                      : `현재 데이터베이스의 실제 데이터 (최대 3개)`
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  {loading[selectedTable] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-900 font-bold">데이터 로딩 중...</span>
                    </div>
                  ) : getTableData(selectedTable).length === 0 ? (
                    <div className="text-center py-8 text-gray-900">
                      <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-bold text-gray-900">
                        {showSampleData ? '샘플 데이터가 없습니다' : '테이블에 데이터가 없습니다'}
                      </p>
                    </div>
                  ) : (
                    getTableData(selectedTable).map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                      >
                        <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto text-gray-900">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {/* 주의사항 */}
            <Card className="p-4 bg-amber-50 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                생성 전 확인사항
              </h4>
              <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside font-bold">
                <li>테스트 데이터는 개발 환경에서만 사용하세요</li>
                <li>기존 데이터와 중복되지 않도록 고유한 ID가 생성됩니다</li>
                <li>의존성이 있는 테이블은 순서대로 생성됩니다</li>
                <li>생성 후 언제든지 삭제할 수 있습니다</li>
                <li className="font-bold">실제 데이터는 현재 데이터베이스의 상태를 보여줍니다</li>
              </ul>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-bold text-gray-900 hover:text-gray-800 border-gray-400 hover:border-gray-500">
            취소
          </Button>
          <Button onClick={onConfirm} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="font-semibold">데이터 생성 시작</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
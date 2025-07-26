'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  ChevronDown, 
  ChevronRight, 
  Loader2,
  Newspaper,
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react'
import type { BoardType, Category } from '@/types/post'

interface BoardSelectorProps {
  selectedBoardId?: string
  selectedCategoryId?: string
  onBoardChange: (boardId: string) => void
  onCategoryChange: (categoryId: string) => void
  disabled?: boolean
}

export default function BoardSelector({
  selectedBoardId,
  selectedCategoryId,
  onBoardChange,
  onCategoryChange,
  disabled = false
}: BoardSelectorProps) {
  const [boardTypes, setBoardTypes] = useState<BoardType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 게시판 타입 로드
  useEffect(() => {
    const fetchBoardTypes = async () => {
      try {
        const response = await fetch('/api/board-types')
        if (!response.ok) throw new Error('게시판 타입을 불러오는데 실패했습니다')
        const data = await response.json()
        setBoardTypes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchBoardTypes()
  }, [])

  // 선택된 게시판의 카테고리 로드
  useEffect(() => {
    if (!selectedBoardId) {
      setCategories([])
      return
    }

    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const response = await fetch(`/api/categories/${selectedBoardId}`)
        if (!response.ok) throw new Error('카테고리를 불러오는데 실패했습니다')
        const data = await response.json()
        setCategories(data)
        
        // 이전에 선택된 카테고리가 새 게시판에 없으면 초기화
        if (selectedCategoryId && !data.find((cat: Category) => cat.id === selectedCategoryId)) {
          onCategoryChange('')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '카테고리 로드 오류')
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardId]) // selectedCategoryId와 onCategoryChange를 의존성에서 제거

  const selectedBoard = boardTypes.find(board => board.id === selectedBoardId)
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  const getBoardIcon = (iconName: string | null | undefined) => {
    switch (iconName) {
      case 'newspaper':
        return <Newspaper className="h-4 w-4" />
      case 'message-square':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 게시판 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            1단계: 게시판 선택 *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedBoardId || ''}
            onValueChange={onBoardChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="게시판을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {boardTypes.map(board => (
                <SelectItem key={board.id} value={board.id}>
                  <div className="flex items-center gap-3">
                    {getBoardIcon(board.icon)}
                    <div className="flex flex-col">
                      <span className="font-medium">{board.name}</span>
                      {board.description && (
                        <span className="text-xs text-muted-foreground">
                          {board.description}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedBoard && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                {getBoardIcon(selectedBoard.icon)}
                <span className="font-medium">{selectedBoard.name}</span>
                {selectedBoard.requires_approval && (
                  <Badge variant="secondary" className="text-xs">
                    승인 필요
                  </Badge>
                )}
              </div>
              {selectedBoard.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedBoard.description}
                </p>
              )}
              {selectedBoard.requires_approval && (
                <p className="text-xs text-orange-600 mt-2">
                  이 게시판의 글은 관리자 승인 후 게시됩니다.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4" />
            2단계: 카테고리 선택 *
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedBoardId ? (
            <div className="py-8 text-center text-muted-foreground">
              먼저 게시판을 선택해주세요
            </div>
          ) : loadingCategories ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">카테고리 로딩 중...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              사용 가능한 카테고리가 없습니다
            </div>
          ) : (
            <>
              <Select
                value={selectedCategoryId || ''}
                onValueChange={onCategoryChange}
                disabled={disabled || loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: category.color || undefined }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCategory && (
                <div className="mt-4">
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: selectedCategory.color ? `${selectedCategory.color}20` : undefined, 
                      color: selectedCategory.color || undefined 
                    }}
                  >
                    {selectedCategory.name}
                  </Badge>
                  {selectedCategory.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedCategory.description}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
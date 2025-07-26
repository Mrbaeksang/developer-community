'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post } from '@/types/post'
import FreePostCard from './FreePostCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Plus } from 'lucide-react'
import Link from 'next/link'

type FreePost = Post & {
  category?: string // 카테고리 슬러그
}

interface FreePostsResponse {
  posts: FreePost[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const categoryLabels = {
  all: '전체',
  chat: '잡담',
  qna: '질문답변', 
  jobs: '채용정보',
  events: '이벤트',
  tips: '팁/노하우',
  showcase: '작품공유',
  help: '도움요청',
  news: '뉴스',
  review: '리뷰'
}

const sortOptions = {
  created_at: '최신순',
  like_count: '좋아요순',
  view_count: '조회수순',
  comment_count: '댓글순'
}

export default function FreePostList() {
  const queryClient = useQueryClient()
  
  const [currentCategory, setCurrentCategory] = useState<string>('all')
  const [currentSort, setCurrentSort] = useState<string>('created_at')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['free-posts', currentCategory, currentSort, currentPage, searchQuery],
    queryFn: async (): Promise<FreePostsResponse> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy: currentSort,
        ...(currentCategory !== 'all' && { category: currentCategory }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/free-posts?${params}`)
      if (!response.ok) {
        throw new Error('자유게시판 데이터를 불러오는데 실패했습니다.')
      }
      return response.json()
    }
  })

  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      const response = await fetch(`/api/free-posts/${postId}/like`, {
        method: action === 'like' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '좋아요 처리에 실패했습니다.')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-posts'] })
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
    setCurrentPage(1)
  }

  const handleLike = async (postId: string) => {
    try {
      // 현재 좋아요 상태 확인 (실제로는 서버에서 처리)
      await likeMutation.mutateAsync({ postId, action: 'like' })
    } catch (error) {
      console.error('좋아요 처리 오류:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">데이터를 불러오는데 실패했습니다.</p>
        <Button onClick={() => window.location.reload()}>
          다시 시도
        </Button>
      </div>
    )
  }

  const posts = data?.posts || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          {/* 검색바 */}
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="제목이나 내용으로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryLabels).map(([category, label]) => (
              <Badge
                key={category}
                variant={currentCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setCurrentCategory(category)
                  setCurrentPage(1)
                }}
              >
                {label}
              </Badge>
            ))}
          </div>

          {/* 정렬 및 글쓰기 */}
          <div className="flex justify-between items-center">
            <Select value={currentSort} onValueChange={(value) => {
              setCurrentSort(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortOptions).map(([sort, label]) => (
                  <SelectItem key={sort} value={sort}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link href="/write">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                글쓰기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">게시글이 없습니다.</p>
          <Link href="/write">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 글 작성하기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FreePostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              userLiked={false} // TODO: 사용자 좋아요 상태 확인
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            이전
          </Button>
          
          {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
            const page = Math.max(1, pagination.page - 2) + i
            if (page > pagination.totalPages) return null
            
            return (
              <Button
                key={page}
                variant={page === pagination.page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                className="w-10"
              >
                {page}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Eye, 
  Heart, 
  MessageCircle,
  PenSquare,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react'

// 타입 정의
interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface Post {
  id: string
  title: string
  excerpt: string
  content: string
  author: {
    id: string
    username: string
    avatar_url: string | null
  }
  category: Category
  status: string
  view_count: number
  like_count: number
  comment_count: number
  tags: string[]
  created_at: string
}

export default function PostsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 카테고리 데이터 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) throw new Error('카테고리를 불러오는데 실패했습니다')
        const data = await response.json()
        setCategories([
          { id: 'all', name: '전체', slug: 'all', color: '#6B7280' },
          ...data
        ])
      } catch (err) {
        console.error('카테고리 로드 실패:', err)
        setError(err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다')
      }
    }
    fetchCategories()
  }, [])

  // 게시글 데이터 로드
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          status: 'published'
        })
        
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory)
        }
        
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        
        if (sortBy !== 'latest') {
          params.append('sort', sortBy)
        }

        const response = await fetch(`/api/posts?${params}`)
        if (!response.ok) throw new Error('게시글을 불러오는데 실패했습니다')
        
        const data = await response.json()
        setPosts(data.posts || [])
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        console.error('게시글 로드 실패:', err)
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page, selectedCategory, searchQuery, sortBy])

  // 검색어나 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, searchQuery, sortBy])

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">게시글</h1>
            <p className="text-muted-foreground">
              개발자들이 공유하는 지식과 경험을 둘러보세요
            </p>
          </div>
          <Button asChild>
            <Link href="/posts/write">
              <PenSquare className="mr-2 h-4 w-4" />
              글쓰기
            </Link>
          </Button>
        </div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="제목이나 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="popular">조회순</SelectItem>
              <SelectItem value="likes">좋아요순</SelectItem>
              <SelectItem value="comments">댓글순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">게시글을 불러오는 중...</span>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      )}

      {/* 게시글 목록 */}
      {!loading && !error && (
        <>
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl line-clamp-2">
                        <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                          {post.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: `${post.category.color}20`, 
                        color: post.category.color 
                      }}
                    >
                      {post.category.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.comment_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{post.author.username}</span>
                    <span>·</span>
                    <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* 빈 상태 */}
          {posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'all' ? '검색 결과가 없습니다' : '작성된 게시글이 없습니다'}
              </p>
              <Button asChild>
                <Link href="/posts/write">
                  <PenSquare className="mr-2 h-4 w-4" />
                  첫 글 작성하기
                </Link>
              </Button>
            </div>
          )}

          {/* 페이지네이션 */}
          {posts.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                이전
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i))
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
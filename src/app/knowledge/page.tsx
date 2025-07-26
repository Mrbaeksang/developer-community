/**
 * 지식공유 페이지
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ knowledge_posts 테이블 없음!
 * - ✅ 모든 게시글은 posts 테이블에서 board_type_id로 필터링
 * - 📌 board_type_id로 구분:
 *   - 지식공유: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885' (slug: 'knowledge')
 * 
 * 🔄 API 호출:
 * - /api/posts?boardId=... → posts 테이블 (board_type='knowledge' 필터링)
 * - 지식공유는 관리자 승인 필요 (status: draft → pending → published)
 * 
 * ⚠️ 주의: /knowledge 경로지만 실제로는 posts 테이블 사용!
 * 승인된 게시글만 표시 (status='published')
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  PenSquare, 
  MessageSquare, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  BookOpen,
  Heart
} from 'lucide-react'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

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
  created_at: string
  status: string
  view_count: number
  like_count: number
  comment_count: number
  author_id: string
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
  categories: {
    id: string
    name: string
    slug: string
    color: string
    icon: string | null
  }
  tags: string[]
}

function KnowledgePageContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [boardTypeId, setBoardTypeId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const url = new URL('/api/posts', window.location.origin)
        url.searchParams.set('page', page.toString())
        url.searchParams.set('limit', '10')
        url.searchParams.set('status', 'published')
        
        // Add board_type_id filter for knowledge posts
        if (boardTypeId) {
          url.searchParams.set('board_type_id', boardTypeId)
        }
        
        if (category) {
          url.searchParams.set('category_id', category)
        }

        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch posts')
        
        const data = await response.json()
        setPosts(data.posts)
        setTotalPages(data.totalPages)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [category, page, boardTypeId])

  useEffect(() => {
    const fetchBoardTypeAndCategories = async () => {
      try {
        // First, get the board_type_id for 'knowledge' (knowledge posts)
        const boardTypeResponse = await fetch('/api/board-types?slug=knowledge')
        if (!boardTypeResponse.ok) throw new Error('Failed to fetch board type')
        
        const boardTypeData = await boardTypeResponse.json()
        if (boardTypeData && boardTypeData.length > 0) {
          const officialBoardType = boardTypeData[0]
          setBoardTypeId(officialBoardType.id)
          
          // Then fetch categories for this board type
          const categoriesResponse = await fetch(`/api/categories/${officialBoardType.id}`)
          if (!categoriesResponse.ok) throw new Error('Failed to fetch categories')
          
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error('Error fetching board type and categories:', error)
      }
    }

    fetchBoardTypeAndCategories()
  }, [])

  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '지식 공유' }
  ]

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* 헤더 섹션 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">지식 공유</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          개발자들이 공유하는 유용한 지식과 경험을 탐색해보세요
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={!category ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link href="/knowledge">전체</Link>
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={category === cat.id ? 'default' : 'outline'}
                size="sm"
                asChild
              >
                <Link href={`/knowledge?category=${cat.id}`}>{cat.name}</Link>
              </Button>
            ))}
          </div>

          <Button asChild>
            <Link href="/write">
              <PenSquare className="mr-2 h-4 w-4" />
              글쓰기
            </Link>
          </Button>
        </div>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 게시글이 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              첫 번째 지식 공유 게시글을 작성해보세요!
            </p>
            <Button asChild>
              <Link href="/write">
                <PenSquare className="mr-2 h-4 w-4" />
                글쓰기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (

        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/knowledge/${post.id}`}>
                      <CardTitle className="hover:text-blue-500 transition-colors">
                        {post.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="mt-2 line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.profiles?.username || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comment_count}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">{post.categories?.name || '카테고리 없음'}</Badge>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            asChild
          >
            <Link href={`/knowledge?page=${page - 1}${category ? `&category=${category}` : ''}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i + 1}
              variant={page === i + 1 ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link href={`/knowledge?page=${i + 1}${category ? `&category=${category}` : ''}`}>
                {i + 1}
              </Link>
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            asChild
          >
            <Link href={`/knowledge?page=${page + 1}${category ? `&category=${category}` : ''}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <div className="grid gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    }>
      <KnowledgePageContent />
    </Suspense>
  )
}
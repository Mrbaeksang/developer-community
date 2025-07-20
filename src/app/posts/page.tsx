'use client'

import { useState } from 'react'
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
  TrendingUp
} from 'lucide-react'

// 임시 데이터
const categories = [
  { id: 'all', name: '전체', slug: 'all', color: '#6B7280' },
  { id: 'project', name: '프로젝트', slug: 'project', color: '#3B82F6' },
  { id: 'tech', name: '기술', slug: 'tech', color: '#10B981' },
  { id: 'news', name: '뉴스', slug: 'news', color: '#F59E0B' },
  { id: 'qna', name: '질문', slug: 'qna', color: '#EF4444' },
  { id: 'tutorial', name: '튜토리얼', slug: 'tutorial', color: '#8B5CF6' },
  { id: 'career', name: '취업', slug: 'career', color: '#EC4899' }
]

const posts = [
  {
    id: '1',
    title: 'Next.js 14와 Server Actions로 풀스택 앱 만들기',
    excerpt: '최신 Next.js 기능을 활용한 실전 프로젝트 구축 가이드입니다.',
    content: '...',
    author: { id: '1', username: 'devmaster', avatar_url: null },
    category: categories[2],
    status: 'approved',
    view_count: 1542,
    like_count: 89,
    comment_count: 23,
    tags: ['Next.js', 'React', 'TypeScript'],
    created_at: '2025-01-18T10:00:00Z'
  },
  {
    id: '2',
    title: 'AI 스타트업이 투자받는 방법',
    excerpt: '실리콘밸리에서 AI 스타트업을 운영하며 배운 투자 유치 노하우를 공유합니다.',
    content: '...',
    author: { id: '2', username: 'startup_founder', avatar_url: null },
    category: categories[3],
    status: 'approved',
    view_count: 2103,
    like_count: 156,
    comment_count: 45,
    tags: ['스타트업', 'AI', '투자'],
    created_at: '2025-01-17T14:30:00Z'
  },
  {
    id: '3',
    title: 'React 19의 새로운 기능들',
    excerpt: 'React 19에서 추가된 주요 기능들과 변경사항을 정리했습니다.',
    content: '...',
    author: { id: '3', username: 'react_lover', avatar_url: null },
    category: categories[2],
    status: 'approved',
    view_count: 432,
    like_count: 28,
    comment_count: 12,
    tags: ['React', 'Frontend'],
    created_at: '2025-01-20T09:00:00Z'
  },
  {
    id: '4',
    title: '주니어 개발자 면접 준비 가이드',
    excerpt: '주니어 백엔드 개발자 면접을 준비하는 분들을 위한 체크리스트입니다.',
    content: '...',
    author: { id: '4', username: 'job_seeker', avatar_url: null },
    category: categories[6],
    status: 'approved',
    view_count: 891,
    like_count: 67,
    comment_count: 34,
    tags: ['면접', '취업', '백엔드'],
    created_at: '2025-01-19T16:20:00Z'
  }
]

export default function PostsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category.id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.view_count - a.view_count
      case 'likes':
        return b.like_count - a.like_count
      case 'comments':
        return b.comment_count - a.comment_count
      default: // latest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

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

      {/* 게시글 목록 */}
      <div className="grid gap-4">
        {sortedPosts.map((post) => (
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
      {sortedPosts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">검색 결과가 없습니다</p>
          <Button asChild>
            <Link href="/posts/write">
              <PenSquare className="mr-2 h-4 w-4" />
              첫 글 작성하기
            </Link>
          </Button>
        </div>
      )}

      {/* 페이지네이션 */}
      {sortedPosts.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" className="mr-2" disabled>
            이전
          </Button>
          <Button variant="outline" disabled>
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
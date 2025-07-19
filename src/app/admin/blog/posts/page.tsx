'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Calendar,
  MoreVertical
} from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

// 임시 포스트 데이터
const posts = [
  {
    id: '1',
    title: 'GPT-5 출시 임박: AI의 새로운 지평',
    excerpt: 'OpenAI가 곧 GPT-5를 출시할 예정입니다...',
    category: 'AI 뉴스',
    status: 'published' as const,
    author: 'Admin',
    createdAt: '2025-01-18T10:00:00Z',
    viewCount: 1234,
    commentCount: 23
  },
  {
    id: '2',
    title: 'Next.js 15의 혁신적인 기능들',
    excerpt: 'Vercel이 Next.js 15를 발표했습니다...',
    category: '기술 트렌드',
    status: 'published' as const,
    author: 'Admin',
    createdAt: '2025-01-17T14:30:00Z',
    viewCount: 892,
    commentCount: 15
  },
  {
    id: '3',
    title: '2025년 개발자가 주목해야 할 기술 스택',
    excerpt: '새해를 맞아 개발자들이 주목해야 할...',
    category: '기술 트렌드',
    status: 'draft' as const,
    author: 'Admin',
    createdAt: '2025-01-16T09:00:00Z',
    viewCount: 0,
    commentCount: 0
  }
]

export default function BlogPostsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">블로그 포스트 관리</h1>
          <p className="text-muted-foreground mt-1">
            블로그 포스트를 작성하고 관리합니다
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            새 포스트
          </Link>
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제목 또는 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="all">모든 카테고리</option>
              <option value="AI 뉴스">AI 뉴스</option>
              <option value="기술 트렌드">기술 트렌드</option>
              <option value="개발 팁">개발 팁</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="all">모든 상태</option>
              <option value="published">게시됨</option>
              <option value="draft">임시저장</option>
              <option value="archived">보관됨</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 포스트 목록 */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status === 'published' ? '게시됨' : '임시저장'}
                    </Badge>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">
                    <Link 
                      href={`/blog/${post.id}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  {post.status === 'published' && (
                    <>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewCount} 조회</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentCount} 댓글</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {post.status === 'published' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        보기
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/blog/posts/${post.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  )
}

// MessageSquare import 추가
import { MessageSquare } from 'lucide-react'
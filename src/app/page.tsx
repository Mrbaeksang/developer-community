'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle,
  PenSquare,
  Users,
  Flame,
  Sparkles
} from 'lucide-react'

// 임시 데이터
const categories = [
  { id: 'all', name: '전체', slug: 'all', color: '#6B7280', icon: 'grid' },
  { id: 'project', name: '프로젝트', slug: 'project', color: '#3B82F6', icon: 'folder' },
  { id: 'tech', name: '기술', slug: 'tech', color: '#10B981', icon: 'code' },
  { id: 'news', name: '뉴스', slug: 'news', color: '#F59E0B', icon: 'newspaper' },
  { id: 'qna', name: '질문', slug: 'qna', color: '#EF4444', icon: 'help-circle' },
  { id: 'tutorial', name: '튜토리얼', slug: 'tutorial', color: '#8B5CF6', icon: 'book-open' },
  { id: 'career', name: '취업', slug: 'career', color: '#EC4899', icon: 'briefcase' }
]

const featuredPosts = [
  {
    id: '1',
    title: 'Next.js 14와 Server Actions로 풀스택 앱 만들기',
    excerpt: '최신 Next.js 기능을 활용한 실전 프로젝트 구축 가이드입니다. Server Actions와 App Router를 중심으로 설명합니다.',
    author: {
      id: '1',
      username: 'devmaster',
      avatar_url: null
    },
    category: categories[2],
    status: 'approved',
    view_count: 1542,
    like_count: 89,
    comment_count: 23,
    featured: true,
    tags: ['Next.js', 'React', 'TypeScript'],
    created_at: '2025-01-18T10:00:00Z'
  },
  {
    id: '2',
    title: 'AI 스타트업이 투자받는 방법',
    excerpt: '실리콘밸리에서 AI 스타트업을 운영하며 배운 투자 유치 노하우를 공유합니다.',
    author: {
      id: '2',
      username: 'startup_founder',
      avatar_url: null
    },
    category: categories[3],
    status: 'approved',
    view_count: 2103,
    like_count: 156,
    comment_count: 45,
    featured: true,
    tags: ['스타트업', 'AI', '투자'],
    created_at: '2025-01-17T14:30:00Z'
  }
]

const recentPosts = [
  {
    id: '3',
    title: 'React 19의 새로운 기능들',
    excerpt: 'React 19에서 추가된 주요 기능들과 변경사항을 정리했습니다.',
    author: {
      id: '3',
      username: 'react_lover',
      avatar_url: null
    },
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
    author: {
      id: '4',
      username: 'job_seeker',
      avatar_url: null
    },
    category: categories[6],
    status: 'approved',
    view_count: 891,
    like_count: 67,
    comment_count: 34,
    tags: ['면접', '취업', '백엔드'],
    created_at: '2025-01-19T16:20:00Z'
  },
  {
    id: '5',
    title: 'Docker Compose로 개발 환경 구축하기',
    excerpt: '로컬 개발 환경을 Docker Compose로 통일하는 방법을 소개합니다.',
    author: {
      id: '5',
      username: 'docker_pro',
      avatar_url: null
    },
    category: categories[5],
    status: 'approved',
    view_count: 567,
    like_count: 45,
    comment_count: 19,
    tags: ['Docker', 'DevOps'],
    created_at: '2025-01-19T11:15:00Z'
  }
]

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              개발자 커뮤니티
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              지식을 공유하고, 함께 성장하는 개발자들의 공간
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="관심있는 주제를 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/posts/write">
                  <PenSquare className="mr-2 h-4 w-4" />
                  글쓰기
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 배경 장식 */}
        <div className="absolute inset-0 -z-10 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 인기 게시글 */}
            {selectedCategory === 'all' && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-2xl font-bold">인기 게시글</h2>
                </div>
                <div className="grid gap-4">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl line-clamp-2">
                              <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                                {post.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {post.excerpt}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}>
                            {post.category.name}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
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
                        <div className="flex items-center gap-2">
                          <span>{post.author.username}</span>
                          <span>·</span>
                          <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 최신 게시글 */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h2 className="text-2xl font-bold">최신 게시글</h2>
              </div>
              <div className="space-y-4">
                {recentPosts
                  .filter(post => selectedCategory === 'all' || post.category.id === selectedCategory)
                  .map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg line-clamp-1">
                            <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                              {post.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {post.excerpt}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" style={{ borderColor: post.category.color, color: post.category.color }}>
                          {post.category.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-3 pb-4">
                      <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.comment_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{post.author.username}</span>
                          <span>·</span>
                          <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* 더보기 버튼 */}
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  더 많은 게시글 보기
                </Button>
              </div>
            </section>
          </div>

          {/* 사이드바 */}
          <aside className="space-y-6">
            {/* 커뮤니티 소개 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  커뮤니티 소개
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  개발자들이 지식을 공유하고 함께 성장하는 공간입니다. 
                  프로젝트, 기술 트렌드, 커리어 등 다양한 주제로 소통해보세요.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">전체 회원</span>
                    <span className="font-medium">1,234명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">전체 게시글</span>
                    <span className="font-medium">567개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">활성 커뮤니티</span>
                    <span className="font-medium">23개</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/communities">
                    커뮤니티 둘러보기
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* 인기 태그 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  인기 태그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AI', 'DevOps', 'Docker', '면접', '알고리즘'].map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 글쓰기 안내 */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>첫 글을 작성해보세요!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  여러분의 지식과 경험을 공유해주세요. 
                  작성하신 글은 관리자 검토 후 게시됩니다.
                </p>
                <Button asChild className="w-full">
                  <Link href="/posts/write">
                    <PenSquare className="mr-2 h-4 w-4" />
                    글쓰기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
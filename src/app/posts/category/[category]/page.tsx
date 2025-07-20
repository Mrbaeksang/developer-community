import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, MessageSquare, ArrowLeft } from 'lucide-react'

// 카테고리 정보
const categories = {
  tech: { name: '기술', description: '개발 관련 기술 포스트' },
  tutorial: { name: '튜토리얼', description: '단계별 학습 가이드' },
  news: { name: '뉴스', description: '부트캠프 소식과 공지사항' },
  career: { name: '커리어', description: '취업 및 성장 관련 포스트' }
}

// 임시 블로그 데이터
const blogPosts = [
  {
    id: '1',
    title: 'Next.js 14에서 App Router 활용하기',
    slug: 'nextjs-14-app-router',
    excerpt: 'Next.js 14의 새로운 App Router를 사용하여 더 나은 성능과 개발 경험을 얻는 방법을 알아봅니다.',
    content: '...',
    category: 'tech',
    author: { id: '1', name: '김멘토', role: 'admin' },
    createdAt: '2025-01-15T10:00:00Z',
    readTime: '5분',
    views: 234,
    commentCount: 12
  },
  {
    id: '2',
    title: 'React 서버 컴포넌트 완벽 가이드',
    slug: 'react-server-components',
    excerpt: 'React 서버 컴포넌트의 개념과 실제 사용 방법을 예제와 함께 설명합니다.',
    content: '...',
    category: 'tech',
    author: { id: '2', name: '이강사', role: 'admin' },
    createdAt: '2025-01-14T14:00:00Z',
    readTime: '8분',
    views: 456,
    commentCount: 23
  },
  {
    id: '3',
    title: 'TypeScript 타입 시스템 마스터하기',
    slug: 'typescript-type-system',
    excerpt: 'TypeScript의 고급 타입 시스템을 이해하고 실무에 적용하는 방법을 배워봅니다.',
    content: '...',
    category: 'tech',
    author: { id: '1', name: '김멘토', role: 'admin' },
    createdAt: '2025-01-13T09:00:00Z',
    readTime: '10분',
    views: 567,
    commentCount: 34
  },
  {
    id: '4',
    title: 'Tailwind CSS로 반응형 디자인 구현하기',
    slug: 'tailwind-responsive-design',
    excerpt: 'Tailwind CSS를 사용하여 모든 디바이스에서 완벽한 반응형 디자인을 구현하는 방법을 알아봅니다.',
    content: '...',
    category: 'tutorial',
    author: { id: '3', name: '박디자이너', role: 'admin' },
    createdAt: '2025-01-12T11:00:00Z',
    readTime: '7분',
    views: 345,
    commentCount: 19
  }
]

export default async function BlogCategoryPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await params
  
  // 카테고리별 포스트 필터링
  const categoryPosts = blogPosts.filter(post => post.category === category)
  const categoryInfo = categories[category as keyof typeof categories]

  if (!categoryInfo) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
        <Button asChild>
          <Link href="/blog">블로그로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            전체 블로그
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{categoryInfo.name} 카테고리</h1>
          <p className="text-muted-foreground">{categoryInfo.description}</p>
          <p className="text-sm text-muted-foreground mt-2">
            총 {categoryPosts.length}개의 포스트
          </p>
        </div>
      </div>

      {/* 포스트 목록 */}
      {categoryPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{categoryInfo.name}</Badge>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </div>
                <CardTitle className="text-xl">
                  <Link href={`/blog/${post.id}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">아직 포스트가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              이 카테고리에는 아직 작성된 포스트가 없습니다.
            </p>
            <Button asChild>
              <Link href="/blog">전체 블로그 보기</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
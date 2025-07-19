import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils/format'

// 임시 블로그 데이터
const posts = [
  {
    id: '1',
    title: 'GPT-5 출시 임박: AI의 새로운 지평',
    excerpt: 'OpenAI가 곧 GPT-5를 출시할 예정입니다. 이번 버전에서는 멀티모달 기능이 대폭 강화되고...',
    category: 'AI 뉴스',
    author: 'Admin',
    createdAt: '2025-01-18T10:00:00Z',
    readTime: '5분',
    coverImage: '/api/placeholder/400/200'
  },
  {
    id: '2',
    title: 'Next.js 15의 혁신적인 기능들',
    excerpt: 'Vercel이 Next.js 15를 발표했습니다. 이번 버전에서는 성능 개선과 함께 새로운 기능들이...',
    category: '기술 트렌드',
    author: 'Admin',
    createdAt: '2025-01-17T14:30:00Z',
    readTime: '8분',
    coverImage: '/api/placeholder/400/200'
  },
  {
    id: '3',
    title: '2025년 개발자가 주목해야 할 기술 스택',
    excerpt: '새해를 맞아 개발자들이 주목해야 할 기술 스택을 정리했습니다. AI, 클라우드, 보안 분야에서...',
    category: '기술 트렌드',
    author: 'Admin',
    createdAt: '2025-01-16T09:00:00Z',
    readTime: '10분',
    coverImage: '/api/placeholder/400/200'
  }
]

export default function BlogPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">개발자 블로그</h1>
        <p className="text-muted-foreground">
          AI 뉴스와 최신 기술 트렌드를 확인하세요
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-8 flex gap-2">
        <Button variant="default" size="sm">전체</Button>
        <Button variant="outline" size="sm">AI 뉴스</Button>
        <Button variant="outline" size="sm">기술 트렌드</Button>
      </div>

      {/* 블로그 포스트 목록 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted" />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{post.category}</Badge>
                <span className="text-sm text-muted-foreground">{post.readTime}</span>
              </div>
              <CardTitle className="line-clamp-2">
                <Link href={`/blog/${post.id}`} className="hover:underline">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {post.excerpt}
              </CardDescription>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between w-full">
                <span>{post.author}</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 더보기 버튼 */}
      <div className="mt-12 flex justify-center">
        <Button variant="outline">더 많은 포스트 보기</Button>
      </div>
    </div>
  )
}
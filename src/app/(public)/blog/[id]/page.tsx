import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'
import { ArrowLeft, MessageSquare, Share2, Heart } from 'lucide-react'

// 임시 블로그 상세 데이터
async function getPost(id: string) {
  // TODO: Supabase에서 포스트 가져오기
  const posts = {
    '1': {
      id: '1',
      title: 'GPT-5 출시 임박: AI의 새로운 지평',
      content: `# GPT-5 출시 임박: AI의 새로운 지평

OpenAI가 곧 GPT-5를 출시할 예정입니다. 이번 버전에서는 멀티모달 기능이 대폭 강화되고, 추론 능력이 획기적으로 개선될 것으로 예상됩니다.

## 주요 개선사항

### 1. 멀티모달 기능 강화
- 이미지, 비디오, 오디오를 동시에 처리
- 실시간 스트리밍 지원
- 3D 객체 인식 및 생성

### 2. 추론 능력 향상
- 복잡한 수학 문제 해결
- 과학적 가설 검증
- 코드 디버깅 및 최적화

### 3. 컨텍스트 윈도우 확장
- 최대 200K 토큰 지원
- 장기 기억 메커니즘 도입
- 대화 히스토리 자동 요약

## 개발자를 위한 새로운 기능

\`\`\`python
# GPT-5 API 예시
from openai import GPT5

client = GPT5(api_key="your-key")

response = client.chat.complete(
    model="gpt-5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing"}
    ],
    stream=True,
    modalities=["text", "image", "code"]
)
\`\`\`

## 예상 출시일

업계 관계자들에 따르면 2025년 상반기 중 출시가 예상되며, 이미 일부 파트너사들은 베타 테스트를 진행 중입니다.

## 마무리

GPT-5의 출시는 AI 업계에 새로운 전환점이 될 것으로 예상됩니다. 개발자들은 이제 더욱 강력한 도구를 활용하여 혁신적인 애플리케이션을 만들 수 있게 될 것입니다.`,
      excerpt: 'OpenAI가 곧 GPT-5를 출시할 예정입니다. 이번 버전에서는 멀티모달 기능이 대폭 강화되고...',
      category: 'AI 뉴스',
      categoryId: 'ai-news',
      author: {
        id: '1',
        name: 'Admin',
        avatar: '/api/placeholder/40/40'
      },
      createdAt: '2025-01-18T10:00:00Z',
      updatedAt: '2025-01-18T10:00:00Z',
      readTime: '5분',
      viewCount: 1234,
      likeCount: 89,
      commentCount: 23,
      tags: ['GPT-5', 'OpenAI', 'AI', '머신러닝']
    }
  }

  const post = posts[id as keyof typeof posts]
  if (!post) return null
  return post
}

// 마크다운을 HTML로 변환하는 간단한 함수 (실제로는 react-markdown 사용)
function renderMarkdown(content: string) {
  return content
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-bold mb-4 mt-8">{line.slice(2)}</h1>
      } else if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-semibold mb-3 mt-6">{line.slice(3)}</h2>
      } else if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-semibold mb-2 mt-4">{line.slice(4)}</h3>
      } else if (line.startsWith('- ')) {
        return <li key={i} className="ml-6 mb-1">{line.slice(2)}</li>
      } else if (line.startsWith('```')) {
        return null // 코드 블록은 실제로는 더 복잡한 처리 필요
      } else if (line.trim() === '') {
        return <br key={i} />
      } else {
        return <p key={i} className="mb-4 leading-relaxed">{line}</p>
      }
    })
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  return (
    <article className="container max-w-4xl py-8">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            블로그 목록으로
          </Link>
        </Button>
      </div>

      {/* 포스트 헤더 */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-sm text-muted-foreground">{post.readTime} 읽기</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <span>{post.author.name}</span>
            </div>
            <time>{formatDate(post.createdAt)}</time>
          </div>
          <div className="flex items-center gap-4">
            <span>{post.viewCount.toLocaleString()} 조회</span>
          </div>
        </div>
      </header>

      {/* 포스트 본문 */}
      <div className="prose prose-lg max-w-none mb-12">
        {renderMarkdown(post.content)}
      </div>

      {/* 태그 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            #{tag}
          </Badge>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between py-6 border-y mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Heart className="mr-2 h-4 w-4" />
            좋아요 {post.likeCount}
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            댓글 {post.commentCount}
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          공유
        </Button>
      </div>

      {/* 댓글 섹션 */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">댓글 {post.commentCount}개</h2>
        
        {/* 댓글 작성 폼 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <textarea 
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
              placeholder="댓글을 작성하려면 로그인이 필요합니다."
              disabled
            />
            <div className="mt-3 flex justify-end">
              <Button disabled>댓글 작성</Button>
            </div>
          </CardContent>
        </Card>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div>
                      <p className="font-medium">사용자{i}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(new Date(Date.now() - i * 1000 * 60 * 60).toISOString())}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  정말 유익한 글이네요! GPT-5가 출시되면 개발 방식이 완전히 바뀔 것 같습니다.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </article>
  )
}
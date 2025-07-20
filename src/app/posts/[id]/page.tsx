'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageCircle,
  Calendar,
  Clock,
  Share2,
  Flag,
  Edit,
  Trash2,
  MoreVertical,
  Send
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 임시 데이터
const post = {
  id: '1',
  title: 'Next.js 14와 Server Actions로 풀스택 앱 만들기',
  content: `# Next.js 14와 Server Actions로 풀스택 앱 만들기

최신 Next.js 14 버전에서 도입된 Server Actions는 풀스택 개발의 패러다임을 완전히 바꾸고 있습니다. 이 글에서는 Server Actions를 활용하여 효율적인 풀스택 애플리케이션을 구축하는 방법을 알아보겠습니다.

## Server Actions란?

Server Actions는 클라이언트에서 직접 호출할 수 있는 서버 측 함수입니다. 이를 통해 별도의 API 엔드포인트를 만들지 않고도 서버와 통신할 수 있습니다.

\`\`\`typescript
async function createPost(formData: FormData) {
  'use server'
  
  const title = formData.get('title')
  const content = formData.get('content')
  
  // 데이터베이스에 저장
  await db.post.create({
    data: { title, content }
  })
  
  revalidatePath('/posts')
}
\`\`\`

## 주요 장점

1. **간편한 구현**: API 라우트를 별도로 만들 필요가 없습니다.
2. **타입 안정성**: TypeScript와 완벽하게 통합됩니다.
3. **보안**: 서버에서만 실행되므로 민감한 로직을 안전하게 처리할 수 있습니다.
4. **성능**: 불필요한 클라이언트-서버 왕복을 줄입니다.

## 실전 예제

다음은 간단한 할 일 목록 앱을 Server Actions로 구현한 예제입니다:

\`\`\`tsx
// app/todos/page.tsx
import { createTodo, deleteTodo } from './actions'

export default async function TodosPage() {
  const todos = await getTodos()
  
  return (
    <div>
      <form action={createTodo}>
        <input name="title" placeholder="새 할 일" required />
        <button type="submit">추가</button>
      </form>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.title}
            <form action={deleteTodo.bind(null, todo.id)}>
              <button type="submit">삭제</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
\`\`\`

## 주의사항

- Server Actions는 반드시 async 함수여야 합니다.
- 'use server' 지시문을 파일 상단이나 함수 내부에 명시해야 합니다.
- 클라이언트 컴포넌트에서는 별도 파일에서 import해서 사용해야 합니다.

## 마무리

Server Actions는 Next.js 14의 가장 혁신적인 기능 중 하나입니다. 이를 통해 더 간단하고 효율적인 풀스택 애플리케이션을 구축할 수 있습니다. 특히 폼 처리나 데이터 변경 작업에서 그 진가를 발휘합니다.

여러분도 다음 프로젝트에서 Server Actions를 활용해보시기 바랍니다!`,
  excerpt: '최신 Next.js 기능을 활용한 실전 프로젝트 구축 가이드입니다.',
  author: { 
    id: '1', 
    username: 'devmaster', 
    avatar_url: null,
    bio: '10년차 풀스택 개발자입니다. React와 Next.js를 주로 다룹니다.'
  },
  category: { id: 'tech', name: '기술', slug: 'tech', color: '#10B981' },
  status: 'approved',
  view_count: 1542,
  like_count: 89,
  comment_count: 23,
  is_liked: false,
  tags: ['Next.js', 'React', 'TypeScript', 'Server Actions'],
  created_at: '2025-01-18T10:00:00Z',
  updated_at: '2025-01-18T10:00:00Z'
}

const comments = [
  {
    id: '1',
    post_id: '1',
    author: {
      id: '2',
      username: 'react_lover',
      avatar_url: null
    },
    content: '정말 유용한 글이네요! Server Actions 덕분에 개발이 훨씬 편해졌어요.',
    created_at: '2025-01-18T12:30:00Z'
  },
  {
    id: '2',
    post_id: '1',
    author: {
      id: '3',
      username: 'backend_dev',
      avatar_url: null
    },
    content: '타입 안정성 부분이 특히 마음에 드네요. API 스키마 관리가 힘들었는데 이제 해결됐습니다.',
    created_at: '2025-01-18T14:15:00Z'
  },
  {
    id: '3',
    post_id: '1',
    author: {
      id: '4',
      username: 'junior_coder',
      avatar_url: null
    },
    content: '초보자도 이해하기 쉽게 설명해주셔서 감사합니다! 예제 코드가 특히 도움이 됐어요.',
    created_at: '2025-01-19T09:45:00Z'
  }
]

// 현재 사용자 (임시)
const currentUser = { id: '1', username: 'devmaster' }

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [commentText, setCommentText] = useState('')
  const [commentsList, setCommentsList] = useState(comments)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사되었습니다!')
    }
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const newComment = {
      id: String(Date.now()),
      post_id: post.id,
      author: currentUser,
      content: commentText,
      created_at: new Date().toISOString()
    }

    setCommentsList([...commentsList, newComment])
    setCommentText('')
  }

  const handleDelete = () => {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      // TODO: 삭제 로직
      router.push('/posts')
    }
  }

  const isAuthor = currentUser.id === post.author.id

  return (
    <div className="container max-w-4xl py-8">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            게시글 목록으로
          </Link>
        </Button>
      </div>

      {/* 게시글 본문 */}
      <article>
        <Card>
          <CardHeader>
            {/* 카테고리 및 작성일 */}
            <div className="flex items-center gap-3 mb-4">
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: `${post.category.color}20`, 
                  color: post.category.color 
                }}
              >
                {post.category.name}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {Math.ceil(post.content.length / 500)}분 읽기
              </span>
            </div>

            {/* 제목 */}
            <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>

            {/* 작성자 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.author.avatar_url || undefined} />
                  <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author.username}</p>
                  {post.author.bio && (
                    <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                  )}
                </div>
              </div>

              {/* 액션 메뉴 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor ? (
                    <>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" />
                      신고
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <Separator />

          {/* 본문 내용 */}
          <CardContent className="py-8">
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
            </div>

            {/* 태그 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>

          <Separator />

          {/* 통계 및 액션 */}
          <CardFooter className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.view_count.toLocaleString()}
              </span>
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                  isLiked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {commentsList.length}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* 댓글 섹션 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>댓글 {commentsList.length}개</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 댓글 작성 폼 */}
            <form onSubmit={handleComment} className="mb-6">
              <Textarea
                placeholder="댓글을 작성하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  댓글 작성
                </Button>
              </div>
            </form>

            <Separator className="mb-6" />

            {/* 댓글 목록 */}
            <div className="space-y-6">
              {commentsList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  첫 댓글을 작성해보세요!
                </p>
              ) : (
                commentsList.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatar_url || undefined} />
                      <AvatarFallback>{comment.author.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </article>
    </div>
  )
}
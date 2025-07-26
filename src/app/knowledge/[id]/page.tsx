'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageSquare,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { createClient } from '@/lib/supabase'

interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  created_at: string
  view_count: number
  like_count: number
  comment_count: number
  author_id: string
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  category: {
    id: string
    name: string
  }
  tags: string[]
}

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export default function KnowledgePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | null>(null)

  // 사용자 정보 가져오기
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', session.user.id)
          .single()
        
        setCurrentUser(profile)
      }
    }
    checkUser()
  }, [])

  // 게시글 및 댓글 로드
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      try {
        // 게시글 가져오기
        const postResponse = await fetch(`/api/posts/${id}`)
        if (!postResponse.ok) throw new Error('Failed to fetch post')
        
        const postData = await postResponse.json()
        setPost(postData)

        // 댓글 가져오기
        const commentsResponse = await fetch(`/api/posts/${id}/comments`)
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json()
          setComments(commentsData)
        }

        // 좋아요 상태 확인
        if (currentUser) {
          const likeResponse = await fetch(`/api/posts/${id}/like`)
          if (likeResponse.ok) {
            const likeData = await likeResponse.json()
            setIsLiked(likeData.isLiked)
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '게시글을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id, currentUser])

  // 좋아요 토글
  const handleLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      setIsLiked(data.isLiked)
      setPost(prev => prev ? { ...prev, like_count: data.likeCount } : prev)
    } catch (error) {
      alert('좋아요 처리에 실패했습니다.')
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      router.push('/auth/login')
      return
    }

    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent })
      })

      if (!response.ok) throw new Error('Failed to post comment')

      const newComment = await response.json()
      setComments(prev => [newComment, ...prev])
      setCommentContent('')
      setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev)
    } catch (error) {
      alert('댓글 작성에 실패했습니다.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '지식 공유', href: '/knowledge' },
    { label: post?.title || '게시글' }
  ]

  // 로딩 상태
  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">게시글을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild>
          <Link href="/knowledge">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* 게시글 내용 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold">{post.title}</h1>
            {post.category && (
              <Badge variant="secondary">{post.category.name}</Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {(post.profiles?.display_name || post.profiles?.username || 'U')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.view_count?.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.like_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.comment_count}
              </span>
            </div>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-8 border-t">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {post.like_count} 좋아요
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            댓글 {comments.length}개
          </h2>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div className="mb-6">
              <Textarea
                placeholder="댓글을 작성해주세요..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
                className="mb-2"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submittingComment || !commentContent.trim()}
                size="sm"
              >
                {submittingComment ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                댓글 작성
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 mb-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                댓글을 작성하려면 로그인이 필요합니다
              </p>
              <Button asChild size="sm">
                <Link href="/auth/login">로그인하기</Link>
              </Button>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(comment.profiles?.display_name || comment.profiles?.username || 'U')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.profiles?.display_name || comment.profiles?.username || '알 수 없음'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
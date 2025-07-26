'use client'

import { useState, useEffect } from 'react'
import type { CommunityPost, CommunityPostComment } from '@/types/community'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'

interface CommunityPostDetailPageProps {
  params: Promise<{
    id: string
    postId: string
  }>
}

export default function CommunityPostDetailPage({ params }: CommunityPostDetailPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string; postId: string } | null>(null)

  useEffect(() => {
    params.then(p => setResolvedParams(p))
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchPost()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams])

  const fetchPost = async () => {
    if (!resolvedParams) return
    
    try {
      const response = await fetch(`/api/communities/${resolvedParams.id}/posts/${resolvedParams.postId}`)
      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다')
      }
      const data = await response.json()
      setPost(data.post)
    } catch (error) {
      console.error('Error fetching post:', error)
      toast({
        title: '오류',
        description: '게시글을 불러오는데 실패했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !resolvedParams) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(
        `/api/communities/${resolvedParams.id}/posts/${resolvedParams.postId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: comment })
        }
      )

      if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다')
      }

      toast({
        title: '성공',
        description: '댓글이 작성되었습니다'
      })
      
      setComment('')
      fetchPost() // 댓글 목록 새로고침
    } catch (error) {
      console.error('Error creating comment:', error)
      toast({
        title: '오류',
        description: '댓글 작성에 실패했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?') || !resolvedParams) return

    try {
      const response = await fetch(
        `/api/communities/${resolvedParams.id}/posts/${resolvedParams.postId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('게시글 삭제에 실패했습니다')
      }

      toast({
        title: '성공',
        description: '게시글이 삭제되었습니다'
      })
      
      router.push(`/communities/${resolvedParams.id}`)
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: '오류',
        description: '게시글 삭제에 실패했습니다',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!post || !resolvedParams) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">게시글을 찾을 수 없습니다</p>
            {resolvedParams && (
              <Button asChild className="mt-4">
                <Link href={`/communities/${resolvedParams.id}`}>
                  커뮤니티로 돌아가기
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAuthor = user?.id === post.author_id

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link href={`/communities/${resolvedParams.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            커뮤니티로 돌아가기
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2 mb-4">
                {post.is_pinned && (
                  <Pin className="h-5 w-5 text-primary" />
                )}
                {post.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author?.avatar_url || ''} />
                    <AvatarFallback>
                      {post.author?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author?.username || '알 수 없음'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </span>
                </div>
              </div>
            </div>
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={handleDeletePost}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none mb-8">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* 댓글 섹션 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              댓글 {post.comments?.length || 0}
            </h3>

            {/* 댓글 작성 폼 */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
                rows={3}
                className="mb-2"
                disabled={isSubmittingComment}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!comment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      작성 중...
                    </>
                  ) : (
                    '댓글 작성'
                  )}
                </Button>
              </div>
            </form>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {post.comments?.map((comment: CommunityPostComment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author?.avatar_url || ''} />
                    <AvatarFallback>
                      {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.author?.username || '알 수 없음'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ko
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
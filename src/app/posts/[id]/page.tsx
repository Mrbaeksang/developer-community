'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { OptimizedAvatar } from '@/components/ui/optimized-image'
import { useCurrentUser, usePost, usePostComments, useLikePost, useAddComment } from '@/hooks/use-api'
import { sanitizeAndFormatContent } from '@/lib/sanitize'
import type { Post, Comment } from '@/types/post'
import type { User } from '@/types/auth'
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
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [commentText, setCommentText] = useState('')
  
  // React Query 훅들 사용
  const { data: currentUser } = useCurrentUser()
  const { data: post, isLoading: postLoading, error: postError } = usePost(id)
  const { data: comments = [] } = usePostComments(id)
  
  // Mutations
  const likePostMutation = useLikePost()
  const addCommentMutation = useAddComment()

  const handleLike = async () => {
    if (!post || !currentUser) return

    try {
      await likePostMutation.mutateAsync({
        postId: id,
        action: post.is_liked ? 'unlike' : 'like'
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : '좋아요 처리에 실패했습니다')
    }
  }

  const handleShare = () => {
    if (!post) return
    
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

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !currentUser || addCommentMutation.isPending) return

    try {
      await addCommentMutation.mutateAsync({
        postId: id,
        content: commentText
      })
      setCommentText('')
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 작성에 실패했습니다')
    }
  }

  const handleDelete = async () => {
    if (!post || !confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('게시글 삭제에 실패했습니다')

      router.push('/posts')
    } catch (err) {
      alert(err instanceof Error ? err.message : '게시글 삭제에 실패했습니다')
    }
  }

  const isAuthor = currentUser && post && post.author && currentUser.id === post.author.id

  // 로딩 상태 - 스켈레톤 사용
  if (postLoading) {
    return (
      <div className="container max-w-4xl py-8">
        {/* 뒤로가기 버튼 스켈레톤 */}
        <div className="mb-6">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* 게시글 스켈레톤 */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                {/* 카테고리 및 메타 정보 스켈레톤 */}
                <div className="flex items-center gap-3">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                {/* 제목 스켈레톤 */}
                <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
                {/* 작성자 정보 스켈레톤 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="py-8">
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded w-full" />
                ))}
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </CardContent>
            <Separator />
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-4 w-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              </div>
            </CardFooter>
          </Card>

          {/* 댓글 섹션 스켈레톤 */}
          <Card>
            <CardHeader>
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="h-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" />
                </div>
                <Separator />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="flex gap-2">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (postError) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">게시글을 불러올 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            {postError instanceof Error ? postError.message : '게시글을 불러오는데 실패했습니다'}
          </p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">홈으로</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 게시글이 없는 경우
  if (!post) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">게시글을 찾을 수 없습니다</p>
          <Button asChild>
            <Link href="/posts">게시글 목록으로</Link>
          </Button>
        </div>
      </div>
    )
  }

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
              {post.category && (
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: post.category.color ? `${post.category.color}20` : '#f1f5f920', 
                    color: post.category.color || '#64748b' 
                  }}
                >
                  {post.category.name}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR') : ''}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {Math.ceil((post.content?.length || 0) / 500)}분 읽기
              </span>
            </div>

            {/* 제목 */}
            <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>

            {/* 작성자 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <OptimizedAvatar 
                  src={post.author?.avatar_url || undefined}
                  alt={post.author?.username || post.author?.display_name || ''}
                  size="md"
                />
                <div>
                  <p className="font-medium">{post.author?.display_name || post.author?.username || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">user</p>
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
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </Link>
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
              <div dangerouslySetInnerHTML={{ __html: sanitizeAndFormatContent(post.content || '') }} />
            </div>

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
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
                {(post.view_count || 0).toLocaleString()}
              </span>
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                  post.is_liked ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                {post.like_count || 0}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {comments.length}
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
            <CardTitle>댓글 {comments.length}개</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 댓글 작성 폼 */}
            {currentUser ? (
              <form onSubmit={handleComment} className="mb-6">
                <Textarea
                  placeholder="댓글을 작성하세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={addCommentMutation.isPending}>
                    {addCommentMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    댓글 작성
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 mb-6 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-2">로그인하면 댓글을 작성할 수 있습니다</p>
                <Button asChild size="sm">
                  <Link href="/auth/login">로그인</Link>
                </Button>
              </div>
            )}

            <Separator className="mb-6" />

            {/* 댓글 목록 */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  첫 댓글을 작성해보세요!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <OptimizedAvatar 
                      src={comment.author?.avatar_url || undefined}
                      alt={comment.author?.username || comment.author?.display_name || ''}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author?.username || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString('ko-KR') : ''}
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
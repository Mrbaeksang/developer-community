'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Database } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Heart, MessageCircle, Eye, Edit, Trash2, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

type FreePost = Database['public']['Tables']['posts']['Row'] & {
  category?: string // 카테고리 슬러그
}

type FreePostComment = Database['public']['Tables']['post_comments']['Row'] & {
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface FreePostDetailResponse {
  post: FreePost
  comments: FreePostComment[]
  userLiked: boolean
}

const categoryLabels: Record<string, string> = {
  chat: '잡담',
  qna: '질문답변',
  jobs: '채용정보',
  events: '이벤트',
  tips: '팁/노하우',
  showcase: '작품공유',
  help: '도움요청',
  news: '뉴스',
  review: '리뷰'
}

const categoryColors: Record<string, string> = {
  chat: 'bg-blue-100 text-blue-800',
  qna: 'bg-green-100 text-green-800',
  jobs: 'bg-purple-100 text-purple-800',
  events: 'bg-orange-100 text-orange-800',
  tips: 'bg-yellow-100 text-yellow-800',
  showcase: 'bg-pink-100 text-pink-800',
  help: 'bg-red-100 text-red-800',
  news: 'bg-indigo-100 text-indigo-800',
  review: 'bg-gray-100 text-gray-800'
}

interface FreePostDetailProps {
  postId: string
}

export default function FreePostDetail({ postId }: FreePostDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['free-post', postId],
    queryFn: async (): Promise<FreePostDetailResponse> => {
      const response = await fetch(`/api/free-posts/${postId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('게시글을 찾을 수 없습니다.')
        }
        throw new Error('게시글을 불러오는데 실패했습니다.')
      }
      return response.json()
    }
  })

  const likeMutation = useMutation({
    mutationFn: async (action: 'like' | 'unlike') => {
      const response = await fetch(`/api/free-posts/${postId}/like`, {
        method: action === 'like' ? 'POST' : 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '좋아요 처리에 실패했습니다.')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-post', postId] })
    }
  })

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/free-posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '댓글 작성에 실패했습니다.')
      }
      
      return response.json()
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['free-post', postId] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/free-posts/${postId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '게시글 삭제에 실패했습니다.')
      }
      
      return response.json()
    },
    onSuccess: () => {
      router.push('/free-board')
    }
  })

  const handleLike = () => {
    if (!data) return
    const action = data.userLiked ? 'unlike' : 'like'
    likeMutation.mutate(action)
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    commentMutation.mutate(newComment.trim())
  }

  const handleDelete = () => {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error.message}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { post, comments, userLiked } = data
  const displayName = post.author_display_name || post.author_username
  const relativeTime = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ko
      })
    : '알 수 없음'

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      {/* 게시글 본문 */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <Badge className={categoryColors[post.category || 'chat']}>
              {categoryLabels[post.category || 'chat']}
            </Badge>
            <span className="text-sm text-gray-500">{relativeTime}</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage 
                  src={post.author_avatar_url || undefined} 
                  alt={displayName || undefined}
                />
                <AvatarFallback>
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{displayName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{post.view_count}</span>
              </div>
              
              <button
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center space-x-1 transition-colors ${
                  userLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${userLiked ? 'fill-current' : ''}`} />
                <span>{post.like_count}</span>
              </button>

              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comment_count}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {post.content}
            </div>
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* TODO: 작성자만 수정/삭제 버튼 표시 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Link href={`/free-board/${postId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            댓글 {comments.length}개
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 댓글 작성 폼 */}
          <form onSubmit={handleComment} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 작성해주세요..."
              className="min-h-[100px]"
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {newComment.length}/1,000
              </span>
              <Button 
                type="submit" 
                disabled={!newComment.trim() || commentMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                댓글 작성
              </Button>
            </div>
          </form>

          {comments.length > 0 && <Separator />}

          {/* 댓글 목록 */}
          {comments.map((comment) => {
            const commentDisplayName = comment.profiles?.display_name || comment.profiles?.username || 'Anonymous'
            const commentTime = comment.created_at
              ? formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ko
                })
              : '알 수 없음'

            return (
              <div key={comment.id} className="space-y-3">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={comment.profiles.avatar_url || undefined} 
                      alt={commentDisplayName}
                    />
                    <AvatarFallback className="text-xs">
                      {commentDisplayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{commentDisplayName}</span>
                      <span className="text-xs text-gray-500">{commentTime}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
                <Separator />
              </div>
            )
          })}

          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
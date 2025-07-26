'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Post } from '@/types/post'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Eye, Pin } from 'lucide-react'

type FreePost = Post & {
  category?: string // 카테고리 슬러그
}

interface FreePostCardProps {
  post: FreePost
  onLike?: (postId: string) => void
  userLiked?: boolean
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

export default function FreePostCard({ post, onLike, userLiked = false }: FreePostCardProps) {
  const displayName = post.author_display_name || post.author_username
  const relativeTime = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ko
      })
    : '알 수 없음'

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onLike?.(post.id)
  }

  return (
    <Link 
      href={`/free-board/${post.id}`}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
    >
      <div className="space-y-3">
        {/* 헤더 영역 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {post.is_pinned && (
              <Pin className="h-4 w-4 text-yellow-500" />
            )}
            <Badge 
              variant="secondary" 
              className={categoryColors[post.category || 'chat']}
            >
              {categoryLabels[post.category || 'chat']}
            </Badge>
          </div>
          <span className="text-sm text-gray-500">{relativeTime}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
          {post.title}
        </h3>

        {/* 내용 미리보기 */}
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {(post.content || '').replace(/[#*`]/g, '').substring(0, 100)}
          {(post.content?.length || 0) > 100 && '...'}
        </p>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{post.tags.length - 3}개 더
              </span>
            )}
          </div>
        )}

        {/* 하단 정보 */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={post.author_avatar_url || undefined} 
                alt={displayName || undefined}
              />
              <AvatarFallback className="text-xs">
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700 font-medium">
              {displayName}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{post.view_count}</span>
            </div>
            
            <button
              onClick={handleLike}
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
      </div>
    </Link>
  )
}
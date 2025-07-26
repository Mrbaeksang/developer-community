'use client'

// import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Pin, Calendar, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CommunityPost } from '@/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CommunityPostListProps {
  communityId: string
  posts: CommunityPost[]
  isLoading: boolean
  onCreatePost: () => void
}

export function CommunityPostList({ 
  communityId, 
  posts, 
  isLoading,
  onCreatePost 
}: CommunityPostListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            아직 게시글이 없습니다. 첫 게시글을 작성해보세요!
          </p>
          <Button onClick={onCreatePost}>
            게시글 작성하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">커뮤니티 게시판</h3>
        <Button onClick={onCreatePost}>
          게시글 작성
        </Button>
      </div>

      {posts.map((post) => (
        <Link 
          key={post.id} 
          href={`/communities/${communityId}/posts/${post.id}`}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                  {post.is_pinned && (
                    <Pin className="h-4 w-4 text-primary" />
                  )}
                  {post.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
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
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.content}
              </p>
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>댓글 {post.comment_count || 0}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
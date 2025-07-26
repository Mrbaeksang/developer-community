'use client'

import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import FreePostForm from '@/components/free-board/FreePostForm'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type FreePost = Database['public']['Tables']['posts']['Row']
type CategorySlug = 'chat' | 'qna' | 'jobs' | 'events' | 'tips' | 'showcase' | 'help' | 'news' | 'review'

interface FreePostEditFormProps {
  postId: string
}

export default function FreePostEditForm({ postId }: FreePostEditFormProps) {
  const router = useRouter()
  const [categorySlug, setCategorySlug] = useState<CategorySlug | ''>('')

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['free-post-edit', postId],
    queryFn: async (): Promise<FreePost> => {
      const response = await fetch(`/api/free-posts/${postId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('게시글을 찾을 수 없습니다.')
        }
        throw new Error('게시글을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      return data.post
    }
  })

  // Fetch category slug from UUID when post is loaded
  useEffect(() => {
    if (post?.category_id) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          const category = data.categories.find((cat: {id: string, slug: string}) => cat.id === post.category_id)
          if (category && ['chat', 'qna', 'jobs', 'events', 'tips', 'showcase', 'help', 'news', 'review'].includes(category.slug)) {
            setCategorySlug(category.slug as CategorySlug)
          }
        })
        .catch(err => console.error('Failed to fetch category:', err))
    }
  }, [post?.category_id])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-8">
        <p className="text-red-600 mb-4">{error.message}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <FreePostForm
      initialData={{
        title: post.title,
        content: post.content,
        category: categorySlug,
        tags: post.tags || undefined
      }}
      isEdit={true}
      postId={postId}
    />
  )
}
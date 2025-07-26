'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus } from 'lucide-react'
// Database type not used, removed

type CategorySlug = 'chat' | 'qna' | 'jobs' | 'events' | 'tips' | 'showcase' | 'help' | 'news' | 'review'

interface FreePostFormData {
  title: string
  content: string
  category: CategorySlug | ''
  tags: string[]
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

interface FreePostFormProps {
  initialData?: Partial<FreePostFormData>
  isEdit?: boolean
  postId?: string
}

export default function FreePostForm({ initialData, isEdit = false, postId }: FreePostFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Array<{id: string, slug: string}>>([])
  
  const [formData, setFormData] = useState<FreePostFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || '',
    tags: initialData?.tags || []
  })
  
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch categories on mount
  React.useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Filter for free board categories only
        const freeBoardCategories = data.categories.filter((cat: {id: string, slug: string}) => 
          ['chat', 'qna', 'jobs', 'events', 'tips', 'showcase', 'help', 'news', 'review'].includes(cat.slug)
        )
        setCategories(freeBoardCategories)
      })
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  const mutation = useMutation({
    mutationFn: async (data: FreePostFormData) => {
      const url = isEdit ? `/api/free-posts/${postId}` : '/api/free-posts'
      const method = isEdit ? 'PUT' : 'POST'
      
      // Find the category ID from slug
      const category = categories.find(c => c.slug === data.category)
      if (!category) throw new Error('Invalid category')
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category_id: category.id // Send ID instead of slug
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '저장에 실패했습니다.')
      }

      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/free-board/${data.post.id}`)
    },
    onError: (error) => {
      console.error('저장 오류:', error)
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.'
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    mutation.mutate(formData)
  }

  const addTag = () => {
    const tag = newTag.trim()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? '자유게시판 글 수정' : '자유게시판 글 작성'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 *
              </label>
              <Select
                value={formData.category}
                onValueChange={(value: CategorySlug) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'border-red-500' : ''}
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {formData.title.length}/100
              </p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className={`min-h-[300px] ${errors.content ? 'border-red-500' : ''}`}
                placeholder="내용을 입력하세요"
                maxLength={10000}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {formData.content.length}/10,000
              </p>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <div className="flex space-x-2 mb-3">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="태그를 입력하고 Enter를 누르세요"
                  maxLength={20}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-gray-500 text-sm mt-1">
                최대 10개까지 추가할 수 있습니다. ({formData.tags.length}/10)
              </p>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={mutation.isPending}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="min-w-[120px]"
              >
                {mutation.isPending ? '저장 중...' : (isEdit ? '수정하기' : '게시하기')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
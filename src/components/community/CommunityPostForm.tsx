'use client'

// import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CreateCommunityPostInput } from '@/types/community'
import { Loader2 } from 'lucide-react'

interface CommunityPostFormProps {
  onSubmit: (data: CreateCommunityPostInput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function CommunityPostForm({
  onSubmit,
  onCancel,
  isSubmitting = false
}: CommunityPostFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<CreateCommunityPostInput>()

  return (
    <Card>
      <CardHeader>
        <CardTitle>게시글 작성</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              {...register('title', { 
                required: '제목을 입력해주세요',
                maxLength: {
                  value: 100,
                  message: '제목은 100자 이하로 입력해주세요'
                }
              })}
              placeholder="게시글 제목을 입력하세요"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              {...register('content', { 
                required: '내용을 입력해주세요',
                minLength: {
                  value: 10,
                  message: '내용은 10자 이상 입력해주세요'
                }
              })}
              placeholder="게시글 내용을 입력하세요"
              rows={8}
              disabled={isSubmitting}
            />
            {errors.content && (
              <p className="text-sm text-destructive mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  작성 중...
                </>
              ) : (
                '게시글 작성'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
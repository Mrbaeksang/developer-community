'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'

interface MemoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memo?: {
    id: string
    title: string
    content: string
    tags: string[]
    is_pinned: boolean
  }
  onSubmit: (data: {
    title: string
    content: string
    tags: string[]
    is_pinned: boolean
  }) => void
}

export function MemoModal({ open, onOpenChange, memo, onSubmit }: MemoModalProps) {
  const [title, setTitle] = useState(memo?.title || '')
  const [content, setContent] = useState(memo?.content || '')
  const [tags, setTags] = useState<string[]>(memo?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(memo?.is_pinned || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    onSubmit({
      title,
      content,
      tags,
      is_pinned: isPinned
    })

    // 폼 초기화
    if (!memo) {
      setTitle('')
      setContent('')
      setTags([])
      setIsPinned(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{memo ? '메모 수정' : '새 메모 작성'}</DialogTitle>
            <DialogDescription>
              커뮤니티 멤버들과 공유할 정보를 작성하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="메모 제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="마크다운 형식을 지원합니다"
                rows={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="태그 입력"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  maxLength={20}
                />
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={addTag} 
                  disabled={tags.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                최대 5개까지 추가할 수 있습니다
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned" className="cursor-pointer">
                상단에 고정하기
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!title.trim() || !content.trim()}>
              {memo ? '수정하기' : '작성하기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Save,
  Send,
  X,
  Plus
} from 'lucide-react'

const categories = [
  { id: 'project', name: '프로젝트', slug: 'project', color: '#3B82F6' },
  { id: 'tech', name: '기술', slug: 'tech', color: '#10B981' },
  { id: 'news', name: '뉴스', slug: 'news', color: '#F59E0B' },
  { id: 'qna', name: '질문', slug: 'qna', color: '#EF4444' },
  { id: 'tutorial', name: '튜토리얼', slug: 'tutorial', color: '#8B5CF6' },
  { id: 'career', name: '취업', slug: 'career', color: '#EC4899' },
  { id: 'general', name: '일반', slug: 'general', color: '#6B7280' }
]

export default function WritePostPage() {
  const router = useRouter()
  const [isPreview, setIsPreview] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    excerpt: '',
    content: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 게시글 제출 로직
    console.log('게시글 제출:', { ...formData, tags })
    alert('게시글이 제출되었습니다. 관리자 승인 후 게시됩니다.')
    router.push('/posts')
  }

  const handleSaveDraft = () => {
    // TODO: 임시저장 로직
    console.log('임시저장:', { ...formData, tags })
    alert('임시저장되었습니다.')
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const selectedCategory = categories.find(cat => cat.id === formData.category_id)

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            게시글 목록으로
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>새 게시글 작성</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreview(!isPreview)}
                  >
                    {isPreview ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        편집
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        미리보기
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  작성하신 글은 관리자 검토 후 게시됩니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isPreview ? (
                  <>
                    {/* 제목 */}
                    <div className="space-y-2">
                      <Label htmlFor="title">제목 *</Label>
                      <Input
                        id="title"
                        placeholder="독자의 관심을 끌 수 있는 제목을 입력하세요"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    {/* 요약 */}
                    <div className="space-y-2">
                      <Label htmlFor="excerpt">요약</Label>
                      <Textarea
                        id="excerpt"
                        placeholder="게시글의 간단한 요약을 입력하세요 (선택사항)"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={2}
                      />
                    </div>

                    {/* 내용 */}
                    <div className="space-y-2">
                      <Label htmlFor="content">내용 *</Label>
                      <Textarea
                        id="content"
                        placeholder="게시글 내용을 입력하세요. 마크다운 문법을 지원합니다."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={15}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        마크다운 문법을 사용할 수 있습니다
                      </p>
                    </div>
                  </>
                ) : (
                  /* 미리보기 */
                  <div className="prose prose-sm max-w-none">
                    <h1>{formData.title || '제목을 입력하세요'}</h1>
                    {formData.excerpt && (
                      <p className="text-lg text-muted-foreground">{formData.excerpt}</p>
                    )}
                    <div className="whitespace-pre-wrap">
                      {formData.content || '내용을 입력하세요'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 카테고리 */}
            <Card>
              <CardHeader>
                <CardTitle>카테고리</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <div className="mt-3">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${selectedCategory.color}20`, 
                        color: selectedCategory.color 
                      }}
                    >
                      {selectedCategory.name}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 태그 */}
            <Card>
              <CardHeader>
                <CardTitle>태그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="태그 입력"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" size="icon" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
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
                </div>
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  게시글 제출
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSaveDraft}
                >
                  <Save className="mr-2 h-4 w-4" />
                  임시저장
                </Button>
              </CardContent>
            </Card>

            {/* 작성 가이드 */}
            <Card>
              <CardHeader>
                <CardTitle>작성 가이드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• 제목은 명확하고 구체적으로 작성해주세요</p>
                <p>• 코드는 백틱(```)으로 감싸주세요</p>
                <p>• 이미지는 외부 URL을 사용해주세요</p>
                <p>• 부적절한 내용은 거부될 수 있습니다</p>
                <p>• 승인까지 최대 24시간이 소요됩니다</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
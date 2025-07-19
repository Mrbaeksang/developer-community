'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye } from 'lucide-react'

const categories = [
  { id: 'ai-news', name: 'AI 뉴스', description: '인공지능 관련 최신 소식' },
  { id: 'tech-trends', name: '기술 트렌드', description: '개발 트렌드와 신기술' },
  { id: 'dev-tips', name: '개발 팁', description: '실무 개발 팁과 노하우' }
]

export default function NewBlogPostPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    categoryId: 'ai-news',
    tags: '',
    status: 'draft' as 'draft' | 'published'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Supabase로 포스트 저장
    setTimeout(() => {
      setIsLoading(false)
      router.push('/admin/blog/posts')
    }, 1000)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/blog/posts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              포스트 목록
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">새 블로그 포스트</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {showPreview ? '편집' : '미리보기'}
        </Button>
      </div>

      {showPreview ? (
        <Card>
          <CardHeader>
            <Badge className="w-fit mb-2">{categories.find(c => c.id === formData.categoryId)?.name}</Badge>
            <CardTitle className="text-2xl">{formData.title || '제목 없음'}</CardTitle>
            <CardDescription>{formData.excerpt || '요약 없음'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{formData.content || '내용 없음'}</pre>
            </div>
            {formData.tags && (
              <div className="mt-6 flex flex-wrap gap-2">
                {formData.tags.split(',').map((tag, i) => (
                  <Badge key={i} variant="outline">#{tag.trim()}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                블로그 포스트의 기본 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="포스트 제목을 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">요약</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="포스트 요약을 입력하세요 (목록에 표시됩니다)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">카테고리 *</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">태그</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="태그1, 태그2, 태그3"
                  />
                  <p className="text-xs text-muted-foreground">
                    콤마로 구분하여 입력
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>내용</CardTitle>
              <CardDescription>
                마크다운 형식으로 작성할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="포스트 내용을 입력하세요..."
                rows={20}
                className="font-mono text-sm"
                required
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? '저장 중...' : '게시하기'}
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading}
                onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
              >
                임시 저장
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
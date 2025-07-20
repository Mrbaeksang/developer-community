'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { ArrowLeft, Save, Eye } from 'lucide-react'

// 임시 포스트 데이터
const postData = {
  id: '1',
  title: 'Next.js 14에서 App Router 활용하기',
  slug: 'nextjs-14-app-router',
  content: `# Next.js 14에서 App Router 활용하기

Next.js 14의 App Router는 React Server Components를 기반으로 한 새로운 라우팅 시스템입니다.

## 주요 특징

1. **서버 컴포넌트 기본 지원**
   - 기본적으로 모든 컴포넌트가 서버 컴포넌트
   - 필요한 경우에만 'use client' 사용

2. **향상된 데이터 페칭**
   - fetch API 자동 캐싱
   - 병렬 데이터 페칭 지원

3. **레이아웃 시스템**
   - 중첩 레이아웃 지원
   - 부분 렌더링 최적화

## 코드 예제

\`\`\`typescript
// app/page.tsx
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
\`\`\``,
  category: 'tech',
  status: 'published',
  excerpt: 'Next.js 14의 새로운 App Router를 사용하여 더 나은 성능과 개발 경험을 얻는 방법을 알아봅니다.'
}

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: postData.title,
    slug: postData.slug,
    content: postData.content,
    category: postData.category,
    status: postData.status,
    excerpt: postData.excerpt
  })
  const [isPreview, setIsPreview] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 여기서 실제로는 API 호출
    console.log('수정된 포스트:', formData)
    router.push('/admin/blog/posts')
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/blog/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            포스트 목록으로
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">블로그 포스트 수정</h1>
            <p className="text-muted-foreground">
              포스트 내용을 수정하고 업데이트하세요
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreview ? '편집' : '미리보기'}
          </Button>
        </div>
      </div>

      {isPreview ? (
        // 미리보기
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{formData.title}</CardTitle>
            <CardDescription>
              {formData.excerpt}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {/* 실제로는 마크다운 파서 사용 */}
              <div dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, '<br />') }} />
            </div>
          </CardContent>
        </Card>
      ) : (
        // 편집 폼
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">슬러그</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">카테고리</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">기술</SelectItem>
                        <SelectItem value="tutorial">튜토리얼</SelectItem>
                        <SelectItem value="news">뉴스</SelectItem>
                        <SelectItem value="career">커리어</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">상태</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">초안</SelectItem>
                        <SelectItem value="published">발행됨</SelectItem>
                        <SelectItem value="archived">보관됨</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">요약</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>내용</CardTitle>
                <CardDescription>
                  마크다운 형식으로 작성하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={20}
                  className="font-mono text-sm"
                  required
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/blog/posts">취소</Link>
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                저장하기
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
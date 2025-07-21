'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Plus,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

// 타입 정의
interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface User {
  id: string
  username: string
  avatar_url: string | null
  bio?: string
  role?: string
}

interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  author: User
  category: Category
  status: string
  tags: string[]
  created_at: string
  updated_at: string
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [isPreview, setIsPreview] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    excerpt: '',
    content: '',
  })

  // 데이터 로드
  useEffect(() => {
    const initializePage = async () => {
      const supabase = createClient()
      
      try {
        // 현재 사용자 확인
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        // 사용자 프로필 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio, role')
          .eq('id', session.user.id)
          .single()
        
        setCurrentUser(profile)

        // 게시글 데이터 로드
        const postResponse = await fetch(`/api/posts/${id}`)
        if (!postResponse.ok) {
          if (postResponse.status === 404) {
            throw new Error('게시글을 찾을 수 없습니다')
          }
          throw new Error('게시글을 불러오는데 실패했습니다')
        }
        const postData = await postResponse.json()
        
        // 권한 확인 (작성자 또는 관리자만 수정 가능)
        if (postData.author.id !== profile?.id && profile?.role !== 'admin') {
          throw new Error('이 게시글을 수정할 권한이 없습니다')
        }
        
        setPost(postData)
        setFormData({
          title: postData.title,
          category_id: postData.category.id,
          excerpt: postData.excerpt || '',
          content: postData.content,
        })
        setTags(postData.tags || [])

        // 카테고리 데이터 로드
        const categoriesResponse = await fetch('/api/categories')
        if (!categoriesResponse.ok) throw new Error('카테고리를 불러오는데 실패했습니다')
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '페이지를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      alert('제목, 내용, 카테고리는 필수 입력 항목입니다.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags,
          status: post?.status === 'published' ? 'published' : 'pending' // 이미 게시된 글은 즉시 반영, 아니면 재승인
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '게시글 수정에 실패했습니다')
      }

      alert('게시글이 수정되었습니다.')
      router.push(`/posts/${id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '게시글 수정에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      alert('제목이나 내용을 입력해주세요.')
      return
    }

    setSavingDraft(true)
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags,
          status: 'draft' // 임시저장 상태
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '임시저장에 실패했습니다')
      }

      alert('임시저장되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '임시저장에 실패했습니다')
    } finally {
      setSavingDraft(false)
    }
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

  // 로딩 상태
  if (loading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">게시글을 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
            <Button variant="outline" asChild>
              <Link href="/posts">게시글 목록으로</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/posts/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            게시글로 돌아가기
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
                  <CardTitle>게시글 수정</CardTitle>
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
                  {post?.status === 'published' 
                    ? '수정 사항이 즉시 반영됩니다' 
                    : '수정된 내용은 관리자 검토 후 게시됩니다'
                  }
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
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {submitting ? '수정 중...' : '수정 완료'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                >
                  {savingDraft ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {savingDraft ? '저장 중...' : '임시저장'}
                </Button>
              </CardContent>
            </Card>

            {/* 게시글 정보 */}
            {post && (
              <Card>
                <CardHeader>
                  <CardTitle>게시글 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상태:</span>
                    <Badge variant={
                      post.status === 'published' ? 'default' :
                      post.status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {post.status === 'published' ? '게시됨' :
                       post.status === 'pending' ? '승인 대기' : '임시저장'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">작성일:</span>
                    <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수정일:</span>
                    <span>{new Date(post.updated_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 수정 가이드 */}
            <Card>
              <CardHeader>
                <CardTitle>수정 가이드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• 제목은 명확하고 구체적으로 작성해주세요</p>
                <p>• 코드는 백틱(```)으로 감싸주세요</p>
                <p>• 이미지는 외부 URL을 사용해주세요</p>
                <p>• 부적절한 내용은 거부될 수 있습니다</p>
                {post?.status !== 'published' && (
                  <p>• 재승인까지 최대 24시간이 소요됩니다</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
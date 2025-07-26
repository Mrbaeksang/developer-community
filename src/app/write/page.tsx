/**
 * 통합 글쓰기 페이지
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, knowledge_posts 테이블 없음!
 * - ✅ 모든 게시글은 posts 테이블에 저장
 * - 📌 board_type_id로 구분:
 *   - 지식공유: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885' (requires_approval: true)
 *   - 자유게시판: '00f8f32b-faca-4947-94f5-812a0bb97c39' (requires_approval: false)
 * 
 * 🔄 API 호출:
 * - 지식공유 선택 → /api/posts (status='pending'으로 생성)
 * - 자유게시판 선택 → /api/free-posts (status='published'로 즉시 게시)
 * 
 * ⚠️ 주의: 게시판 타입에 따라 다른 API 엔드포인트 호출!
 * 모두 같은 posts 테이블에 저장되지만 승인 플로우가 다름
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Save,
  Send,
  X,
  Plus,
  Loader2,
  BookOpen,
  MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils/cn'
import type { User } from '@/types/auth'
import type { Category, BoardType, CreatePostInput } from '@/types/post'

export default function UnifiedWritePage() {
  const router = useRouter()
  const [type, setType] = useState<'knowledge' | 'forum'>('knowledge')
  const [isPreview, setIsPreview] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])  
  const [boardTypeId, setBoardTypeId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    excerpt: '',
    content: '',
  })

  // 인증 확인 및 사용자 정보 로드
  useEffect(() => {
    const initializePage = async () => {
      const supabase = createClient()
      
      try {
        // 로컬 스토리지에서 빠른 확인 (헤더와 동기화)
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('header-user')
          if (!storedUser) {
            // 로컬 스토리지에 사용자 정보가 없으면 로그인 필요
            console.log('Write page: 로컬 스토리지에 사용자 정보 없음 → 로그인 페이지로')
            router.push('/auth/login')
            return
          }
        }
        
        // 서버 세션 확인
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
        
        if (profile) {
          setCurrentUser({
            id: profile.id,
            email: session.user.email || '',
            username: profile.username,
            role: profile.role,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            is_email_verified: session.user.email_confirmed_at !== null,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          })
        }
        
        // board_type_id 가져오기 (초기값: knowledge = official)
        const { data: boardTypeData } = await supabase
          .from('board_types')
          .select('id')
          .eq('slug', 'official')
          .single()
        
        if (boardTypeData) {
          setBoardTypeId(boardTypeData.id)
          
          // 해당 board_type의 카테고리 목록 가져오기
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('board_type_id', boardTypeData.id)
            .eq('is_active', true)
            .order('order_index')
          
          if (categoriesData) {
            setCategories(categoriesData)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '페이지를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  // type이 변경될 때 카테고리 목록 업데이트
  useEffect(() => {
    const updateCategories = async () => {
      const supabase = createClient()
      
      // board_type에 따른 카테고리 가져오기
      const boardSlug = type === 'knowledge' ? 'official' : 'forum'
      const { data: boardTypeData } = await supabase
        .from('board_types')
        .select('id')
        .eq('slug', boardSlug)
        .single()
      
      if (boardTypeData) {
        setBoardTypeId(boardTypeData.id)
        
        // API 엔드포인트를 사용하여 카테고리 가져오기
        try {
          const response = await fetch(`/api/categories/${boardTypeData.id}`)
          if (response.ok) {
            const categoriesData = await response.json()
            setCategories(categoriesData)
            // 카테고리가 변경되면 선택된 카테고리 초기화
            setFormData(prev => ({ ...prev, category_id: '' }))
          }
        } catch (err) {
          console.error('카테고리 로드 실패:', err)
        }
      }
    }
    
    updateCategories()
  }, [type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category_id || !formData.title.trim() || !formData.content.trim()) {
      alert('카테고리, 제목, 내용은 필수 입력 항목입니다.')
      return
    }

    setSubmitting(true)
    try {
      // board_type_id를 미리 가져오기 (지식공유 또는 자유게시판)
      const supabase = createClient()
      const { data: boardType } = await supabase
        .from('board_types')
        .select('id')
        .eq('slug', type === 'knowledge' ? 'official' : 'forum')
        .single()
      
      if (!boardType) {
        throw new Error('게시판 타입을 찾을 수 없습니다.')
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_type_id: boardType.id,
          ...formData,
          tags,
          status: type === 'forum' ? 'published' : 'pending' // 자유게시판은 즉시 게시, 지식공유는 승인 필요
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '게시글 제출에 실패했습니다')
      }

      const result = await response.json()
      alert(result.message)
      
      // 성공 시 해당 게시판으로 이동
      router.push(type === 'knowledge' ? '/knowledge' : '/forum')
    } catch (err) {
      alert(err instanceof Error ? err.message : '게시글 제출에 실패했습니다')
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
      // board_type_id를 미리 가져오기 (지식공유 또는 자유게시판)
      const supabase = createClient()
      const { data: boardType } = await supabase
        .from('board_types')
        .select('id')
        .eq('slug', type === 'knowledge' ? 'official' : 'forum')
        .single()
      
      if (!boardType) {
        throw new Error('게시판 타입을 찾을 수 없습니다.')
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_type_id: boardType.id,
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
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">페이지를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container max-w-6xl py-8">
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
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로 가기
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-4">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>새 게시글 작성</CardTitle>
                    <CardDescription>
                      게시판과 카테고리를 선택한 후 글을 작성해주세요
                    </CardDescription>
                  </div>
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
            {/* 게시판 타입 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>게시판 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={type === 'knowledge' ? 'default' : 'outline'}
                    onClick={() => setType('knowledge')}
                    className="justify-start"
                    disabled={submitting || savingDraft}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    지식 공유
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'forum' ? 'default' : 'outline'}
                    onClick={() => setType('forum')}
                    className="justify-start"
                    disabled={submitting || savingDraft}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    자유게시판
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {type === 'knowledge' 
                    ? '지식 공유 게시글은 관리자 승인 후 게시됩니다.'
                    : '자유게시판 게시글은 즉시 게시됩니다.'}
                </p>
              </CardContent>
            </Card>

            {/* 카테고리 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>카테고리</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting || savingDraft}
                  required
                >
                  <option value="">카테고리 선택</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* 작성자 프로필 */}
            {currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle>작성자</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {currentUser.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={currentUser.avatar_url} 
                          alt={currentUser.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {currentUser.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {currentUser.username || '사용자'}
                      </p>
                      {currentUser.bio && (
                        <p className="text-xs text-muted-foreground truncate">
                          {currentUser.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <p className="text-xs text-muted-foreground">
                    최대 10개까지 추가할 수 있습니다 ({tags.length}/10)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || !formData.category_id}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {submitting ? '제출 중...' : '게시글 제출'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || (!formData.title.trim() && !formData.content.trim())}
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

            {/* 작성 가이드 */}
            <Card>
              <CardHeader>
                <CardTitle>작성 가이드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• 게시판 타입과 카테고리를 선택해주세요</p>
                <p>• 제목은 명확하고 구체적으로 작성해주세요</p>
                <p>• 코드는 백틱(```)으로 감싸주세요</p>
                <p>• 이미지는 외부 URL을 사용해주세요</p>
                <p>• 지식 공유 글은 관리자 승인 후 게시됩니다</p>
                <p>• 자유게시판 글은 즉시 게시됩니다</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
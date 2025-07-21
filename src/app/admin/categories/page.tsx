'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Tag,
  Search,
  RotateCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

// 타입 정의
interface Category {
  id: string
  name: string
  slug: string
  color: string
  description?: string
  post_count?: number
  created_at: string
  updated_at: string
}

// 미리 정의된 색상 팔레트
const colorPalette = [
  { name: '파란색', value: '#3B82F6' },
  { name: '초록색', value: '#10B981' },
  { name: '보라색', value: '#8B5CF6' },
  { name: '빨간색', value: '#EF4444' },
  { name: '주황색', value: '#F59E0B' },
  { name: '분홍색', value: '#EC4899' },
  { name: '청록색', value: '#06B6D4' },
  { name: '라임색', value: '#84CC16' },
  { name: '인디고', value: '#6366F1' },
  { name: '회색', value: '#6B7280' }
]

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // 다이얼로그 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
    description: ''
  })

  // 인증 확인 및 초기 데이터 로드
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
          .select('id, username, avatar_url, role')
          .eq('id', session.user.id)
          .single()
        
        // 관리자 권한 확인
        if (profile?.role !== 'admin') {
          router.push('/')
          return
        }
        
        setCurrentUser(profile)

        // 카테고리 데이터 로드
        await fetchCategories()
      } catch (err) {
        setError(err instanceof Error ? err.message : '페이지를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (!response.ok) throw new Error('카테고리를 불러오는데 실패했습니다')
      
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      console.error('카테고리 로드 실패:', err)
      setError(err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다')
    }
  }

  // 슬러그 자동 생성
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('카테고리 이름을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '카테고리 생성에 실패했습니다')
      }

      await fetchCategories()
      setIsCreateDialogOpen(false)
      setFormData({ name: '', slug: '', color: '#3B82F6', description: '' })
      alert('카테고리가 생성되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '카테고리 생성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !formData.name.trim()) {
      alert('카테고리 이름을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '카테고리 수정에 실패했습니다')
      }

      await fetchCategories()
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', color: '#3B82F6', description: '' })
      alert('카테고리가 수정되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '카테고리 수정에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?\n카테고리를 사용하는 게시글이 있으면 삭제할 수 없습니다.')) {
      return
    }

    setDeleting(categoryId)
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '카테고리 삭제에 실패했습니다')
      }

      await fetchCategories()
      alert('카테고리가 삭제되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '카테고리 삭제에 실패했습니다')
    } finally {
      setDeleting(null)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      color: category.color,
      description: category.description || ''
    })
    setIsEditDialogOpen(true)
  }

  // 검색 필터링
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">카테고리를 불러오는 중...</span>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="space-x-2">
          <Button onClick={() => window.location.reload()}>
            다시 시도
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            대시보드로
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">카테고리 관리</h1>
        <p className="text-muted-foreground">
          게시글 카테고리를 생성, 수정, 삭제할 수 있습니다.
        </p>
      </div>

      {/* 액션 바 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button onClick={fetchCategories} variant="outline" size="sm">
            <RotateCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              카테고리 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 카테고리 생성</DialogTitle>
              <DialogDescription>
                새로운 게시글 카테고리를 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">카테고리 이름 *</Label>
                  <Input
                    id="name"
                    placeholder="예: 프론트엔드"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">슬러그</Label>
                  <Input
                    id="slug"
                    placeholder="자동 생성됩니다"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">색상</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="색상 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorPalette.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full border" 
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Input
                    id="description"
                    placeholder="카테고리 설명 (선택사항)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {submitting ? '생성 중...' : '생성'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 카테고리 목록 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchQuery ? '검색 결과가 없습니다' : '생성된 카테고리가 없습니다'}
                </p>
                {!searchQuery && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    첫 카테고리 만들기
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </CardTitle>
                    <CardDescription>
                      {category.description || '설명이 없습니다'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {category.post_count || 0}개 게시글
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>슬러그: {category.slug}</p>
                    <p>생성일: {new Date(category.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      disabled={deleting === category.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deleting === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
            <DialogDescription>
              카테고리 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">카테고리 이름 *</Label>
                <Input
                  id="edit-name"
                  placeholder="예: 프론트엔드"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">슬러그</Label>
                <Input
                  id="edit-slug"
                  placeholder="자동 생성됩니다"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">색상</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="색상 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorPalette.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full border" 
                            style={{ backgroundColor: color.value }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">설명</Label>
                <Input
                  id="edit-description"
                  placeholder="카테고리 설명 (선택사항)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                {submitting ? '수정 중...' : '수정'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
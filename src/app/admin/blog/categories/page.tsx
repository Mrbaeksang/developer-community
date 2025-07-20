'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  FileText,
  TrendingUp
} from 'lucide-react'

// 임시 카테고리 데이터
const categoriesData = [
  {
    id: '1',
    name: '기술',
    slug: 'tech',
    description: '개발 관련 기술 포스트',
    postCount: 45,
    color: 'blue'
  },
  {
    id: '2',
    name: '튜토리얼',
    slug: 'tutorial',
    description: '단계별 학습 가이드',
    postCount: 23,
    color: 'green'
  },
  {
    id: '3',
    name: '뉴스',
    slug: 'news',
    description: '부트캠프 소식과 공지사항',
    postCount: 12,
    color: 'purple'
  },
  {
    id: '4',
    name: '커리어',
    slug: 'career',
    description: '취업 및 성장 관련 포스트',
    postCount: 8,
    color: 'orange'
  }
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState(categoriesData)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  })

  const handleCreate = () => {
    const newCategory = {
      id: Date.now().toString(),
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      postCount: 0,
      color: 'gray'
    }
    setCategories([...categories, newCategory])
    setIsCreateOpen(false)
    setFormData({ name: '', slug: '', description: '' })
  }

  const handleEdit = () => {
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, ...formData }
        : cat
    ))
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '' })
  }

  const handleDelete = (id: string) => {
    if (confirm('정말 이 카테고리를 삭제하시겠습니까?')) {
      setCategories(categories.filter(cat => cat.id !== id))
    }
  }

  const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0)

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            관리자 대시보드로
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">카테고리 관리</h1>
            <p className="text-muted-foreground">
              블로그 카테고리를 관리하고 구성하세요
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 카테고리
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 카테고리 만들기</DialogTitle>
                <DialogDescription>
                  블로그 포스트를 분류할 새 카테고리를 만드세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">카테고리 이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 기술"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">슬러그</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="예: tech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="카테고리 설명"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreate}>만들기</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 카테고리</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              활성 카테고리
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 포스트</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              카테고리별 포스트
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 포스트</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(totalPosts / categories.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              카테고리당 평균
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>슬러그</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-center">포스트 수</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {category.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {category.slug}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {category.description}
                  </TableCell>
                  <TableCell className="text-center">
                    {category.postCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category)
                              setFormData({
                                name: category.name,
                                slug: category.slug,
                                description: category.description
                              })
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>카테고리 수정</DialogTitle>
                            <DialogDescription>
                              카테고리 정보를 수정하세요
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">카테고리 이름</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-slug">슬러그</Label>
                              <Input
                                id="edit-slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">설명</Label>
                              <Input
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingCategory(null)}>
                              취소
                            </Button>
                            <Button onClick={handleEdit}>저장</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        disabled={category.postCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
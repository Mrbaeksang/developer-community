'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Eye, 
  Check, 
  X as XIcon,
  Calendar,
  User,
  Filter,
  Search,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react'

// 임시 대기 중 게시글 데이터
const pendingPosts = [
  {
    id: '1',
    title: 'Vue 3 Composition API 완벽 가이드',
    excerpt: 'Vue 3에서 새롭게 도입된 Composition API를 자세히 알아보고 실제 프로젝트에 적용하는 방법을 소개합니다.',
    content: `# Vue 3 Composition API 완벽 가이드

Vue 3에서 가장 주목받는 기능 중 하나인 Composition API에 대해 알아보겠습니다...

[전체 내용 생략]`,
    author: { id: '5', username: 'vue_developer', email: 'vue@example.com' },
    category: { id: 'tech', name: '기술', color: '#10B981' },
    tags: ['Vue', 'JavaScript', 'Frontend'],
    created_at: '2025-01-20T10:30:00Z',
    status: 'pending'
  },
  {
    id: '2',
    title: '주니어 개발자를 위한 코드 리뷰 가이드',
    excerpt: '효과적인 코드 리뷰를 위한 체크리스트와 실전 팁을 공유합니다.',
    content: `# 주니어 개발자를 위한 코드 리뷰 가이드

코드 리뷰는 개발 문화의 중요한 부분입니다...

[전체 내용 생략]`,
    author: { id: '6', username: 'senior_dev', email: 'senior@example.com' },
    category: { id: 'career', name: '취업', color: '#EC4899' },
    tags: ['코드리뷰', '개발문화', '협업'],
    created_at: '2025-01-20T09:15:00Z',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Docker Compose로 개발 환경 표준화하기',
    excerpt: '팀 전체가 동일한 개발 환경을 사용할 수 있도록 Docker Compose를 활용하는 방법을 소개합니다.',
    content: `# Docker Compose로 개발 환경 표준화하기

개발 환경의 차이로 인한 문제를 해결하는 방법...

[전체 내용 생략]`,
    author: { id: '7', username: 'devops_engineer', email: 'devops@example.com' },
    category: { id: 'tutorial', name: '튜토리얼', color: '#8B5CF6' },
    tags: ['Docker', 'DevOps', '개발환경'],
    created_at: '2025-01-19T16:45:00Z',
    status: 'pending'
  }
]

export default function PendingPostsPage() {
  const [posts, setPosts] = useState(pendingPosts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPost, setSelectedPost] = useState<typeof pendingPosts[0] | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  const handleApprove = (postId: string) => {
    if (confirm('이 게시글을 승인하시겠습니까?')) {
      setPosts(posts.filter(post => post.id !== postId))
      // TODO: 실제 승인 처리 로직
      alert('게시글이 승인되었습니다.')
    }
  }

  const handleReject = (postId: string) => {
    if (!rejectionReason.trim()) {
      alert('거부 사유를 입력해주세요.')
      return
    }

    setPosts(posts.filter(post => post.id !== postId))
    setIsRejectDialogOpen(false)
    setRejectionReason('')
    // TODO: 실제 거부 처리 로직
    alert('게시글이 거부되었습니다.')
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category.id === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">게시글 승인 대기</h1>
        <p className="text-muted-foreground">
          사용자가 작성한 게시글을 검토하고 승인 또는 거부할 수 있습니다.
        </p>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제목, 내용, 작성자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="project">프로젝트</SelectItem>
                <SelectItem value="tech">기술</SelectItem>
                <SelectItem value="news">뉴스</SelectItem>
                <SelectItem value="qna">질문</SelectItem>
                <SelectItem value="tutorial">튜토리얼</SelectItem>
                <SelectItem value="career">취업</SelectItem>
                <SelectItem value="general">일반</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">대기 중</p>
              <p className="text-2xl font-bold">{posts.length}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">오늘 승인</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">오늘 거부</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <XIcon className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                승인 대기 중인 게시글이 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${post.category.color}20`, 
                      color: post.category.color 
                    }}
                  >
                    {post.category.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author.username}</span>
                    <span className="text-xs">({post.author.email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedPost(post)}>
                      <Eye className="mr-2 h-4 w-4" />
                      미리보기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{selectedPost?.title}</DialogTitle>
                      <DialogDescription>
                        {selectedPost?.author.username} · {selectedPost && new Date(selectedPost.created_at).toLocaleString('ko-KR')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ 
                          __html: selectedPost?.content.replace(/\n/g, '<br />') || '' 
                        }} />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(post.id)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  승인
                </Button>

                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setSelectedPost(post)
                        setIsRejectDialogOpen(true)
                      }}
                    >
                      <XIcon className="mr-2 h-4 w-4" />
                      거부
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>게시글 거부</DialogTitle>
                      <DialogDescription>
                        이 게시글을 거부하는 이유를 작성해주세요. 작성자에게 전달됩니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="reason">거부 사유 *</Label>
                        <Textarea
                          id="reason"
                          placeholder="예: 부적절한 내용이 포함되어 있습니다."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          거부 사유는 작성자에게 이메일로 전송됩니다. 
                          건설적이고 구체적인 피드백을 제공해주세요.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsRejectDialogOpen(false)
                          setRejectionReason('')
                        }}
                      >
                        취소
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => selectedPost && handleReject(selectedPost.id)}
                        disabled={!rejectionReason.trim()}
                      >
                        거부하기
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
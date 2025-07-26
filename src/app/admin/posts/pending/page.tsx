'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sanitizeAndFormatContent } from '@/lib/sanitize'
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
  Search,
  AlertCircle,
  FileText,
  Clock,
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

interface Author {
  id: string
  username: string
  email: string
  avatar_url?: string | null
}

interface PendingPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: Author
  category: Category
  tags: string[]
  created_at: string
  status: string
}

export default function PendingPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<PendingPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [todayStats, setTodayStats] = useState({ approved: 0, rejected: 0 })

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

        // 대기 중인 게시글 로드
        await fetchPendingPosts()
        
        // 카테고리 데이터 로드 (board_types 구조 반영)
        await fetchCategories()
        
        // 오늘 통계 로드
        await fetchTodayStats()
      } catch (err) {
        setError(err instanceof Error ? err.message : '페이지를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchPendingPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status: 'pending'
      })
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/admin/posts?${params}`)
      if (!response.ok) throw new Error('대기 중인 게시글을 불러오는데 실패했습니다')
      
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error('게시글 로드 실패:', err)
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다')
    }
  }, [selectedCategory, searchQuery])

  const fetchCategories = async () => {
    try {
      // board_types를 통해 카테고리 가져오기
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('카테고리를 불러오는데 실패했습니다')
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      console.error('카테고리 로드 실패:', err)
    }
  }

  const fetchTodayStats = async () => {
    try {
      const response = await fetch('/api/admin/posts/stats')
      if (!response.ok) throw new Error('통계를 불러오는데 실패했습니다')
      const data = await response.json()
      setTodayStats(data.today || { approved: 0, rejected: 0 })
    } catch (err) {
      console.error('통계 로드 실패:', err)
    }
  }

  // 검색어나 카테고리 변경 시 다시 로드
  useEffect(() => {
    if (!loading && currentUser) {
      fetchPendingPosts()
    }
  }, [searchQuery, selectedCategory, loading, currentUser, fetchPendingPosts])

  const handleApprove = async (postId: string) => {
    if (!confirm('이 게시글을 승인하시겠습니까?')) return

    setApproving(postId)
    try {
      const response = await fetch(`/api/admin/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '게시글 승인에 실패했습니다')
      }

      // 승인된 게시글을 목록에서 제거
      setPosts(prev => prev.filter(post => post.id !== postId))
      setTodayStats(prev => ({ ...prev, approved: prev.approved + 1 }))
      
      alert('게시글이 승인되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '게시글 승인에 실패했습니다')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (postId: string) => {
    if (!rejectionReason.trim()) {
      alert('거부 사유를 입력해주세요.')
      return
    }

    setRejecting(postId)
    try {
      const response = await fetch(`/api/admin/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '게시글 거부에 실패했습니다')
      }

      // 거부된 게시글을 목록에서 제거
      setPosts(prev => prev.filter(post => post.id !== postId))
      setTodayStats(prev => ({ ...prev, rejected: prev.rejected + 1 }))
      
      setIsRejectDialogOpen(false)
      setRejectionReason('')
      alert('게시글이 거부되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '게시글 거부에 실패했습니다')
    } finally {
      setRejecting(null)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">관리자 페이지를 불러오는 중...</span>
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
          <Button variant="outline" asChild>
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>
    )
  }

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
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
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
              <p className="text-2xl font-bold">{todayStats.approved}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">오늘 거부</p>
              <p className="text-2xl font-bold">{todayStats.rejected}</p>
            </div>
            <XIcon className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                승인 대기 중인 게시글이 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
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
                          __html: sanitizeAndFormatContent(selectedPost?.content || '') 
                        }} />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(post.id)}
                  disabled={approving === post.id || rejecting === post.id}
                >
                  {approving === post.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {approving === post.id ? '승인 중...' : '승인'}
                </Button>

                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setSelectedPost(post)
                        setIsRejectDialogOpen(true)
                      }}
                      disabled={approving === post.id || rejecting === post.id}
                    >
                      {rejecting === post.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XIcon className="mr-2 h-4 w-4" />
                      )}
                      {rejecting === post.id ? '거부 중...' : '거부'}
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
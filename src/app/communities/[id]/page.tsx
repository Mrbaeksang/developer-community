'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Send,
  Users, 
  MessageCircle,
  FileText,
  Upload,
  Download,
  MoreVertical,
  Settings,
  UserPlus,
  LogOut,
  Pin,
  File,
  Calendar,
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MemoModal } from '@/components/community/MemoModal'
import { FileUploadModal } from '@/components/community/FileUploadModal'

// 임시 커뮤니티 데이터
const community = {
  id: '1',
  name: 'React 마스터즈',
  slug: 'react-masters',
  description: 'React와 Next.js를 깊이 있게 공부하는 소규모 스터디 그룹입니다.',
  avatar_url: null,
  is_public: false,
  is_default: false,
  member_count: 5,
  max_members: 10,
  owner_id: '1',
  created_at: '2025-01-15T10:00:00Z',
  settings: {
    enable_chat: true,
    enable_memos: true,
    enable_files: true
  }
}

// 임시 멤버 데이터
const members = [
  { id: '1', username: 'devmaster', role: 'owner', joined_at: '2025-01-15T10:00:00Z', is_online: true },
  { id: '2', username: 'react_lover', role: 'member', joined_at: '2025-01-15T14:00:00Z', is_online: true },
  { id: '3', username: 'frontend_dev', role: 'member', joined_at: '2025-01-16T09:00:00Z', is_online: false },
  { id: '4', username: 'ui_designer', role: 'member', joined_at: '2025-01-17T11:30:00Z', is_online: true },
  { id: '5', username: 'junior_dev', role: 'member', joined_at: '2025-01-18T15:00:00Z', is_online: false }
]

// 임시 채팅 메시지
const messages = [
  { id: '1', user_id: '1', username: 'devmaster', content: '안녕하세요! React 스터디 커뮤니티에 오신 걸 환영합니다 👋', created_at: '2025-01-20T10:00:00Z' },
  { id: '2', user_id: '2', username: 'react_lover', content: '반갑습니다! 이번 주는 어떤 주제로 스터디하나요?', created_at: '2025-01-20T10:05:00Z' },
  { id: '3', user_id: '1', username: 'devmaster', content: 'Server Components와 Server Actions에 대해 깊이 있게 다뤄볼 예정입니다', created_at: '2025-01-20T10:10:00Z' },
  { id: '4', user_id: '4', username: 'ui_designer', content: '좋네요! 관련 자료 있으면 공유해주세요', created_at: '2025-01-20T10:15:00Z' }
]

// 임시 메모 데이터
const memos = [
  {
    id: '1',
    author_id: '1',
    author: 'devmaster',
    title: 'React Server Components 정리',
    content: `# React Server Components

## 주요 개념
- 서버에서 렌더링되는 React 컴포넌트
- 클라이언트 번들 크기 감소
- 데이터베이스 직접 접근 가능

## 사용 방법
\`\`\`jsx
// app/page.tsx
async function ServerComponent() {
  const data = await db.query('SELECT * FROM posts')
  return <div>{data.map(...)}</div>
}
\`\`\``,
    is_pinned: true,
    tags: ['React', 'RSC', 'Next.js'],
    created_at: '2025-01-18T14:00:00Z'
  },
  {
    id: '2',
    author_id: '2',
    author: 'react_lover',
    title: '스터디 일정 및 진행 방식',
    content: `## 스터디 일정
- 매주 화요일 저녁 8시
- 온라인 (Google Meet)

## 진행 방식
1. 주제 발표 (30분)
2. 코드 리뷰 (30분)
3. Q&A 및 토론 (30분)`,
    is_pinned: false,
    tags: ['스터디', '일정'],
    created_at: '2025-01-17T16:00:00Z'
  }
]

// 임시 파일 데이터
const files = [
  {
    id: '1',
    file_name: 'react-server-components.pdf',
    file_url: '#',
    file_size: 2457600,
    mime_type: 'application/pdf',
    uploaded_by: 'devmaster',
    description: 'React Server Components 공식 문서 번역본',
    download_count: 12,
    created_at: '2025-01-18T15:00:00Z'
  },
  {
    id: '2',
    file_name: 'nextjs-example.zip',
    file_url: '#',
    file_size: 524288,
    mime_type: 'application/zip',
    uploaded_by: 'react_lover',
    description: 'Next.js 14 예제 프로젝트',
    download_count: 8,
    created_at: '2025-01-19T10:00:00Z'
  }
]

// 현재 사용자 (임시)
const currentUser = { id: '1', username: 'devmaster' }
const isOwner = currentUser.id === community.owner_id
const isMember = members.some(m => m.id === currentUser.id)

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('chat')
  const [messageInput, setMessageInput] = useState('')
  const [messagesList, setMessagesList] = useState(messages)
  const [memosList, setMemosList] = useState(memos)
  const [filesList, setFilesList] = useState(files)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Modal states
  const [memoModalOpen, setMemoModalOpen] = useState(false)
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<typeof memos[0] | null>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    try {
      const response = await fetch(`/api/communities/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput })
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessagesList([...messagesList, newMessage])
        setMessageInput('')
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
    }
  }

  const handleMemoSubmit = async (data: {
    title: string
    content: string
    tags: string[]
    is_pinned: boolean
  }) => {
    try {
      const url = selectedMemo 
        ? `/api/communities/${params.id}/memos/${selectedMemo.id}`
        : `/api/communities/${params.id}/memos`
      
      const response = await fetch(url, {
        method: selectedMemo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const savedMemo = await response.json()
        
        if (selectedMemo) {
          setMemosList(memosList.map(m => m.id === savedMemo.id ? savedMemo : m))
        } else {
          setMemosList([savedMemo, ...memosList])
        }
        
        setMemoModalOpen(false)
        setSelectedMemo(null)
      }
    } catch (error) {
      console.error('메모 저장 실패:', error)
    }
  }

  const handleMemoDelete = async (memoId: string) => {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/communities/${params.id}/memos/${memoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMemosList(memosList.filter(m => m.id !== memoId))
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error)
    }
  }

  const handleFileUpload = async (file: File, description: string) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', description)

      const response = await fetch(`/api/communities/${params.id}/files`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const uploadedFile = await response.json()
        setFilesList([uploadedFile, ...filesList])
        setFileUploadModalOpen(false)
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error)
    }
  }

  const handleFileDownload = async (fileId: string) => {
    window.open(`/api/communities/${params.id}/files/${fileId}/download`, '_blank')
  }

  const handleLeave = () => {
    if (confirm('정말로 이 커뮤니티를 나가시겠습니까?')) {
      router.push('/communities')
    }
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/communities">
                <ArrowLeft className="mr-2 h-4 w-4" />
                커뮤니티 목록
              </Link>
            </Button>
          </div>
          
          {isMember && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      커뮤니티 설정
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      멤버 초대
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLeave} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  커뮤니티 나가기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 커뮤니티 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={community.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {community.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{community.name}</CardTitle>
                <CardDescription className="mt-1">{community.description}</CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {community.member_count}/{community.max_members}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(community.created_at).toLocaleDateString('ko-KR')} 생성
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 메인 콘텐츠 */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* 좌측 사이드바 - 멤버 목록 */}
        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>멤버 ({members.length})</span>
                {isOwner && (
                  <Button size="sm" variant="ghost">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.is_online && (
                          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.username}
                          {member.role === 'owner' && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              방장
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.is_online ? '온라인' : '오프라인'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" disabled={!community.settings.enable_chat}>
                <MessageCircle className="mr-2 h-4 w-4" />
                채팅
              </TabsTrigger>
              <TabsTrigger value="memos" disabled={!community.settings.enable_memos}>
                <FileText className="mr-2 h-4 w-4" />
                메모
              </TabsTrigger>
              <TabsTrigger value="files" disabled={!community.settings.enable_files}>
                <File className="mr-2 h-4 w-4" />
                파일
              </TabsTrigger>
            </TabsList>

            {/* 채팅 탭 */}
            <TabsContent value="chat" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] p-4">
                    <div className="space-y-4">
                      {messagesList.map((message) => {
                        const isCurrentUser = message.user_id === currentUser.id
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {message.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{message.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleTimeString('ko-KR')}
                                </span>
                              </div>
                              <div className={`inline-block rounded-lg px-3 py-2 text-sm ${
                                isCurrentUser 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                {message.content}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <form onSubmit={handleSendMessage} className="p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="메시지를 입력하세요..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 메모 탭 */}
            <TabsContent value="memos" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="메모 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => setMemoModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    메모 작성
                  </Button>
                </div>

                <div className="space-y-4">
                  {memosList.filter(memo => 
                    memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    memo.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    memo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map((memo) => (
                    <Card key={memo.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {memo.title}
                              {memo.is_pinned && <Pin className="h-4 w-4" />}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>{memo.author}</span>
                              <span>·</span>
                              <span>{new Date(memo.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedMemo(memo)
                                setMemoModalOpen(true)
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleMemoDelete(memo.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <p className="line-clamp-3">{memo.content}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {memo.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 파일 탭 */}
            <TabsContent value="files" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="파일 검색..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => setFileUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    파일 업로드
                  </Button>
                </div>

                <div className="grid gap-4">
                  {filesList.filter(file =>
                    file.file_name.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
                    file.description.toLowerCase().includes(fileSearchQuery.toLowerCase())
                  ).map((file) => (
                    <Card key={file.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <File className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{file.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>·</span>
                              <span>{file.uploaded_by}</span>
                              <span>·</span>
                              <span>{new Date(file.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {file.download_count}회 다운로드
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleFileDownload(file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 메모 모달 */}
      <MemoModal
        open={memoModalOpen}
        onOpenChange={(open) => {
          setMemoModalOpen(open)
          if (!open) setSelectedMemo(null)
        }}
        memo={selectedMemo || undefined}
        onSubmit={handleMemoSubmit}
      />

      {/* 파일 업로드 모달 */}
      <FileUploadModal
        open={fileUploadModalOpen}
        onOpenChange={setFileUploadModalOpen}
        onUpload={handleFileUpload}
      />
    </div>
  )
}
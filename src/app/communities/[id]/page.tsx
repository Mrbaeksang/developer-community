'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { OptimizedAvatar } from '@/components/ui/optimized-image'
import { 
  useCommunity, 
  useCommunityMessages, 
  useCommunityMemos, 
  useCommunityFiles,
  useSendMessage,
  useCreateMemo,
  useUpdateMemo,
  useDeleteMemo,
  useUploadFile,
  useCurrentUser
} from '@/hooks/use-api'
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
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle
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

// TypeScript 인터페이스
interface Community {
  id: string
  name: string
  slug: string
  description: string
  avatar_url?: string
  is_public: boolean
  is_default: boolean
  member_count: number
  max_members?: number
  owner_id: string
  created_at: string
  settings: {
    enable_chat: boolean
    enable_memos: boolean
    enable_files: boolean
  }
  is_member: boolean
  user_role: string | null
  members: Member[]
  owner: {
    id: string
    username: string
    display_name: string
    avatar_url: string
  }
}

interface Member {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  role: string
  joined_at: string
  is_online: boolean
  is_current_user?: boolean
}

interface Message {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

interface Memo {
  id: string
  author_id: string
  author: string
  title: string
  content: string
  is_pinned: boolean
  tags: string[]
  created_at: string
  updated_at?: string
}

interface FileItem {
  id: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploaded_by_id: string
  description: string
  download_count: number
  created_at: string
}

interface CurrentUser {
  id: string
  username: string
}

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  // State 관리
  const [activeTab, setActiveTab] = useState('chat')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  
  // Modal states
  const [memoModalOpen, setMemoModalOpen] = useState(false)
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)

  // React Query 훅들 사용
  const { data: currentUser } = useCurrentUser()
  const { 
    data: community, 
    isLoading: communityLoading, 
    error: communityError,
    refetch: refetchCommunity
  } = useCommunity(id)
  
  const { 
    data: messagesList = [], 
    isLoading: messagesLoading 
  } = useCommunityMessages(id)
  
  const { 
    data: memosList = [], 
    isLoading: memosLoading 
  } = useCommunityMemos(id)
  
  const { 
    data: filesList = [], 
    isLoading: filesLoading 
  } = useCommunityFiles(id)

  // Mutations
  const sendMessageMutation = useSendMessage()
  const createMemoMutation = useCreateMemo()
  const updateMemoMutation = useUpdateMemo()
  const deleteMemoMutation = useDeleteMemo()
  const uploadFileMutation = useUploadFile()

  const isLoading = communityLoading
  const error = communityError ? (communityError instanceof Error ? communityError.message : '알 수 없는 오류가 발생했습니다') : null


  // 로딩 상태
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">커뮤니티 정보를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || (!isLoading && !community)) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">커뮤니티를 불러올 수 없습니다</h2>
          <p className="text-destructive mb-4">{error || '커뮤니티를 찾을 수 없습니다'}</p>
          <div className="space-x-2">
            <Button onClick={() => refetchCommunity()}>
              다시 시도
            </Button>
            <Button variant="outline" asChild>
              <Link href="/communities">커뮤니티 목록</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 사용자 권한 확인
  const isOwner = currentUser?.id === community?.owner_id
  const isMember = community?.is_member || false
  
  // 실제 멤버 데이터 사용
  const communityMembers = community?.members || []

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendMessageMutation.isPending) return

    try {
      await sendMessageMutation.mutateAsync({
        communityId: id,
        content: messageInput
      })
      setMessageInput('')
    } catch (error) {
      // 메시지 전송 실패 처리
      alert('메시지 전송에 실패했습니다')
    }
  }

  const handleMemoSubmit = async (data: {
    title: string
    content: string
    tags: string[]
    is_pinned: boolean
  }) => {
    try {
      if (selectedMemo) {
        await updateMemoMutation.mutateAsync({
          communityId: id,
          memoId: selectedMemo.id,
          data
        })
      } else {
        await createMemoMutation.mutateAsync({
          communityId: id,
          data
        })
      }
      
      setMemoModalOpen(false)
      setSelectedMemo(null)
    } catch (error) {
      // 메모 저장 실패 처리
      alert('메모 저장에 실패했습니다')
    }
  }

  const handleMemoDelete = async (memoId: string) => {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) return

    try {
      await deleteMemoMutation.mutateAsync({
        communityId: id,
        memoId
      })
    } catch (error) {
      // 메모 삭제 실패 처리
      alert('멤모 삭제에 실패했습니다')
    }
  }

  const handleFileUpload = async (file: File, description: string) => {
    try {
      await uploadFileMutation.mutateAsync({
        communityId: id,
        file,
        description
      })
      setFileUploadModalOpen(false)
    } catch (error) {
      // 파일 업로드 실패 처리
      alert('파일 업로드에 실패했습니다')
    }
  }

  const handleFileDownload = async (fileId: string) => {
    window.open(`/api/communities/${id}/files/${fileId}/download`, '_blank')
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
                <AvatarImage src={community?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {community?.name?.slice(0, 2).toUpperCase() || 'CO'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{community?.name}</CardTitle>
                <CardDescription className="mt-1">{community?.description}</CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {community?.member_count}/{community?.max_members}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {community?.created_at && new Date(community.created_at).toLocaleDateString('ko-KR')} 생성
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
                <span>멤버 ({communityMembers.length})</span>
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
                  {communityMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || undefined} />
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
                          {member.display_name || member.username}
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
              <TabsTrigger value="chat" disabled={!community?.settings?.enable_chat}>
                <MessageCircle className="mr-2 h-4 w-4" />
                채팅
              </TabsTrigger>
              <TabsTrigger value="memos" disabled={!community?.settings?.enable_memos}>
                <FileText className="mr-2 h-4 w-4" />
                메모
              </TabsTrigger>
              <TabsTrigger value="files" disabled={!community?.settings?.enable_files}>
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
                        const isCurrentUser = message.user_id === currentUser?.id
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
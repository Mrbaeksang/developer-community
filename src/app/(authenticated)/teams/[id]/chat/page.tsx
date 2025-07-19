'use client'

import { useState, useRef, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Send, 
  Users, 
  Circle,
  MoreVertical,
  Pin,
  Search,
  Paperclip,
  Smile
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/format'

// 임시 채팅 데이터
const initialMessages = [
  {
    id: '1',
    userId: '1',
    userName: '김개발',
    avatar: '/api/placeholder/32/32',
    content: '안녕하세요! 이번 프로젝트 어떻게 진행할까요?',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isMe: false
  },
  {
    id: '2',
    userId: '2',
    userName: '이백엔드',
    avatar: '/api/placeholder/32/32',
    content: '저는 API 설계부터 시작하면 좋을 것 같아요.',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isMe: false
  },
  {
    id: '3',
    userId: 'me',
    userName: '나',
    avatar: '/api/placeholder/32/32',
    content: '좋은 생각이네요! 먼저 요구사항 정리부터 해볼까요?',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    isMe: true
  },
  {
    id: '4',
    userId: '3',
    userName: '박풀스택',
    avatar: '/api/placeholder/32/32',
    content: '네, 저도 동의합니다. 노션에 정리해놓을게요!',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isMe: false
  }
]

const teamMembers = [
  { id: '1', name: '김개발', status: 'online', avatar: '/api/placeholder/32/32' },
  { id: '2', name: '이백엔드', status: 'online', avatar: '/api/placeholder/32/32' },
  { id: '3', name: '박풀스택', status: 'away', avatar: '/api/placeholder/32/32' },
  { id: '4', name: '최데브옵스', status: 'offline', avatar: '/api/placeholder/32/32' }
]

export default function TeamChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [showMembers, setShowMembers] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      id: String(messages.length + 1),
      userId: 'me',
      userName: '나',
      avatar: '/api/placeholder/32/32',
      content: newMessage,
      createdAt: new Date().toISOString(),
      isMe: true
    }

    setMessages([...messages, message])
    setNewMessage('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      <div className="flex-1 flex flex-col">
        {/* 채팅 헤더 */}
        <div className="border-b p-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/teams/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                팀 대시보드
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">팀 알파 채팅방</h1>
              <p className="text-sm text-muted-foreground">4명 온라인</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Pin className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMembers(!showMembers)}
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 날짜 구분선 */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">오늘</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 메시지 목록 */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isMe ? 'flex-row-reverse' : ''}`}
            >
              <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
              <div className={`flex flex-col ${message.isMe ? 'items-end' : ''} max-w-[70%]`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{message.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(message.createdAt)}
                  </span>
                </div>
                <div className={`rounded-lg px-4 py-2 ${
                  message.isMe 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* 팀 멤버 사이드바 */}
      {showMembers && (
        <div className="w-64 border-l bg-muted/50">
          <div className="p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              팀 멤버
            </h2>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <Circle 
                      className={`absolute bottom-0 right-0 h-3 w-3 ${getStatusColor(member.status)} rounded-full border-2 border-background`}
                      fill="currentColor"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.status === 'online' ? '온라인' : 
                       member.status === 'away' ? '자리 비움' : '오프라인'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 팀 메모 */}
          <div className="border-t p-4">
            <h3 className="font-semibold mb-3 flex items-center justify-between">
              고정된 메모
              <Badge variant="secondary" className="text-xs">3</Badge>
            </h3>
            <div className="space-y-2">
              <Card className="cursor-pointer hover:bg-accent">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-1">프로젝트 일정</p>
                  <p className="text-xs text-muted-foreground">
                    1/20 - 요구사항 정리<br />
                    1/25 - 1차 개발 완료
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-accent">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-1">API 문서</p>
                  <p className="text-xs text-muted-foreground">
                    https://docs.api.com/v1
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
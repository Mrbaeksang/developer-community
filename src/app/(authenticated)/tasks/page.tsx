'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Calendar,
  User,
  AlertCircle,
  Circle,
  ArrowUpCircle,
  GripVertical
} from 'lucide-react'

// 칸반 보드 컬럼
const columns = [
  { id: 'todo', title: '할 일', color: 'bg-gray-500' },
  { id: 'in-progress', title: '진행 중', color: 'bg-blue-500' },
  { id: 'review', title: '검토', color: 'bg-yellow-500' },
  { id: 'done', title: '완료', color: 'bg-green-500' }
]

// 우선순위 설정
const priorities = {
  urgent: { label: '긴급', icon: AlertCircle, color: 'text-red-500' },
  high: { label: '높음', icon: ArrowUpCircle, color: 'text-orange-500' },
  medium: { label: '보통', icon: Circle, color: 'text-blue-500' },
  low: { label: '낮음', icon: Circle, color: 'text-gray-500' }
}

// 임시 태스크 데이터
const initialTasks = {
  'todo': [
    {
      id: '1',
      title: 'API 문서 작성',
      description: 'REST API 엔드포인트 문서화',
      priority: 'high',
      assignee: '김개발',
      dueDate: '2025-01-25',
      tags: ['문서', 'API']
    },
    {
      id: '2',
      title: '버그 수정: 로그인 오류',
      description: '특정 조건에서 로그인이 안되는 문제',
      priority: 'urgent',
      assignee: '이백엔드',
      dueDate: '2025-01-20',
      tags: ['버그', '인증']
    }
  ],
  'in-progress': [
    {
      id: '3',
      title: '대시보드 UI 개발',
      description: '관리자 대시보드 차트 구현',
      priority: 'medium',
      assignee: '박풀스택',
      dueDate: '2025-01-22',
      tags: ['프론트엔드', 'UI']
    }
  ],
  'review': [
    {
      id: '4',
      title: '데이터베이스 스키마 설계',
      description: '프로젝트 DB 구조 설계 및 검토',
      priority: 'high',
      assignee: '최데브옵스',
      dueDate: '2025-01-21',
      tags: ['DB', '설계']
    }
  ],
  'done': [
    {
      id: '5',
      title: '프로젝트 초기 설정',
      description: 'Next.js 프로젝트 세팅',
      priority: 'low',
      assignee: '김개발',
      dueDate: '2025-01-18',
      tags: ['설정']
    }
  ]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedTask, setDraggedTask] = useState<{
    task: typeof initialTasks.todo[0],
    fromColumn: string
  } | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, task: typeof initialTasks.todo[0], columnId: string) => {
    setDraggedTask({ task, fromColumn: columnId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (columnId: string) => {
    setDraggedOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault()
    
    if (draggedTask && draggedTask.fromColumn !== toColumnId) {
      const newTasks = { ...tasks }
      
      // 원래 컬럼에서 태스크 제거
      newTasks[draggedTask.fromColumn as keyof typeof tasks] = 
        newTasks[draggedTask.fromColumn as keyof typeof tasks].filter(
          t => t.id !== draggedTask.task.id
        )
      
      // 새 컬럼에 태스크 추가
      newTasks[toColumnId as keyof typeof tasks] = [
        ...newTasks[toColumnId as keyof typeof tasks],
        draggedTask.task
      ]
      
      setTasks(newTasks)
    }
    
    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  const getPriorityIcon = (priority: keyof typeof priorities) => {
    const Icon = priorities[priority].icon
    return <Icon className={`h-4 w-4 ${priorities[priority].color}`} />
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="h-full">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">태스크 보드</h1>
            <p className="text-muted-foreground mt-1">
              팀의 모든 작업을 한눈에 관리하세요
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 태스크
          </Button>
        </div>

        {/* 필터 바 */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="태스크 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            필터
          </Button>
          <Button variant="outline" size="sm">
            <User className="mr-2 h-4 w-4" />
            내 태스크
          </Button>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-16rem)]">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`bg-muted/50 rounded-lg p-4 ${
              draggedOverColumn === column.id ? 'ring-2 ring-primary' : ''
            }`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* 컬럼 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {tasks[column.id as keyof typeof tasks].length}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 태스크 목록 */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100%-3rem)]">
              {tasks[column.id as keyof typeof tasks].map((task) => (
                <Card
                  key={task.id}
                  className="cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, column.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {getPriorityIcon(task.priority as keyof typeof priorities)}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-medium">
                      {task.title}
                    </CardTitle>
                    {task.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {task.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* 태그 */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignee}</span>
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${
                          isOverdue(task.dueDate) ? 'text-red-500' : ''
                        }`}>
                          <Calendar className="h-3 w-3" />
                          <span>{task.dueDate}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
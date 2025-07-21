'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { TechStack } from './tech-badge'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { 
  ExternalLink, 
  Github, 
  Star, 
  GitFork, 
  Eye,
  Calendar,
  Users,
  Play,
  Code,
  FileText,
  Heart,
  Share2,
  MoreVertical,
  Bookmark,
  Download
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { cn } from '@/lib/utils/cn'

interface ProjectShowcase {
  id: string
  title: string
  description: string
  longDescription?: string
  thumbnailUrl?: string
  screenshots: string[]
  
  // 링크
  githubUrl?: string
  demoUrl?: string
  documentationUrl?: string
  
  // 기술 정보
  techStack: string[]
  category: 'web' | 'mobile' | 'desktop' | 'api' | 'library' | 'tool' | 'game' | 'other'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  license?: string
  
  // 작성자 정보
  author: {
    id: string
    username: string
    displayName?: string
    avatar_url?: string
  }
  
  // 협업자 (있는 경우)
  collaborators?: Array<{
    id: string
    username: string
    avatar_url?: string
    role?: string
  }>
  
  // 통계
  stats: {
    viewCount: number
    likeCount: number
    forkCount: number
    downloadCount: number
    starCount: number
  }
  
  // GitHub 연동 정보 (선택)
  github?: {
    stars: number
    forks: number
    openIssues: number
    lastUpdated: string
    language: string
  }
  
  // 메타데이터
  isPublic: boolean
  isFeatured: boolean
  isOpenSource: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface ProjectShowcaseCardProps {
  project: ProjectShowcase
  variant?: 'compact' | 'full' | 'grid'
  showStats?: boolean
  showAuthor?: boolean
  showDescription?: boolean
  className?: string
}

export function ProjectShowcaseCard({
  project,
  variant = 'grid',
  showStats = true,
  showAuthor = true,
  showDescription = true,
  className
}: ProjectShowcaseCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const categoryConfig = {
    web: { label: '웹 앱', color: 'hsl(204 70% 53%)', icon: '🌐' },
    mobile: { label: '모바일 앱', color: 'hsl(142 76% 36%)', icon: '📱' },
    desktop: { label: '데스크톱 앱', color: 'hsl(269 79% 61%)', icon: '💻' },
    api: { label: 'API', color: 'hsl(25 95% 53%)', icon: '🔌' },
    library: { label: '라이브러리', color: 'hsl(193 95% 68%)', icon: '📚' },
    tool: { label: '도구', color: 'hsl(51 100% 50%)', icon: '🔧' },
    game: { label: '게임', color: 'hsl(348 100% 61%)', icon: '🎮' },
    other: { label: '기타', color: 'hsl(210 11% 15%)', icon: '📦' }
  }

  const difficultyConfig = {
    beginner: { label: '초급', color: 'hsl(142 76% 36%)', icon: '🟢' },
    intermediate: { label: '중급', color: 'hsl(25 95% 53%)', icon: '🟡' },
    advanced: { label: '고급', color: 'hsl(348 100% 61%)', icon: '🔴' }
  }

  const category = categoryConfig[project.category]
  const difficulty = difficultyConfig[project.difficulty]

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors', className)}>
        {project.thumbnailUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={project.thumbnailUrl}
              alt={project.title}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{project.title}</h4>
            <Badge variant="secondary" className="text-xs">
              {category.icon} {category.label}
            </Badge>
            {project.isFeatured && (
              <Badge variant="default" className="text-xs">
                ⭐ 추천
              </Badge>
            )}
          </div>
          
          {showDescription && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {project.description}
            </p>
          )}
          
          <TechStack 
            technologies={project.techStack} 
            maxDisplay={4} 
            size="sm"
          />
        </div>

        {showStats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {project.stats.starCount}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {project.stats.viewCount}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn('group hover:shadow-md transition-all duration-200', className)}>
      <CardHeader className="pb-3">
        {/* 프로젝트 이미지 */}
        {project.thumbnailUrl && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-muted mb-4">
            <Image
              src={project.thumbnailUrl}
              alt={project.title}
              width={400}
              height={200}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        {/* 헤더 정보 */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.icon} {category.label}
              </Badge>
              <Badge 
                variant="outline"
                style={{ borderColor: difficulty.color, color: difficulty.color }}
              >
                {difficulty.icon} {difficulty.label}
              </Badge>
              {project.isFeatured && (
                <Badge variant="default">⭐ 추천</Badge>
              )}
              {project.isOpenSource && (
                <Badge variant="secondary">🔓 오픈소스</Badge>
              )}
            </div>
            
            <CardTitle className="text-xl mb-1">{project.title}</CardTitle>
            
            {showDescription && (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsBookmarked(!isBookmarked)}>
                <Bookmark className="mr-2 h-4 w-4" />
                {isBookmarked ? '북마크 해제' : '북마크'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                공유하기
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                신고하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 작성자 정보 */}
        {showAuthor && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.author.avatar_url} />
                <AvatarFallback className="text-xs">
                  {project.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {project.author.displayName || project.author.username}
              </span>
              
              {/* 협업자 표시 */}
              {project.collaborators && project.collaborators.length > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    +{project.collaborators.length}
                  </span>
                </div>
              )}
            </div>
            
            <span className="text-xs text-muted-foreground">
              {new Date(project.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* 기술 스택 */}
        <div className="mb-4">
          <TechStack technologies={project.techStack} maxDisplay={6} />
        </div>

        {/* 태그 */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {project.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* GitHub 정보 */}
        {project.github && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {project.github.stars}
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              {project.github.forks}
            </div>
            <div className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              {project.github.language}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {project.demoUrl && (
            <Button size="sm" asChild>
              <Link href={project.demoUrl} target="_blank">
                <Play className="mr-2 h-3 w-3" />
                데모
              </Link>
            </Button>
          )}
          
          {project.githubUrl && (
            <Button variant="outline" size="sm" asChild>
              <Link href={project.githubUrl} target="_blank">
                <Github className="mr-2 h-3 w-3" />
                코드
              </Link>
            </Button>
          )}
        </div>

        {/* 통계 및 액션 */}
        {showStats && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors hover:text-foreground",
                isLiked ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              {project.stats.likeCount + (isLiked ? 1 : 0)}
            </button>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {project.stats.viewCount}
            </div>
            
            {project.stats.downloadCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                {project.stats.downloadCount}
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
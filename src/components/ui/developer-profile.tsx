'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { TechStack } from './tech-badge'
import { Card, CardContent, CardHeader } from './card'
import { Button } from './button'
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Globe, 
  MapPin, 
  Calendar,
  Star,
  GitFork,
  Code,
  Users,
  Award,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DeveloperProfile {
  id: string
  username: string
  displayName?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  githubUsername?: string
  twitterUsername?: string
  linkedinUrl?: string
  joinedAt: string
  
  // 개발자 특화 정보
  techStack: string[]
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead'
  primaryRole: string // e.g., "Frontend Developer", "Full Stack Engineer"
  
  // 활동 지표
  stats: {
    postsCount: number
    communitiesCount: number
    contributionsCount: number
    followersCount: number
    reputationScore: number
  }
  
  // GitHub 연동 정보 (선택)
  github?: {
    publicRepos: number
    followers: number
    totalStars: number
    contributionsThisYear: number
  }
  
  // 뱃지 및 성취
  badges: ProfileBadge[]
}

interface ProfileBadge {
  id: string
  name: string
  icon: string
  description: string
  earnedAt: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface DeveloperProfileCardProps {
  profile: DeveloperProfile
  variant?: 'compact' | 'full'
  showStats?: boolean
  showTechStack?: boolean
  showBadges?: boolean
  className?: string
}

export function DeveloperProfileCard({
  profile,
  variant = 'compact',
  showStats = true,
  showTechStack = true,
  showBadges = true,
  className
}: DeveloperProfileCardProps) {
  const experienceLevels = {
    junior: { label: '주니어', color: 'hsl(142 76% 36%)', icon: '🌱' },
    mid: { label: '미드레벨', color: 'hsl(204 70% 53%)', icon: '🌿' },
    senior: { label: '시니어', color: 'hsl(269 79% 61%)', icon: '🌳' },
    lead: { label: '리드', color: 'hsl(25 95% 53%)', icon: '🏆' }
  }

  const experience = experienceLevels[profile.experienceLevel]

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg border bg-card', className)}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">
              {profile.displayName || profile.username}
            </h4>
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: `${experience.color}20`, color: experience.color }}
            >
              {experience.icon} {experience.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {profile.primaryRole}
          </p>
          {showTechStack && profile.techStack.length > 0 && (
            <TechStack 
              technologies={profile.techStack} 
              maxDisplay={3} 
              size="sm"
              className="mt-1"
            />
          )}
        </div>

        {showStats && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {profile.stats.reputationScore}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-xl">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold truncate">
                {profile.displayName || profile.username}
              </h3>
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${experience.color}20`, color: experience.color }}
              >
                {experience.icon} {experience.label}
              </Badge>
            </div>
            
            <p className="text-muted-foreground mb-2">@{profile.username}</p>
            <p className="text-base font-medium text-primary mb-2">{profile.primaryRole}</p>
            
            {profile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(profile.joinedAt).getFullYear()}년 가입
              </div>
            </div>
          </div>
        </div>
        
        {/* 소셜 링크 */}
        <div className="flex items-center gap-2 mt-4">
          {profile.githubUsername && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`https://github.com/${profile.githubUsername}`} target="_blank">
                <Github className="h-4 w-4 mr-1" />
                GitHub
              </Link>
            </Button>
          )}
          {profile.website && (
            <Button variant="outline" size="sm" asChild>
              <Link href={profile.website} target="_blank">
                <Globe className="h-4 w-4 mr-1" />
                웹사이트
              </Link>
            </Button>
          )}
          {profile.twitterUsername && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`https://twitter.com/${profile.twitterUsername}`} target="_blank">
                <Twitter className="h-4 w-4 mr-1" />
                Twitter
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 기술 스택 */}
        {showTechStack && profile.techStack.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Code className="h-4 w-4" />
              기술 스택
            </h4>
            <TechStack technologies={profile.techStack} maxDisplay={8} />
          </div>
        )}

        {/* 통계 */}
        {showStats && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
              <Zap className="h-4 w-4" />
              활동 현황
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">게시글</span>
                  <span className="font-medium">{profile.stats.postsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">커뮤니티</span>
                  <span className="font-medium">{profile.stats.communitiesCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">팔로워</span>
                  <span className="font-medium">{profile.stats.followersCount}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">기여도</span>
                  <span className="font-medium">{profile.stats.contributionsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">평판</span>
                  <span className="font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {profile.stats.reputationScore}
                  </span>
                </div>
                {profile.github && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">GitHub ⭐</span>
                    <span className="font-medium">{profile.github.totalStars}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 뱃지 */}
        {showBadges && profile.badges.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Award className="h-4 w-4" />
              성취 뱃지
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.badges.slice(0, 6).map((badge) => {
                const rarityColors = {
                  common: 'hsl(210 11% 15%)',
                  rare: 'hsl(204 70% 53%)',
                  epic: 'hsl(269 79% 61%)',
                  legendary: 'hsl(25 95% 53%)'
                }
                
                return (
                  <Badge 
                    key={badge.id}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: rarityColors[badge.rarity] }}
                    title={badge.description}
                  >
                    {badge.icon} {badge.name}
                  </Badge>
                )
              })}
              {profile.badges.length > 6 && (
                <Badge variant="secondary" className="text-xs">
                  +{profile.badges.length - 6}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
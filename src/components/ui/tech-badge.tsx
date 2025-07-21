'use client'

import { Badge } from './badge'
import { cn } from '@/lib/utils/cn'

interface TechBadgeProps {
  tech: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
}

// 기술 스택별 색상 및 아이콘 매핑
const techStyles: Record<string, { color: string; bgColor: string; icon?: string }> = {
  // Frontend
  react: { color: 'hsl(193 95% 68%)', bgColor: 'hsl(193 95% 68% / 0.1)', icon: '⚛️' },
  vue: { color: 'hsl(153 47% 49%)', bgColor: 'hsl(153 47% 49% / 0.1)', icon: '💚' },
  angular: { color: 'hsl(348 100% 61%)', bgColor: 'hsl(348 100% 61% / 0.1)', icon: '🅰️' },
  svelte: { color: 'hsl(15 100% 50%)', bgColor: 'hsl(15 100% 50% / 0.1)', icon: '🧡' },
  nextjs: { color: 'hsl(210 11% 15%)', bgColor: 'hsl(210 11% 15% / 0.1)', icon: '▲' },
  nuxtjs: { color: 'hsl(142 76% 36%)', bgColor: 'hsl(142 76% 36% / 0.1)', icon: '💚' },
  
  // Backend
  nodejs: { color: 'hsl(92 38% 49%)', bgColor: 'hsl(92 38% 49% / 0.1)', icon: '🟢' },
  python: { color: 'hsl(204 70% 53%)', bgColor: 'hsl(204 70% 53% / 0.1)', icon: '🐍' },
  java: { color: 'hsl(25 95% 53%)', bgColor: 'hsl(25 95% 53% / 0.1)', icon: '☕' },
  go: { color: 'hsl(193 95% 68%)', bgColor: 'hsl(193 95% 68% / 0.1)', icon: '🐹' },
  rust: { color: 'hsl(17 100% 41%)', bgColor: 'hsl(17 100% 41% / 0.1)', icon: '🦀' },
  php: { color: 'hsl(225 73% 57%)', bgColor: 'hsl(225 73% 57% / 0.1)', icon: '🐘' },
  ruby: { color: 'hsl(348 83% 47%)', bgColor: 'hsl(348 83% 47% / 0.1)', icon: '💎' },
  
  // Mobile
  'react-native': { color: 'hsl(193 95% 68%)', bgColor: 'hsl(193 95% 68% / 0.1)', icon: '📱' },
  flutter: { color: 'hsl(201 100% 50%)', bgColor: 'hsl(201 100% 50% / 0.1)', icon: '🐦' },
  swift: { color: 'hsl(25 95% 53%)', bgColor: 'hsl(25 95% 53% / 0.1)', icon: '🦉' },
  kotlin: { color: 'hsl(269 79% 61%)', bgColor: 'hsl(269 79% 61% / 0.1)', icon: '🟣' },
  
  // Database
  mysql: { color: 'hsl(25 95% 53%)', bgColor: 'hsl(25 95% 53% / 0.1)', icon: '🗄️' },
  postgresql: { color: 'hsl(204 70% 53%)', bgColor: 'hsl(204 70% 53% / 0.1)', icon: '🐘' },
  mongodb: { color: 'hsl(92 38% 49%)', bgColor: 'hsl(92 38% 49% / 0.1)', icon: '🍃' },
  redis: { color: 'hsl(348 100% 61%)', bgColor: 'hsl(348 100% 61% / 0.1)', icon: '📋' },
  supabase: { color: 'hsl(142 76% 36%)', bgColor: 'hsl(142 76% 36% / 0.1)', icon: '⚡' },
  
  // DevOps & Tools
  docker: { color: 'hsl(201 100% 50%)', bgColor: 'hsl(201 100% 50% / 0.1)', icon: '🐳' },
  kubernetes: { color: 'hsl(225 73% 57%)', bgColor: 'hsl(225 73% 57% / 0.1)', icon: '☸️' },
  aws: { color: 'hsl(25 95% 53%)', bgColor: 'hsl(25 95% 53% / 0.1)', icon: '☁️' },
  vercel: { color: 'hsl(210 11% 15%)', bgColor: 'hsl(210 11% 15% / 0.1)', icon: '▲' },
  netlify: { color: 'hsl(193 95% 68%)', bgColor: 'hsl(193 95% 68% / 0.1)', icon: '🌐' },
  
  // Languages
  javascript: { color: 'hsl(51 100% 50%)', bgColor: 'hsl(51 100% 50% / 0.1)', icon: '🟨' },
  typescript: { color: 'hsl(204 70% 53%)', bgColor: 'hsl(204 70% 53% / 0.1)', icon: '🔷' },
  html: { color: 'hsl(12 76% 61%)', bgColor: 'hsl(12 76% 61% / 0.1)', icon: '📄' },
  css: { color: 'hsl(225 73% 57%)', bgColor: 'hsl(225 73% 57% / 0.1)', icon: '🎨' },
  
  // Default
  default: { color: 'hsl(210 11% 15%)', bgColor: 'hsl(210 11% 15% / 0.1)', icon: '🏷️' }
}

export function TechBadge({ 
  tech, 
  variant = 'default', 
  size = 'default', 
  showIcon = true,
  className 
}: TechBadgeProps) {
  const normalizedTech = tech.toLowerCase().replace(/\s+/g, '-')
  const style = techStyles[normalizedTech] || techStyles.default
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  if (variant === 'outline') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'border-current font-medium transition-colors hover:opacity-80',
          sizeClasses[size],
          className
        )}
        style={{ 
          color: style.color,
          borderColor: style.color
        }}
      >
        {showIcon && style.icon && (
          <span className="mr-1" aria-hidden="true">
            {style.icon}
          </span>
        )}
        {tech}
      </Badge>
    )
  }

  return (
    <Badge 
      variant={variant}
      className={cn(
        'font-medium transition-colors hover:opacity-80',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: style.bgColor,
        color: style.color,
        border: `1px solid ${style.color}20`
      }}
    >
      {showIcon && style.icon && (
        <span className="mr-1" aria-hidden="true">
          {style.icon}
        </span>
      )}
      {tech}
    </Badge>
  )
}

// 여러 기술 스택을 표시하는 컴포넌트
interface TechStackProps {
  technologies: string[]
  maxDisplay?: number
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function TechStack({ 
  technologies, 
  maxDisplay = 5, 
  size = 'default',
  variant = 'default',
  className 
}: TechStackProps) {
  const displayTechs = technologies.slice(0, maxDisplay)
  const remainingCount = technologies.length - maxDisplay

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTechs.map((tech, index) => (
        <TechBadge 
          key={`${tech}-${index}`}
          tech={tech} 
          size={size}
          variant={variant}
        />
      ))}
      {remainingCount > 0 && (
        <Badge 
          variant="secondary" 
          className={cn(
            'font-medium text-muted-foreground',
            size === 'sm' && 'text-xs px-2 py-0.5',
            size === 'lg' && 'text-base px-3 py-1.5'
          )}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
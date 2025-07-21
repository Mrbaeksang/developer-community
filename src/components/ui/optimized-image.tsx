'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  quality?: number
  sizes?: string
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc,
  quality = 75,
  sizes,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setIsLoading(true)
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div 
        className={cn(
          'bg-muted animate-pulse flex items-center justify-center',
          className
        )}
        style={{ width, height }}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  // 에러 상태
  if (hasError) {
    return (
      <div 
        className={cn(
          'bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <AlertCircle className="h-8 w-8 mb-2" />
        <span className="text-sm">이미지 로드 실패</span>
      </div>
    )
  }

  const imageProps = {
    src: currentSrc,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    className: cn(className),
    ...(placeholder === 'blur' && blurDataURL && { placeholder, blurDataURL }),
    ...(sizes && { sizes }),
    ...props
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
    />
  )
}

// 아바타 전용 최적화된 이미지 컴포넌트
interface OptimizedAvatarProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackInitial?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className,
  fallbackInitial,
  ...props
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  }

  const sizePx = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  }

  if (!src || hasError) {
    return (
      <div 
        className={cn(
          'rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground',
          sizeClasses[size],
          className
        )}
      >
        {fallbackInitial || alt[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <div className={cn('rounded-full overflow-hidden', sizeClasses[size], className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={sizePx[size]}
        height={sizePx[size]}
        className="rounded-full object-cover"
        onError={() => setHasError(true)}
        quality={90}
        {...props}
      />
    </div>
  )
}

// 게시글 썸네일 전용 컴포넌트
interface PostThumbnailProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function PostThumbnail({
  src,
  alt,
  width = 400,
  height = 225,
  className,
  priority = false
}: PostThumbnailProps) {
  if (!src) {
    return (
      <div 
        className={cn(
          'bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center rounded-lg',
          className
        )}
        style={{ width, height }}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded-lg object-cover', className)}
      priority={priority}
      quality={80}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

// 배경 이미지 컴포넌트
interface BackgroundImageProps {
  src: string
  alt: string
  className?: string
  overlay?: boolean
  overlayOpacity?: number
  children?: React.ReactNode
}

export function BackgroundImage({
  src,
  alt,
  className,
  overlay = false,
  overlayOpacity = 0.5,
  children
}: BackgroundImageProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        quality={60}
        sizes="100vw"
      />
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}
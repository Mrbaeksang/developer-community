import { cn } from '@/lib/utils/cn'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  text?: string
}

export function Loading({ className, size = 'default', text }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className={cn(
        'animate-spin rounded-full border-b-2 border-primary',
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'default',
          'h-12 w-12': size === 'lg',
        }
      )} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loading size="lg" text="로딩 중..." />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-3">
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
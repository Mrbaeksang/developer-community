'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  user?: {
    id: string
    email: string
    username: string
    role?: string
  }
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            Dev Community
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/posts" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith('/posts') && "text-primary"
              )}
            >
              게시글
            </Link>
            
            <Link 
              href="/communities" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith('/communities') && "text-primary"
              )}
            >
              커뮤니티
            </Link>
            
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname.startsWith('/admin') && "text-primary"
                )}
              >
                관리자
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                href="/profile" 
                className="text-sm font-medium hover:text-primary"
              >
                {user.username}
              </Link>
              <form action="/api/auth/logout" method="post">
                <button 
                  type="submit"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className="text-sm font-medium hover:text-primary"
              >
                로그인
              </Link>
              <Link 
                href="/auth/signup" 
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
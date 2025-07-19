'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { 
  Menu,
  X,
  FileText,
  Users,
  RotateCw,
  MessageSquare,
  BarChart3,
  Settings
} from 'lucide-react'

const sidebarItems = [
  {
    title: '대시보드',
    href: '/admin',
    icon: BarChart3
  },
  {
    title: '블로그 관리',
    href: '/admin/blog/posts',
    icon: FileText
  },
  {
    title: '사용자 관리',
    href: '/admin/users',
    icon: Users
  },
  {
    title: '팀 로테이션',
    href: '/admin/teams/rotations',
    icon: RotateCw
  },
  {
    title: '댓글 관리',
    href: '/admin/comments',
    icon: MessageSquare
  },
  {
    title: '설정',
    href: '/admin/settings',
    icon: Settings
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 메뉴 버튼 */}
      <div className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h1 className="font-semibold">관리자 대시보드</h1>
      </div>

      <div className="flex">
        {/* 사이드바 */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-card transition-transform md:translate-x-0 md:static md:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/admin" className="font-semibold text-lg">
                관리자 대시보드
              </Link>
            </div>
            
            <nav className="flex-1 space-y-1 px-3 py-4">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
            
            <div className="border-t p-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                ← 사이트로 돌아가기
              </Link>
            </div>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
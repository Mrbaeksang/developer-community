'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, PenSquare, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BottomNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
}

const bottomNavItems: BottomNavItem[] = [
  { label: '홈', href: '/', icon: Home },
  { label: '지식', href: '/knowledge', icon: BookOpen },
  { label: '작성', href: '/write', icon: PenSquare, accent: true },
  { label: '커뮤니티', href: '/communities', icon: Users },
  { label: '내정보', href: '/profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex justify-around py-2">
        {bottomNavItems.map(item => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center p-2 min-w-0 flex-1",
                isActive && "text-blue-500",
                item.accent && !isActive && "text-gray-700",
                item.accent && isActive && "text-blue-600 font-bold"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                item.accent && "w-6 h-6"
              )} />
              <span className={cn(
                "text-xs mt-1",
                item.accent && "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: 나중에 Supabase에서 사용자 정보 가져오기
  const user = undefined

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
// import { redirect } from 'next/navigation'
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Supabase로 인증 체크
  // const supabase = createClient()
  // const { data: { user } } = await supabase.auth.getUser()
  
  // if (!user) {
  //   redirect('/auth/login')
  // }

  // 임시 사용자 데이터
  const user = {
    id: 'temp-user-id',
    email: 'user@example.com',
    username: 'testuser',
    role: 'user'
  }

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
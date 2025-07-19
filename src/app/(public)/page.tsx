import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowRight, Code2, Users, MessageSquare, CheckSquare } from 'lucide-react'

export default function HomePage() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              개발자를 위한<br />
              <span className="text-primary">커뮤니티 플랫폼</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              AI 뉴스, 기술 트렌드를 확인하고<br />
              부트캠프 팀원들과 효율적으로 협업하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  시작하기 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/blog">블로그 둘러보기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">주요 기능</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Code2 className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>AI 뉴스 & 기술 트렌드</CardTitle>
                <CardDescription>
                  최신 AI 기술과 개발 트렌드를 한눈에
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  관리자가 엄선한 양질의 기술 콘텐츠를 제공합니다
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>팀 로테이션 시스템</CardTitle>
                <CardDescription>
                  2주마다 자동으로 팀 재편성
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  다양한 팀원들과 협업하며 성장하세요
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>실시간 팀 채팅</CardTitle>
                <CardDescription>
                  팀원들과 실시간으로 소통
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  메모 기능으로 중요한 정보를 공유하세요
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckSquare className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>태스크 관리</CardTitle>
                <CardDescription>
                  GitHub Projects 스타일 칸반 보드
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  드래그 앤 드롭으로 쉽게 관리하세요
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">
              지금 바로 시작하세요
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              개발자 커뮤니티에 참여하고 함께 성장하세요
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                무료로 시작하기
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
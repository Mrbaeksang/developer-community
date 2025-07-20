import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowRight, Code2, Users, MessageSquare, CheckSquare, BookOpen, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-background py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              백엔드 부트캠프<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                개발자 커뮤니티
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              80명의 개발자가 함께 성장하는 공간<br />
              팀별 협업과 지식 공유를 통해 더 나은 개발자가 되세요
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Users className="mb-2 h-10 w-10 text-blue-600" />
                <CardTitle>팀 로테이션 시스템</CardTitle>
                <CardDescription>
                  매주 새로운 팀으로 자동 배정
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  다양한 개발자들과 협업하며 네트워크를 확장하고 새로운 관점을 배웁니다
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="mb-2 h-10 w-10 text-green-600" />
                <CardTitle>실시간 팀 채팅</CardTitle>
                <CardDescription>
                  팀원들과 실시간으로 소통
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  프로젝트 진행상황을 공유하고 즉각적인 피드백을 주고받으세요
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="mb-2 h-10 w-10 text-purple-600" />
                <CardTitle>기술 블로그</CardTitle>
                <CardDescription>
                  학습 내용을 정리하고 공유
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI 뉴스부터 개발 팁까지, 양질의 콘텐츠로 함께 성장합니다
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckSquare className="mb-2 h-10 w-10 text-orange-600" />
                <CardTitle>태스크 관리</CardTitle>
                <CardDescription>
                  칸반 보드로 체계적인 업무 관리
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  드래그 앤 드롭으로 직관적으로 프로젝트를 관리하세요
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Code2 className="mb-2 h-10 w-10 text-red-600" />
                <CardTitle>팀 메모</CardTitle>
                <CardDescription>
                  중요한 정보와 코드 공유
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  코드 스니펫, API 문서, 회의록 등을 팀원들과 공유하세요
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-10 w-10 text-yellow-600" />
                <CardTitle>실시간 동기화</CardTitle>
                <CardDescription>
                  모든 변경사항 즉시 반영
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  팀원들의 작업이 실시간으로 동기화되어 원활한 협업이 가능합니다
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">이용 방법</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">회원가입</h3>
                <p className="text-muted-foreground">
                  이메일로 간단하게 가입하고 프로필을 설정하세요
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">팀 배정 대기</h3>
                <p className="text-muted-foreground">
                  관리자가 매주 월요일 새로운 팀으로 자동 배정해드립니다
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">팀 활동 시작</h3>
                <p className="text-muted-foreground">
                  채팅, 태스크 관리, 메모 공유를 통해 팀 프로젝트를 진행하세요
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">지식 공유</h3>
                <p className="text-muted-foreground">
                  학습한 내용을 블로그에 작성하여 커뮤니티와 공유하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">
              지금 바로 시작하세요
            </h2>
            <p className="mb-8 text-xl opacity-90">
              80명의 개발자들이 당신을 기다리고 있습니다
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">
                무료로 시작하기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
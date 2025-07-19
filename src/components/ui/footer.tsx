export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Developer Community</h3>
            <p className="text-sm text-muted-foreground">
              개발자를 위한 AI 뉴스, 기술 트렌드,
              부트캠프 협업 플랫폼
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/blog" className="hover:text-primary">AI 뉴스</a></li>
              <li><a href="/blog?category=tech-trends" className="hover:text-primary">기술 트렌드</a></li>
              <li><a href="/teams" className="hover:text-primary">팀 협업</a></li>
              <li><a href="/tasks" className="hover:text-primary">태스크 관리</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">커뮤니티</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-primary">소개</a></li>
              <li><a href="/guidelines" className="hover:text-primary">커뮤니티 가이드</a></li>
              <li><a href="/contact" className="hover:text-primary">문의하기</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">법적 고지</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/terms" className="hover:text-primary">이용약관</a></li>
              <li><a href="/privacy" className="hover:text-primary">개인정보처리방침</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Developer Community. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
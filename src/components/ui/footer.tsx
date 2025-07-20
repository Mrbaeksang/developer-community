import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Developer Community</h3>
            <p className="text-sm text-muted-foreground">
              개발자들이 지식을 공유하고 함께 성장하는 커뮤니티 플랫폼
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/posts" className="hover:text-primary">포스트</Link></li>
              <li><Link href="/posts?category=tech" className="hover:text-primary">기술 아티클</Link></li>
              <li><Link href="/communities" className="hover:text-primary">커뮤니티</Link></li>
              <li><Link href="/posts/write" className="hover:text-primary">글쓰기</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">커뮤니티</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary">소개</Link></li>
              <li><Link href="/guidelines" className="hover:text-primary">커뮤니티 가이드</Link></li>
              <li><Link href="/contact" className="hover:text-primary">문의하기</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">법적 고지</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">개인정보처리방침</Link></li>
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
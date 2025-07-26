import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, MessageSquare, ArrowLeft } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export default async function BlogCategoryPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await params
  
  // Supabase 클라이언트 생성
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서는 무시
          }
        }
      }
    }
  )
  
  // 카테고리 정보 가져오기
  const { data: categoryInfo, error: categoryError } = await supabase
    .from('categories')
    .select(`
      *,
      board_type:board_types(*)
    `)
    .eq('slug', category)
    .eq('is_active', true)
    .single()
    
  if (categoryError || !categoryInfo) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
        <Button asChild>
          <Link href="/posts">게시글 목록으로 돌아가기</Link>
        </Button>
      </div>
    )
  }
  
  // 해당 카테고리의 게시글 가져오기
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('category_id', categoryInfo.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            전체 게시글
          </Link>
        </Button>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            {categoryInfo.board_type && (
              <Badge variant="outline">
                {categoryInfo.board_type.name}
              </Badge>
            )}
            <h1 className="text-3xl font-bold">{categoryInfo.name}</h1>
          </div>
          {categoryInfo.description && (
            <p className="text-muted-foreground">{categoryInfo.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            총 {posts?.length || 0}개의 게시글
          </p>
        </div>
      </div>

      {/* 게시글 목록 */}
      {posts && posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const displayName = post.author_display_name || post.author_username || '익명'
            
            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: categoryInfo.color ? `${categoryInfo.color}20` : undefined,
                        color: categoryInfo.color || undefined,
                        borderColor: categoryInfo.color || undefined
                      }}
                    >
                      {categoryInfo.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {post.view_count || 0} 조회
                    </span>
                  </div>
                  <CardTitle className="text-xl">
                    <Link href={`/posts/${post.id}`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {displayName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.created_at || '').toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comment_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">아직 게시글이 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              이 카테고리에는 아직 작성된 게시글이 없습니다.
            </p>
            <Button asChild>
              <Link href="/posts">전체 게시글 보기</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
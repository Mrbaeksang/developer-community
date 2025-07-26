import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { faker } from '@faker-js/faker/locale/ko'

// 샘플 데이터 생성 함수들
const generateProfiles = (count: number) => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    username: faker.internet.username().toLowerCase(),
    display_name: faker.person.fullName(),
    avatar_url: faker.image.avatar(),
    bio: faker.lorem.sentence(),
    role: faker.helpers.arrayElement(['user', 'user', 'admin']), // 대부분 user
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    updated_at: new Date().toISOString()
  }))
}

const generateBoardTypes = (count: number) => {
  const boardTypes = [
    { name: '지식공유', slug: 'knowledge', description: '개발 지식을 공유하는 게시판', icon: '📚', requires_approval: true },
    { name: '자유게시판', slug: 'forum', description: '자유롭게 소통하는 공간', icon: '💬', requires_approval: false },
    { name: 'Q&A', slug: 'qna', description: '질문과 답변', icon: '❓', requires_approval: false },
    { name: '프로젝트', slug: 'project', description: '프로젝트 공유', icon: '🚀', requires_approval: true },
    { name: '스터디', slug: 'study', description: '스터디 모집', icon: '📖', requires_approval: false }
  ]
  
  return boardTypes.slice(0, count).map((board, index) => ({
    ...board,
    is_active: true,
    order_index: index + 1
  }))
}

const generateCategories = async (count: number, supabase: any) => {
  // 먼저 board_types를 가져옵니다
  const { data: boardTypes } = await supabase
    .from('board_types')
    .select('id')
    .limit(2)

  if (!boardTypes || boardTypes.length === 0) {
    throw new Error('게시판 타입이 없습니다. 먼저 board_types를 생성해주세요.')
  }

  const categories = [
    { name: 'JavaScript', slug: 'javascript', description: 'JavaScript 관련 포스트', color: '#F7DF1E', icon: '🟨' },
    { name: 'React', slug: 'react', description: 'React 프레임워크', color: '#61DAFB', icon: '⚛️' },
    { name: 'TypeScript', slug: 'typescript', description: 'TypeScript 언어', color: '#3178C6', icon: '🔷' },
    { name: 'Next.js', slug: 'nextjs', description: 'Next.js 프레임워크', color: '#000000', icon: '▲' },
    { name: 'Node.js', slug: 'nodejs', description: 'Node.js 런타임', color: '#339933', icon: '🟢' },
    { name: 'Python', slug: 'python', description: 'Python 언어', color: '#3776AB', icon: '🐍' },
    { name: 'Database', slug: 'database', description: '데이터베이스', color: '#336791', icon: '🗄️' },
    { name: 'DevOps', slug: 'devops', description: 'DevOps & 인프라', color: '#FF6B6B', icon: '🔧' }
  ]

  return categories.slice(0, count).map((cat, index) => ({
    ...cat,
    board_type_id: boardTypes[index % boardTypes.length].id,
    is_active: true,
    order_index: index + 1
  }))
}

const generatePosts = async (count: number, supabase: any) => {
  // 필요한 데이터 가져오기
  const [boardTypesRes, categoriesRes, profilesRes] = await Promise.all([
    supabase.from('board_types').select('id').eq('slug', 'knowledge').single(),
    supabase.from('categories').select('id').limit(3),
    supabase.from('profiles').select('id').limit(3)
  ])

  if (!boardTypesRes.data || !categoriesRes.data?.length || !profilesRes.data?.length) {
    throw new Error('필요한 참조 데이터가 없습니다. board_types, categories, profiles를 먼저 생성해주세요.')
  }

  const titles = [
    'React 18의 새로운 기능들',
    'TypeScript 5.0 업데이트 가이드',
    'Next.js 14 App Router 완벽 가이드',
    'Node.js 성능 최적화 팁',
    'GraphQL vs REST API 비교',
    'Docker로 개발 환경 구축하기',
    'CI/CD 파이프라인 구축 가이드',
    'Kubernetes 입문자를 위한 가이드'
  ]

  return titles.slice(0, count).map((title, index) => ({
    board_type_id: boardTypesRes.data.id,
    category_id: categoriesRes.data[index % categoriesRes.data.length].id,
    author_id: profilesRes.data[index % profilesRes.data.length].id,
    title,
    content: `# ${title}\n\n${faker.lorem.paragraphs(5)}`,
    excerpt: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['published', 'draft', 'pending']),
    tags: faker.helpers.arrayElements(['react', 'javascript', 'typescript', 'nextjs', 'nodejs'], { min: 1, max: 3 }),
    is_featured: faker.datatype.boolean(),
    is_pinned: false,
    like_count: faker.number.int({ min: 0, max: 50 }),
    comment_count: faker.number.int({ min: 0, max: 20 }),
    view_count: faker.number.int({ min: 10, max: 1000 }),
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    published_at: faker.date.recent({ days: 25 }).toISOString()
  }))
}

const generateCommunities = async (count: number, supabase: any) => {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(3)

  if (!profiles?.length) {
    throw new Error('사용자가 없습니다. profiles를 먼저 생성해주세요.')
  }

  const communities = [
    { name: 'React 스터디', slug: 'react-study', description: 'React를 함께 공부하는 스터디 그룹입니다.', visibility: 'public' },
    { name: '알고리즘 클럽', slug: 'algo-club', description: '매일 알고리즘 문제를 풀어요', visibility: 'private' },
    { name: '사이드 프로젝트', slug: 'side-project', description: '함께 만들어가는 프로젝트', visibility: 'public' },
    { name: '백엔드 스터디', slug: 'backend-study', description: '백엔드 기술 스터디', visibility: 'public' },
    { name: '프론트엔드 마스터', slug: 'frontend-master', description: '프론트엔드 심화 학습', visibility: 'private' }
  ]

  return communities.slice(0, count).map((comm, index) => ({
    ...comm,
    icon_url: faker.image.avatar(),
    cover_image: faker.image.url(),
    max_members: faker.number.int({ min: 5, max: 20 }),
    tags: faker.helpers.arrayElements(['study', 'project', 'frontend', 'backend', 'algorithm'], { min: 1, max: 3 }),
    created_by: profiles[index % profiles.length].id
  }))
}

const generateTags = (count: number) => {
  const tags = [
    { name: 'react', slug: 'react', description: 'React 관련 태그' },
    { name: 'javascript', slug: 'javascript', description: 'JavaScript 태그' },
    { name: 'typescript', slug: 'typescript', description: 'TypeScript 태그' },
    { name: 'nextjs', slug: 'nextjs', description: 'Next.js 프레임워크' },
    { name: 'nodejs', slug: 'nodejs', description: 'Node.js 런타임' },
    { name: 'python', slug: 'python', description: 'Python 언어' },
    { name: 'database', slug: 'database', description: '데이터베이스' },
    { name: 'devops', slug: 'devops', description: 'DevOps & 인프라' },
    { name: 'frontend', slug: 'frontend', description: '프론트엔드' },
    { name: 'backend', slug: 'backend', description: '백엔드' }
  ]

  return tags.slice(0, count).map(tag => ({
    ...tag,
    usage_count: faker.number.int({ min: 0, max: 100 })
  }))
}

const generatePostComments = async (count: number, supabase: any) => {
  const [postsRes, profilesRes] = await Promise.all([
    supabase.from('posts').select('id').limit(3),
    supabase.from('profiles').select('id').limit(3)
  ])

  if (!postsRes.data?.length || !profilesRes.data?.length) {
    throw new Error('필요한 참조 데이터가 없습니다. posts, profiles를 먼저 생성해주세요.')
  }

  return Array.from({ length: count }, (_, index) => ({
    post_id: postsRes.data[index % postsRes.data.length].id,
    author_id: profilesRes.data[index % profilesRes.data.length].id,
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    parent_id: null,
    created_at: faker.date.recent({ days: 10 }).toISOString()
  }))
}

const generateCommunityMembers = async (count: number, supabase: any) => {
  const [communitiesRes, profilesRes] = await Promise.all([
    supabase.from('communities').select('id').limit(2),
    supabase.from('profiles').select('id').limit(count)
  ])

  if (!communitiesRes.data?.length || !profilesRes.data?.length) {
    throw new Error('필요한 참조 데이터가 없습니다. communities, profiles를 먼저 생성해주세요.')
  }

  const members = []
  for (let i = 0; i < count; i++) {
    members.push({
      community_id: communitiesRes.data[i % communitiesRes.data.length].id,
      user_id: profilesRes.data[i % profilesRes.data.length].id,
      role: i === 0 ? 'owner' : 'member',
      joined_at: faker.date.recent({ days: 20 }).toISOString()
    })
  }
  return members
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardType: string }> }
) {
  const supabase = await createClient()
  const resolvedParams = await params
  const { boardType } = resolvedParams
  const searchParams = request.nextUrl.searchParams
  const count = parseInt(searchParams.get('count') || '3')

  try {
    let data: any[] = []
    let result: any

    switch (boardType) {
      case 'profiles':
        data = generateProfiles(count)
        // profiles는 auth.users와 연결되어 있으므로 직접 삽입 불가
        // 대신 기존 profiles 조회
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .limit(count)
        data = existingProfiles || []
        break

      case 'board_types':
        data = generateBoardTypes(count)
        result = await supabase.from('board_types').insert(data).select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'categories':
        data = await generateCategories(count, supabase)
        result = await supabase.from('categories').insert(data).select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'posts':
        data = await generatePosts(count, supabase)
        result = await supabase.from('posts').insert(data).select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'communities':
        data = await generateCommunities(count, supabase)
        result = await supabase.from('communities').insert(data).select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'tags':
        data = generateTags(count)
        result = await supabase.from('tags').insert(data).select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'post_comments':
        data = await generatePostComments(count, supabase)
        result = await supabase.from('post_comments').insert(data).select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'community_members':
        data = await generateCommunityMembers(count, supabase)
        // 중복 방지를 위해 upsert 사용
        result = await supabase
          .from('community_members')
          .upsert(data, { onConflict: 'community_id,user_id' })
          .select()
        if (result.error) throw result.error
        data = result.data
        break

      case 'post_likes':
        // post_likes는 복합 기본 키를 가지고 있어서 특별 처리 필요
        const [postsForLikes, profilesForLikes] = await Promise.all([
          supabase.from('posts').select('id').limit(count),
          supabase.from('profiles').select('id').limit(count)
        ])
        
        if (!postsForLikes.data?.length || !profilesForLikes.data?.length) {
          throw new Error('필요한 참조 데이터가 없습니다.')
        }

        const likes = []
        for (let i = 0; i < Math.min(count, postsForLikes.data.length, profilesForLikes.data.length); i++) {
          likes.push({
            post_id: postsForLikes.data[i].id,
            user_id: profilesForLikes.data[i].id
          })
        }
        
        result = await supabase.from('post_likes').upsert(likes, { onConflict: 'post_id,user_id' }).select()
        if (result.error) throw result.error
        data = result.data
        break

      default:
        return NextResponse.json(
          { error: `지원하지 않는 테이블입니다: ${boardType}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      count: data.length,
      data,
      message: `${data.length}개의 ${boardType} 데이터가 생성되었습니다.`
    })
  } catch (error) {
    console.error('Test data generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '테스트 데이터 생성 실패' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/board-types/[boardType]/test-data
 * 
 * 특정 테이블의 테스트 데이터 삭제
 * 
 * 주의사항:
 * - profiles: auth.users와 연결되어 있어 삭제 불가
 * - board_types, categories: 기본 데이터는 보호됨
 * - 참조 무결성을 고려하여 순서대로 삭제 필요
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardType: string }> }
) {
  const supabase = await createClient()
  const resolvedParams = await params
  const { boardType } = resolvedParams

  try {
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let result: any
    let deletedCount = 0

    // 각 테이블에 맞는 삭제 로직
    switch (boardType) {
      case 'profiles':
        // profiles는 auth.users와 연결되어 있으므로 삭제 불가
        return NextResponse.json({
          deleted: 0,
          message: 'profiles 테이블은 auth.users와 연결되어 있어 삭제할 수 없습니다. 대신 Supabase 대시보드에서 직접 관리해주세요.'
        })

      case 'board_types':
        // 기본 board_types 보호 (knowledge, forum)
        result = await supabase
          .from('board_types')
          .delete()
          .not('slug', 'in', '("knowledge","forum")')
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'categories':
        // 기본 카테고리 보호
        result = await supabase
          .from('categories')
          .delete()
          .not('slug', 'in', '("javascript","react","typescript","nextjs")')
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'posts':
        // 모든 posts 삭제 가능 (테스트 데이터만 있다고 가정)
        result = await supabase
          .from('posts')
          .delete()
          .not('id', 'is', null)
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'communities':
        // 모든 communities 삭제 가능
        result = await supabase
          .from('communities')
          .delete()
          .not('id', 'is', null)
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'tags':
        // 테스트 태그만 삭제 (usage_count가 낮은 것들)
        result = await supabase
          .from('tags')
          .delete()
          .lt('usage_count', 5) // 사용 횟수가 5회 미만인 태그만
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'post_comments':
        // 모든 댓글 삭제 가능
        result = await supabase
          .from('post_comments')
          .delete()
          .not('id', 'is', null)
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'community_members':
        // owner를 제외한 member만 삭제
        result = await supabase
          .from('community_members')
          .delete()
          .eq('role', 'member')
          .select()
        deletedCount = result.data?.length || 0
        break

      case 'post_likes':
        // 모든 좋아요 삭제 가능
        result = await supabase
          .from('post_likes')
          .delete()
          .not('post_id', 'is', null)
          .select()
        deletedCount = result.data?.length || 0
        break

      default:
        return NextResponse.json(
          { error: `지원하지 않는 테이블입니다: ${boardType}` },
          { status: 400 }
        )
    }

    if (result?.error) throw result.error

    return NextResponse.json({
      deleted: deletedCount,
      message: `${deletedCount}개의 ${boardType} 데이터가 삭제되었습니다.`,
      details: {
        table: boardType,
        count: deletedCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Test data deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '테스트 데이터 삭제 실패' },
      { status: 500 }
    )
  }
}
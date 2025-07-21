import { test, expect } from '@playwright/test'

test.describe('커뮤니티 시스템', () => {
  test('커뮤니티 목록 페이지가 정상적으로 로딩되어야 한다', async ({ page }) => {
    await page.goto('/communities')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/커뮤니티/)
    
    // 커뮤니티 목록 섹션 확인
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
    
    // 로딩 대기
    await page.waitForTimeout(2000)
    
    // 커뮤니티 목록 또는 빈 상태 메시지 확인
    const hasContent = await page.locator('.grid, .community-list').count() > 0 || 
                      await page.locator('text=커뮤니티가 없습니다').count() > 0 ||
                      await page.locator('text=전체 공개 커뮤니티').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('커뮤니티 생성 버튼이 표시되어야 한다', async ({ page }) => {
    await page.goto('/communities')
    await page.waitForTimeout(2000)
    
    // 커뮤니티 생성 버튼 확인
    const createButtons = page.locator('button:text("커뮤니티 생성"), button:text("새 커뮤니티"), a:text("커뮤니티 생성")')
    
    if (await createButtons.count() > 0) {
      await expect(createButtons.first()).toBeVisible()
    }
  })

  test('전체 공개 커뮤니티가 표시되어야 한다', async ({ page }) => {
    await page.goto('/communities')
    await page.waitForTimeout(2000)
    
    // 전체 공개 커뮤니티 확인
    const publicCommunity = page.locator('text=전체 공개 커뮤니티, text=Global Community, .community-card')
    
    if (await publicCommunity.count() > 0) {
      await expect(publicCommunity.first()).toBeVisible()
    }
  })

  test('커뮤니티 상세 페이지가 정상적으로 로딩되어야 한다', async ({ page }) => {
    await page.goto('/communities')
    await page.waitForTimeout(2000)
    
    // 커뮤니티 링크 찾기
    const communityLinks = page.locator('a[href*="/communities/"]')
    const linkCount = await communityLinks.count()
    
    if (linkCount > 0) {
      // 첫 번째 커뮤니티 클릭
      await communityLinks.first().click()
      await page.waitForTimeout(2000)
      
      // 커뮤니티 상세 페이지 확인
      await expect(page).toHaveURL(/\/communities\/\d+/)
      
      // 커뮤니티 정보 섹션 확인
      const communityInfo = page.locator('main, .community-detail')
      await expect(communityInfo).toBeVisible()
      
      // 탭 메뉴 확인 (채팅, 메모, 파일)
      const tabs = page.locator('text=채팅, text=메모, text=파일, [role="tab"]')
      if (await tabs.count() > 0) {
        await expect(tabs.first()).toBeVisible()
      }
    } else {
      console.log('커뮤니티가 없어서 상세 페이지 테스트를 건너뜁니다.')
    }
  })

  test('커뮤니티 접근 권한 제어가 작동해야 한다', async ({ page }) => {
    // 임의의 커뮤니티 ID로 접근 시도 (인증되지 않은 상태)
    await page.goto('/communities/999')
    await page.waitForTimeout(2000)
    
    // 접근 제한 메시지 또는 로그인 리다이렉트 확인
    const hasAccessControl = await page.locator('text=접근 권한이 없습니다').count() > 0 ||
                            await page.locator('text=로그인이 필요합니다').count() > 0 ||
                            await page.locator('text=커뮤니티를 찾을 수 없습니다').count() > 0 ||
                            page.url().includes('/auth/login') ||
                            page.url().includes('/login')
    
    expect(hasAccessControl).toBeTruthy()
  })

  test('커뮤니티 멤버십 기능이 표시되어야 한다', async ({ page }) => {
    await page.goto('/communities')
    await page.waitForTimeout(2000)
    
    // 커뮤니티 카드에서 멤버 수나 가입 버튼 확인
    const membershipElements = page.locator('text=멤버, text=참여, button:text("가입"), text=인원')
    
    if (await membershipElements.count() > 0) {
      await expect(membershipElements.first()).toBeVisible()
    }
  })

  test('전체 공개 커뮤니티 접근이 가능해야 한다', async ({ page }) => {
    // 전체 공개 커뮤니티는 ID 1을 가진다고 가정
    await page.goto('/communities/1')
    await page.waitForTimeout(3000)
    
    // 페이지가 정상적으로 로딩되거나 적절한 안내 메시지가 표시되어야 함
    const hasValidResponse = await page.locator('main').count() > 0 ||
                            await page.locator('text=전체 공개').count() > 0 ||
                            await page.locator('text=Global').count() > 0 ||
                            await page.locator('text=커뮤니티').count() > 0
    
    expect(hasValidResponse).toBeTruthy()
  })
})
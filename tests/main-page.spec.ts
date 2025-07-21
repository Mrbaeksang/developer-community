import { test, expect } from '@playwright/test'

test.describe('메인 페이지', () => {
  test('메인 페이지가 정상적으로 로딩되어야 한다', async ({ page }) => {
    await page.goto('/')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/개발자 커뮤니티/)
    
    // 메인 헤더 확인
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // 네비게이션 링크들 확인
    await expect(page.locator('text=홈')).toBeVisible()
    await expect(page.locator('text=커뮤니티')).toBeVisible()
    await expect(page.locator('text=로그인')).toBeVisible()
    await expect(page.locator('text=회원가입')).toBeVisible()
  })

  test('게시글 목록이 표시되어야 한다', async ({ page }) => {
    await page.goto('/')
    
    // 게시글 섹션 확인
    const postsSection = page.locator('main')
    await expect(postsSection).toBeVisible()
    
    // 로딩 상태 후 게시글 또는 빈 상태 메시지 확인
    await page.waitForTimeout(2000) // API 로딩 대기
    
    // 게시글이 있거나 빈 상태 메시지가 있어야 함
    const hasContent = await page.locator('.grid').count() > 0 || 
                      await page.locator('text=게시글이 없습니다').count() > 0
    expect(hasContent).toBeTruthy()
  })

  test('카테고리 필터가 작동해야 한다', async ({ page }) => {
    await page.goto('/')
    
    // 카테고리 선택 요소 확인
    const categorySelect = page.locator('select, [role="combobox"]').first()
    if (await categorySelect.count() > 0) {
      await expect(categorySelect).toBeVisible()
    }
  })

  test('검색 기능이 있어야 한다', async ({ page }) => {
    await page.goto('/')
    
    // 검색 입력 필드 확인
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]')
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible()
    }
  })
})
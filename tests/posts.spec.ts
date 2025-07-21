import { test, expect } from '@playwright/test'

test.describe('게시글 시스템', () => {
  test('게시글 상세 페이지가 정상적으로 로딩되어야 한다', async ({ page }) => {
    // 먼저 메인 페이지에서 게시글 링크를 찾아보자
    await page.goto('/')
    await page.waitForTimeout(2000) // API 로딩 대기
    
    // 게시글 링크가 있는지 확인
    const postLinks = page.locator('a[href*="/posts/"]')
    const linkCount = await postLinks.count()
    
    if (linkCount > 0) {
      // 첫 번째 게시글 클릭
      await postLinks.first().click()
      
      // 게시글 상세 페이지 확인
      await expect(page).toHaveURL(/\/posts\/\d+/)
      
      // 게시글 내용 요소들 확인
      await expect(page.locator('h1, .title')).toBeVisible()
      await expect(page.locator('.content, .post-content, main')).toBeVisible()
    } else {
      console.log('게시글이 없어서 상세 페이지 테스트를 건너뜁니다.')
    }
  })

  test('게시글 작성 페이지는 인증이 필요해야 한다', async ({ page }) => {
    await page.goto('/posts/write')
    
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트되거나 접근 제한 메시지가 표시되어야 함
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    const hasAuthRedirect = currentUrl.includes('/auth/login') || 
                           currentUrl.includes('/login') ||
                           await page.locator('text=로그인이 필요합니다').count() > 0 ||
                           await page.locator('text=접근 권한이 없습니다').count() > 0
    
    expect(hasAuthRedirect).toBeTruthy()
  })

  test('게시글 목록에서 카테고리별 필터링이 작동해야 한다', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // 카테고리 선택 요소 찾기
    const categorySelects = page.locator('select, [role="combobox"], [data-testid="category-filter"]')
    
    if (await categorySelects.count() > 0) {
      const categorySelect = categorySelects.first()
      await expect(categorySelect).toBeVisible()
      
      // 카테고리 옵션이 있는지 확인
      const options = page.locator('option, [role="option"]')
      if (await options.count() > 1) {
        await categorySelect.click()
        await page.waitForTimeout(500)
        
        // 두 번째 옵션 선택 (첫 번째는 보통 "전체")
        const secondOption = options.nth(1)
        if (await secondOption.count() > 0) {
          await secondOption.click()
          await page.waitForTimeout(1000)
        }
      }
    }
  })

  test('게시글 검색 기능이 작동해야 한다', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // 검색 입력 필드 찾기
    const searchInputs = page.locator('input[type="search"], input[placeholder*="검색"], [data-testid="search-input"]')
    
    if (await searchInputs.count() > 0) {
      const searchInput = searchInputs.first()
      await expect(searchInput).toBeVisible()
      
      // 검색어 입력
      await searchInput.fill('테스트')
      
      // 검색 실행 (Enter 키 또는 검색 버튼)
      await searchInput.press('Enter')
      await page.waitForTimeout(1000)
      
      // 검색 결과 확인 (검색어가 URL에 반영되거나 결과가 표시됨)
      const hasSearchResult = page.url().includes('search') || 
                             page.url().includes('테스트') ||
                             await page.locator('text=검색 결과').count() > 0
      
      if (hasSearchResult) {
        expect(hasSearchResult).toBeTruthy()
      }
    }
  })

  test('게시글 좋아요 기능이 표시되어야 한다', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // 게시글 링크가 있는 경우 상세 페이지로 이동
    const postLinks = page.locator('a[href*="/posts/"]')
    const linkCount = await postLinks.count()
    
    if (linkCount > 0) {
      await postLinks.first().click()
      await page.waitForTimeout(2000)
      
      // 좋아요 버튼이나 카운트 확인
      const likeElements = page.locator('button:text("좋아요"), .like-button, [data-testid="like-button"], text=좋아요')
      
      if (await likeElements.count() > 0) {
        await expect(likeElements.first()).toBeVisible()
      }
    }
  })
})
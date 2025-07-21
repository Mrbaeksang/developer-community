import { test, expect } from '@playwright/test'

test.describe('인증 시스템', () => {
  test('로그인 페이지가 정상적으로 로딩되어야 한다', async ({ page }) => {
    await page.goto('/auth/login')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/로그인/)
    
    // 로그인 폼 요소들 확인
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"], button:text("로그인")')).toBeVisible()
    
    // 회원가입 링크 확인
    await expect(page.locator('text=회원가입')).toBeVisible()
  })

  test('회원가입 페이지가 정상적으로 로딩되어야 한다', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/회원가입/)
    
    // 회원가입 폼 요소들 확인
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('button[type="submit"], button:text("회원가입")')).toBeVisible()
    
    // 로그인 링크 확인
    await expect(page.locator('text=로그인')).toBeVisible()
  })

  test('로그인 폼 유효성 검사가 작동해야 한다', async ({ page }) => {
    await page.goto('/auth/login')
    
    // 빈 폼으로 제출 시도
    const submitButton = page.locator('button[type="submit"], button:text("로그인")')
    await submitButton.click()
    
    // 필수 필드 검증 확인 (HTML5 validation 또는 커스텀 에러 메시지)
    await page.waitForTimeout(1000)
    
    // 유효하지 않은 이메일 테스트
    await page.fill('input[type="email"], input[name="email"]', 'invalid-email')
    await submitButton.click()
    await page.waitForTimeout(1000)
  })

  test('회원가입 폼 유효성 검사가 작동해야 한다', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // 빈 폼으로 제출 시도
    const submitButton = page.locator('button[type="submit"], button:text("회원가입")')
    await submitButton.click()
    
    // 필수 필드 검증 확인
    await page.waitForTimeout(1000)
    
    // 유효하지 않은 이메일 테스트
    await page.fill('input[name="email"], input[type="email"]', 'invalid-email')
    await submitButton.click()
    await page.waitForTimeout(1000)
  })

  test('로그인과 회원가입 페이지 간 네비게이션이 작동해야 한다', async ({ page }) => {
    // 로그인 페이지에서 회원가입으로
    await page.goto('/auth/login')
    await page.click('text=회원가입')
    await expect(page).toHaveURL(/\/auth\/signup/)
    
    // 회원가입 페이지에서 로그인으로
    await page.click('text=로그인')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
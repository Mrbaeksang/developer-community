import { test, expect } from '@playwright/test'

test.describe('관리자 시스템', () => {
  test('관리자 페이지 접근이 제한되어야 한다', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    
    // 인증되지 않은 사용자는 관리자 페이지에 접근할 수 없어야 함
    const hasAccessControl = await page.locator('text=접근 권한이 없습니다').count() > 0 ||
                            await page.locator('text=로그인이 필요합니다').count() > 0 ||
                            await page.locator('text=관리자만 접근').count() > 0 ||
                            page.url().includes('/auth/login') ||
                            page.url().includes('/login') ||
                            page.url() !== 'http://localhost:3000/admin'
    
    expect(hasAccessControl).toBeTruthy()
  })

  test('관리자 승인 대기 페이지 접근이 제한되어야 한다', async ({ page }) => {
    await page.goto('/admin/posts/pending')
    await page.waitForTimeout(2000)
    
    // 인증되지 않은 사용자는 승인 대기 페이지에 접근할 수 없어야 함
    const hasAccessControl = await page.locator('text=접근 권한이 없습니다').count() > 0 ||
                            await page.locator('text=로그인이 필요합니다').count() > 0 ||
                            await page.locator('text=관리자만 접근').count() > 0 ||
                            page.url().includes('/auth/login') ||
                            page.url().includes('/login') ||
                            page.url() !== 'http://localhost:3000/admin/posts/pending'
    
    expect(hasAccessControl).toBeTruthy()
  })

  test('관리자 카테고리 관리 페이지 접근이 제한되어야 한다', async ({ page }) => {
    await page.goto('/admin/categories')
    await page.waitForTimeout(2000)
    
    // 인증되지 않은 사용자는 카테고리 관리 페이지에 접근할 수 없어야 함
    const hasAccessControl = await page.locator('text=접근 권한이 없습니다').count() > 0 ||
                            await page.locator('text=로그인이 필요합니다').count() > 0 ||
                            await page.locator('text=관리자만 접근').count() > 0 ||
                            page.url().includes('/auth/login') ||
                            page.url().includes('/login') ||
                            page.url() !== 'http://localhost:3000/admin/categories'
    
    expect(hasAccessControl).toBeTruthy()
  })

  test('관리자 API 엔드포인트가 보호되어야 한다', async ({ page, request }) => {
    // 관리자 전용 API에 인증 없이 접근 시도
    const response = await request.get('/api/admin/posts/pending')
    
    // 401 Unauthorized 또는 403 Forbidden 응답이 와야 함
    expect([401, 403]).toContain(response.status())
  })

  test('카테고리 관리 API가 보호되어야 한다', async ({ page, request }) => {
    // 카테고리 생성 API에 인증 없이 접근 시도
    const response = await request.post('/api/admin/categories', {
      data: {
        name: '테스트 카테고리',
        description: '테스트 설명'
      }
    })
    
    // 401 Unauthorized 응답이 와야 함
    expect(response.status()).toBe(401)
  })

  test('게시글 승인 API가 보호되어야 한다', async ({ page, request }) => {
    // 게시글 승인 API에 인증 없이 접근 시도
    const response = await request.patch('/api/admin/posts/1/approve')
    
    // 401 Unauthorized 응답이 와야 함
    expect(response.status()).toBe(401)
  })

  test('공개 API는 접근 가능해야 한다', async ({ page, request }) => {
    // 공개 카테고리 API는 접근 가능해야 함
    const response = await request.get('/api/categories')
    
    // 200 OK 응답이 와야 함
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('categories')
  })

  test('공개 게시글 API는 접근 가능해야 한다', async ({ page, request }) => {
    // 공개 게시글 목록 API는 접근 가능해야 함
    const response = await request.get('/api/posts')
    
    // 200 OK 응답이 와야 함
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('posts')
  })
})
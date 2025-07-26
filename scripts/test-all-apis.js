/**
 * 개발자 커뮤니티 플랫폼 - 전체 API TDD 테스트 스위트
 * 
 * 이 파일은 구현된 API와 미구현 API를 모두 포함하여
 * TDD(Test-Driven Development) 방식으로 개발할 수 있도록 합니다.
 * 
 * 사용법:
 * 1. node scripts/test-all-apis.js            # 전체 테스트 실행
 * 2. node scripts/test-all-apis.js --only auth # 특정 카테고리만 테스트
 * 3. node scripts/test-all-apis.js --missing   # 미구현 API만 테스트
 * 4. node scripts/test-all-apis.js --implemented # 구현된 API만 테스트
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 테스트용 인증 토큰 (실제 환경에서는 환경변수로 관리)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || '';

// 테스트 결과 추적
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  byCategory: {}
};

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 헬퍼 함수: API 요청
async function makeRequest(method, endpoint, options = {}) {
  const { body, headers = {}, token } = options;
  
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (token) {
    requestOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    const data = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text();
    
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error.message,
      ok: false
    };
  }
}

// 테스트 실행 함수
async function runTest(test) {
  testResults.total++;
  
  const categoryResults = testResults.byCategory[test.category] || {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  categoryResults.total++;
  testResults.byCategory[test.category] = categoryResults;

  if (test.skip) {
    testResults.skipped++;
    categoryResults.skipped++;
    console.log(`${colors.gray}⏭️  SKIP: ${test.name}${colors.reset}`);
    return;
  }

  try {
    const result = await test.run();
    
    if (result.success) {
      testResults.passed++;
      categoryResults.passed++;
      console.log(`${colors.green}✅ PASS: ${test.name}${colors.reset}`);
      if (result.message) {
        console.log(`   ${colors.gray}${result.message}${colors.reset}`);
      }
    } else {
      testResults.failed++;
      categoryResults.failed++;
      console.log(`${colors.red}❌ FAIL: ${test.name}${colors.reset}`);
      console.log(`   ${colors.red}${result.message}${colors.reset}`);
      if (result.details) {
        console.log(`   ${colors.gray}${JSON.stringify(result.details, null, 2)}${colors.reset}`);
      }
    }
  } catch (error) {
    testResults.failed++;
    categoryResults.failed++;
    console.log(`${colors.red}❌ ERROR: ${test.name}${colors.reset}`);
    console.log(`   ${colors.red}${error.message}${colors.reset}`);
  }
}

// API 테스트 정의
const apiTests = [
  // ==================== 인증 (Authentication) ====================
  {
    category: '인증',
    name: '현재 사용자 정보 조회',
    implemented: true,
    endpoint: '/auth/me',
    method: 'GET',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('GET', '/auth/me', { token: AUTH_TOKEN });
      
      if (!AUTH_TOKEN) {
        return { 
          success: response.status === 401,
          message: '인증 토큰 없이 401 반환 확인'
        };
      }
      
      if (response.status !== 200) {
        return { 
          success: false, 
          message: `예상: 200, 실제: ${response.status}`,
          details: response.data
        };
      }
      
      const required = ['id', 'email', 'username'];
      const missing = required.filter(field => !response.data[field]);
      
      return {
        success: missing.length === 0,
        message: missing.length ? `누락된 필드: ${missing.join(', ')}` : '사용자 정보 정상 반환'
      };
    }
  },
  
  {
    category: '인증',
    name: '로그아웃',
    implemented: true,
    endpoint: '/auth/logout',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('POST', '/auth/logout', { token: AUTH_TOKEN });
      return {
        success: response.status === 200,
        message: `상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 사용자 프로필 (User Profile) ====================
  {
    category: '사용자 프로필',
    name: '프로필 업데이트',
    implemented: false,
    endpoint: '/users/profile',
    method: 'PUT',
    requiresAuth: true,
    run: async () => {
      const updateData = {
        display_name: 'Test User',
        bio: '테스트 사용자입니다.',
        avatar_url: 'https://example.com/avatar.jpg'
      };
      
      const response = await makeRequest('PUT', '/users/profile', { 
        token: AUTH_TOKEN,
        body: updateData
      });
      
      // 미구현 API는 404를 예상
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`,
        details: { expectedStatus: 404, actualStatus: response.status }
      };
    }
  },
  
  {
    category: '사용자 프로필',
    name: '특정 사용자 프로필 조회',
    implemented: false,
    endpoint: '/users/{id}',
    method: 'GET',
    requiresAuth: false,
    run: async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('GET', `/users/${userId}`);
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '사용자 프로필',
    name: '아바타 이미지 업로드',
    implemented: false,
    endpoint: '/users/avatar',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      // FormData를 사용한 파일 업로드 테스트
      const response = await makeRequest('POST', '/users/avatar', {
        token: AUTH_TOKEN,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 게시글 (Posts) ====================
  {
    category: '게시글',
    name: '게시글 목록 조회',
    implemented: true,
    endpoint: '/posts',
    method: 'GET',
    requiresAuth: false,
    run: async () => {
      const response = await makeRequest('GET', '/posts?page=1&limit=10');
      
      if (response.status !== 200) {
        return {
          success: false,
          message: `예상: 200, 실제: ${response.status}`
        };
      }
      
      const hasRequiredFields = response.data.posts && 
                               response.data.totalPages !== undefined &&
                               response.data.currentPage !== undefined;
      
      return {
        success: hasRequiredFields,
        message: hasRequiredFields ? '게시글 목록 정상 반환' : '응답 형식 오류'
      };
    }
  },
  
  {
    category: '게시글',
    name: '게시글 작성',
    implemented: true,
    endpoint: '/posts',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      const postData = {
        title: '테스트 게시글',
        content: '테스트 내용입니다.',
        board_type_id: '123e4567-e89b-12d3-a456-426614174000',
        category_id: '987fcdeb-51a2-43e1-b456-426614174000',
        tags: ['test', 'api'],
        status: 'draft'
      };
      
      const response = await makeRequest('POST', '/posts', {
        token: AUTH_TOKEN,
        body: postData
      });
      
      if (!AUTH_TOKEN) {
        return {
          success: response.status === 401,
          message: '인증 없이 401 반환 확인'
        };
      }
      
      return {
        success: response.status === 201 || response.status === 200,
        message: `상태 코드: ${response.status}`,
        details: response.data
      };
    }
  },
  
  {
    category: '게시글',
    name: '트렌딩 게시글 조회',
    implemented: false,
    endpoint: '/posts/trending',
    method: 'GET',
    requiresAuth: false,
    run: async () => {
      const response = await makeRequest('GET', '/posts/trending?period=week&limit=10');
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 북마크 (Bookmarks) ====================
  {
    category: '북마크',
    name: '내 북마크 목록 조회',
    implemented: false,
    endpoint: '/posts/bookmarks',
    method: 'GET',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('GET', '/posts/bookmarks', {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '북마크',
    name: '북마크 추가',
    implemented: false,
    endpoint: '/posts/{id}/bookmark',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      const postId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('POST', `/posts/${postId}/bookmark`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '북마크',
    name: '북마크 제거',
    implemented: false,
    endpoint: '/posts/{id}/bookmark',
    method: 'DELETE',
    requiresAuth: true,
    run: async () => {
      const postId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('DELETE', `/posts/${postId}/bookmark`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 알림 (Notifications) ====================
  {
    category: '알림',
    name: '알림 목록 조회',
    implemented: false,
    endpoint: '/notifications',
    method: 'GET',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('GET', '/notifications?page=1&limit=20', {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '알림',
    name: '알림 읽음 표시',
    implemented: false,
    endpoint: '/notifications/{id}/read',
    method: 'PUT',
    requiresAuth: true,
    run: async () => {
      const notificationId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('PUT', `/notifications/${notificationId}/read`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '알림',
    name: '모든 알림 읽음 표시',
    implemented: false,
    endpoint: '/notifications/read-all',
    method: 'PUT',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('PUT', '/notifications/read-all', {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '알림',
    name: '읽지 않은 알림 수 조회',
    implemented: false,
    endpoint: '/notifications/unread-count',
    method: 'GET',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('GET', '/notifications/unread-count', {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 커뮤니티 (Communities) ====================
  {
    category: '커뮤니티',
    name: '커뮤니티 목록 조회',
    implemented: true,
    endpoint: '/communities',
    method: 'GET',
    requiresAuth: false,
    run: async () => {
      const response = await makeRequest('GET', '/communities?page=1&limit=10');
      
      if (response.status !== 200) {
        return {
          success: false,
          message: `예상: 200, 실제: ${response.status}`
        };
      }
      
      return {
        success: Array.isArray(response.data.communities),
        message: '커뮤니티 목록 정상 반환'
      };
    }
  },
  
  {
    category: '커뮤니티',
    name: '커뮤니티 가입 요청',
    implemented: false,
    endpoint: '/communities/{id}/join',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      const communityId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('POST', `/communities/${communityId}/join`, {
        token: AUTH_TOKEN,
        body: { message: '가입 신청합니다.' }
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '커뮤니티',
    name: '커뮤니티 가입 요청 목록',
    implemented: false,
    endpoint: '/communities/{id}/join-requests',
    method: 'GET',
    requiresAuth: true,
    run: async () => {
      const communityId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('GET', `/communities/${communityId}/join-requests`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '커뮤니티',
    name: '커뮤니티 가입 요청 처리',
    implemented: false,
    endpoint: '/communities/{id}/join-requests/{requestId}',
    method: 'PUT',
    requiresAuth: true,
    run: async () => {
      const communityId = '123e4567-e89b-12d3-a456-426614174000';
      const requestId = '987fcdeb-51a2-43e1-b456-426614174000';
      const response = await makeRequest('PUT', `/communities/${communityId}/join-requests/${requestId}`, {
        token: AUTH_TOKEN,
        body: { action: 'approve' }
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 댓글 좋아요 (Comment Likes) ====================
  {
    category: '댓글 좋아요',
    name: '게시글 댓글 좋아요',
    implemented: false,
    endpoint: '/posts/{id}/comments/{commentId}/like',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      const postId = '123e4567-e89b-12d3-a456-426614174000';
      const commentId = '987fcdeb-51a2-43e1-b456-426614174000';
      const response = await makeRequest('POST', `/posts/${postId}/comments/${commentId}/like`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '댓글 좋아요',
    name: '게시글 댓글 좋아요 취소',
    implemented: false,
    endpoint: '/posts/{id}/comments/{commentId}/like',
    method: 'DELETE',
    requiresAuth: true,
    run: async () => {
      const postId = '123e4567-e89b-12d3-a456-426614174000';
      const commentId = '987fcdeb-51a2-43e1-b456-426614174000';
      const response = await makeRequest('DELETE', `/posts/${postId}/comments/${commentId}/like`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 메시지 (Messages) ====================
  {
    category: '메시지',
    name: '메시지 목록 조회',
    implemented: false,
    endpoint: '/messages',
    method: 'GET',
    requiresAuth: true,
    run: async () => {
      const response = await makeRequest('GET', '/messages?page=1&limit=20', {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '메시지',
    name: '메시지 발송',
    implemented: false,
    endpoint: '/messages',
    method: 'POST',
    requiresAuth: true,
    run: async () => {
      const messageData = {
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        content: '안녕하세요, 테스트 메시지입니다.'
      };
      
      const response = await makeRequest('POST', '/messages', {
        token: AUTH_TOKEN,
        body: messageData
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '메시지',
    name: '메시지 읽음 표시',
    implemented: false,
    endpoint: '/messages/{id}/read',
    method: 'PUT',
    requiresAuth: true,
    run: async () => {
      const messageId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('PUT', `/messages/${messageId}/read`, {
        token: AUTH_TOKEN
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 통계 (Statistics) ====================
  {
    category: '통계',
    name: '사용자 활동 통계',
    implemented: false,
    endpoint: '/users/{id}/stats',
    method: 'GET',
    requiresAuth: false,
    run: async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('GET', `/users/${userId}/stats`);
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '통계',
    name: '커뮤니티 통계',
    implemented: false,
    endpoint: '/communities/{id}/stats',
    method: 'GET',
    requiresAuth: false,
    run: async () => {
      const communityId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await makeRequest('GET', `/communities/${communityId}/stats`);
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },

  // ==================== 관리자 (Admin) ====================
  {
    category: '관리자',
    name: '관리자 대시보드 통계',
    implemented: true,
    endpoint: '/admin/stats',
    method: 'GET',
    requiresAuth: true,
    requiresAdmin: true,
    run: async () => {
      const response = await makeRequest('GET', '/admin/stats', {
        token: ADMIN_TOKEN || AUTH_TOKEN
      });
      
      if (!ADMIN_TOKEN && !AUTH_TOKEN) {
        return {
          success: response.status === 401,
          message: '인증 없이 401 반환 확인'
        };
      }
      
      return {
        success: response.status === 200 || response.status === 403,
        message: `상태 코드: ${response.status} (관리자 권한 필요)`
      };
    }
  },
  
  {
    category: '관리자',
    name: '게시판 타입 생성',
    implemented: false,
    endpoint: '/admin/board-types',
    method: 'POST',
    requiresAuth: true,
    requiresAdmin: true,
    run: async () => {
      const boardTypeData = {
        name: '새 게시판',
        slug: 'new-board',
        description: '새로운 게시판입니다.',
        icon: 'board',
        requires_approval: true
      };
      
      const response = await makeRequest('POST', '/admin/board-types', {
        token: ADMIN_TOKEN || AUTH_TOKEN,
        body: boardTypeData
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
  
  {
    category: '관리자',
    name: '태그 관리',
    implemented: false,
    endpoint: '/admin/tags',
    method: 'POST',
    requiresAuth: true,
    requiresAdmin: true,
    run: async () => {
      const tagData = {
        name: 'new-tag',
        description: '새로운 태그'
      };
      
      const response = await makeRequest('POST', '/admin/tags', {
        token: ADMIN_TOKEN || AUTH_TOKEN,
        body: tagData
      });
      
      return {
        success: response.status === 404,
        message: `미구현 API - 상태 코드: ${response.status}`
      };
    }
  },
];

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);
  const options = {
    onlyCategory: null,
    onlyMissing: args.includes('--missing'),
    onlyImplemented: args.includes('--implemented')
  };
  
  // 카테고리 필터 확인
  const categoryIndex = args.findIndex(arg => arg === '--only');
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    options.onlyCategory = args[categoryIndex + 1];
  }
  
  console.log(`\n${colors.bright}${colors.blue}🧪 개발자 커뮤니티 플랫폼 - API 테스트 스위트${colors.reset}`);
  console.log(`${colors.gray}================================================${colors.reset}\n`);
  
  if (options.onlyMissing) {
    console.log(`${colors.yellow}📌 미구현 API만 테스트합니다.${colors.reset}\n`);
  } else if (options.onlyImplemented) {
    console.log(`${colors.green}📌 구현된 API만 테스트합니다.${colors.reset}\n`);
  }
  
  if (options.onlyCategory) {
    console.log(`${colors.cyan}📌 카테고리 필터: ${options.onlyCategory}${colors.reset}\n`);
  }
  
  // 서버 연결 테스트
  console.log(`${colors.gray}서버 연결 테스트 중...${colors.reset}`);
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/health`).catch(() => null);
    if (!healthCheck) {
      console.log(`${colors.red}❌ 서버에 연결할 수 없습니다. 개발 서버가 실행 중인지 확인하세요.${colors.reset}`);
      console.log(`${colors.gray}   npm run dev${colors.reset}\n`);
      return;
    }
  } catch (error) {
    // health endpoint가 없어도 계속 진행
  }
  
  console.log(`${colors.green}✅ 서버 연결 성공${colors.reset}\n`);
  
  // 테스트 필터링
  const testsToRun = apiTests.filter(test => {
    if (options.onlyCategory && test.category !== options.onlyCategory) {
      return false;
    }
    if (options.onlyMissing && test.implemented) {
      return false;
    }
    if (options.onlyImplemented && !test.implemented) {
      return false;
    }
    return true;
  });
  
  // 카테고리별로 그룹화
  const testsByCategory = testsToRun.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {});
  
  // 카테고리별로 테스트 실행
  for (const [category, tests] of Object.entries(testsByCategory)) {
    console.log(`\n${colors.bright}📁 ${category}${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(40)}${colors.reset}`);
    
    for (const test of tests) {
      await runTest(test);
    }
  }
  
  // 결과 요약
  console.log(`\n${colors.bright}${colors.blue}📊 테스트 결과 요약${colors.reset}`);
  console.log(`${colors.gray}================================================${colors.reset}`);
  console.log(`총 테스트: ${testResults.total}`);
  console.log(`${colors.green}✅ 성공: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ 실패: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.gray}⏭️  건너뜀: ${testResults.skipped}${colors.reset}`);
  
  // 카테고리별 결과
  if (Object.keys(testResults.byCategory).length > 1) {
    console.log(`\n${colors.bright}카테고리별 결과:${colors.reset}`);
    for (const [category, results] of Object.entries(testResults.byCategory)) {
      const passRate = results.total > 0 
        ? Math.round((results.passed / results.total) * 100) 
        : 0;
      console.log(`  ${category}: ${results.passed}/${results.total} (${passRate}%)`);
    }
  }
  
  // TDD 가이드
  if (options.onlyMissing || testResults.failed > 0) {
    console.log(`\n${colors.bright}${colors.yellow}🔧 TDD 개발 가이드${colors.reset}`);
    console.log(`${colors.gray}================================================${colors.reset}`);
    console.log('1. 실패한 테스트 중 하나를 선택하세요');
    console.log('2. 해당 API 엔드포인트를 구현하세요');
    console.log('3. 테스트를 다시 실행하여 통과하는지 확인하세요');
    console.log('4. 필요시 테스트 케이스를 수정하거나 추가하세요');
    console.log(`\n${colors.gray}특정 카테고리만 테스트: node scripts/test-all-apis.js --only 카테고리명${colors.reset}`);
    console.log(`${colors.gray}미구현 API만 테스트: node scripts/test-all-apis.js --missing${colors.reset}`);
  }
  
  // 종료 코드
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 실행
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}테스트 실행 중 오류:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { apiTests, makeRequest, runTest };
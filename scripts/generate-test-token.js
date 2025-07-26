/**
 * 테스트용 인증 토큰 생성 스크립트
 * 
 * 사용법:
 * node scripts/generate-test-token.js
 * 
 * 생성된 토큰을 환경변수로 설정:
 * export TEST_AUTH_TOKEN="토큰값"
 * export TEST_ADMIN_TOKEN="관리자토큰값"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일을 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateTestTokens() {
  console.log('🔑 테스트용 인증 토큰 생성 중...\n');

  // 테스트 계정 정보
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123!'
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'adminpassword123!'
  };

  try {
    // 일반 사용자 로그인 시도
    console.log('1. 일반 사용자 토큰 생성 시도...');
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (userError) {
      console.log('   ⚠️  로그인 실패, 새 계정 생성 시도...');
      
      // 계정 생성
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            username: 'testuser',
            display_name: '테스트 사용자'
          }
        }
      });

      if (signUpError) {
        console.error('   ❌ 계정 생성 실패:', signUpError.message);
      } else {
        console.log('   ✅ 테스트 계정 생성 성공');
        console.log(`   📧 이메일 인증이 필요할 수 있습니다: ${testUser.email}`);
      }
    } else {
      console.log('   ✅ 일반 사용자 토큰 생성 성공');
      console.log(`   TEST_AUTH_TOKEN="${userData.session?.access_token}"`);
    }

    // 관리자 로그인 시도
    console.log('\n2. 관리자 토큰 생성 시도...');
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password
    });

    if (adminError) {
      console.log('   ⚠️  관리자 계정이 없습니다.');
      console.log('   📌 관리자 계정은 수동으로 생성하고 role을 설정해야 합니다.');
      console.log('   SQL: UPDATE profiles SET role = \'admin\' WHERE email = \'admin@example.com\';');
    } else {
      console.log('   ✅ 관리자 토큰 생성 성공');
      console.log(`   TEST_ADMIN_TOKEN="${adminData.session?.access_token}"`);
    }

    // 사용 가이드
    console.log('\n📋 사용 방법:');
    console.log('─'.repeat(50));
    console.log('1. 위의 토큰을 복사하세요');
    console.log('2. 터미널에서 환경변수로 설정:');
    console.log('   Windows: set TEST_AUTH_TOKEN=토큰값');
    console.log('   Mac/Linux: export TEST_AUTH_TOKEN=토큰값');
    console.log('3. API 테스트 실행:');
    console.log('   npm run test:api');
    console.log('\n또는 .env.local 파일에 추가:');
    console.log('TEST_AUTH_TOKEN=토큰값');
    console.log('TEST_ADMIN_TOKEN=관리자토큰값');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }

  process.exit(0);
}

// 실행
generateTestTokens();
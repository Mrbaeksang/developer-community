#!/usr/bin/env node

/**
 * API 테스트용 토큰 생성 스크립트
 * 
 * 사용법:
 * npm run generate:token
 * npm run generate:token -- --email user@example.com --password yourpassword
 * npm run generate:token -- --admin
 */

const https = require('https');
const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// .env.local 파일 로드
const loadEnvFile = () => {
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
};

// 환경 변수 로드
loadEnvFile();

// 환경 변수에서 Supabase 설정 읽기
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// 콘솔 유틸리티
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠️${colors.reset} ${msg}`)
};

// readline 인터페이스
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 비밀번호 입력 (숨김 처리)
const askPassword = (prompt) => {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    // Windows와 Unix 계열 모두 지원
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    
    stdout.write(prompt);

    let password = '';
    
    stdin.on('data', (char) => {
      char = char.toString('utf8');

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.removeAllListeners('data');
          if (stdin.isTTY) {
            stdin.setRawMode(false);
          }
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          // Ctrl+C
          process.exit();
          break;
        case '\u007f':
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine();
            stdout.cursorTo(0);
            stdout.write(prompt + '*'.repeat(password.length));
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
};

// 질문 헬퍼
const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// Supabase Auth API 호출
const callSupabaseAuth = (endpoint, data) => {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: `/auth/v1/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.msg || result.error_description || 'Unknown error'));
          }
        } catch (error) {
          reject(new Error('Invalid response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
};

// 프로필 정보 가져오기
const getProfile = async (userId, accessToken) => {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: `/rest/v1/profiles?id=eq.${userId}&select=*`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.length > 0) {
            resolve(result[0]);
          } else {
            reject(new Error('Profile not found'));
          }
        } catch (error) {
          reject(new Error('Invalid response'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// 메인 함수
async function main() {
  try {
    // 환경 변수 체크
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      log.error('환경 변수가 설정되지 않았습니다.');
      log.info('다음 명령어를 실행하여 환경 변수를 로드하세요:');
      log.info('  Windows: set NEXT_PUBLIC_SUPABASE_URL=your_url && set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
      log.info('  Mac/Linux: export NEXT_PUBLIC_SUPABASE_URL=your_url && export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
      process.exit(1);
    }

    console.log(`
${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.blue}                  API 테스트 토큰 생성기                      ${colors.reset}
${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
    `);

    // 커맨드라인 인수 파싱
    const args = process.argv.slice(2);
    let email = '';
    let password = '';
    let needAdmin = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--email' && args[i + 1]) {
        email = args[i + 1];
        i++;
      } else if (args[i] === '--password' && args[i + 1]) {
        password = args[i + 1];
        i++;
      } else if (args[i] === '--admin') {
        needAdmin = true;
      }
    }

    // 이메일 입력
    if (!email) {
      email = await ask('이메일 주소를 입력하세요: ');
    }

    // 비밀번호 입력
    if (!password) {
      password = await askPassword('비밀번호를 입력하세요: ');
    }

    rl.close();

    log.info('로그인 중...');

    // 로그인 시도
    const authResponse = await callSupabaseAuth('token?grant_type=password', {
      email,
      password
    });

    if (!authResponse.access_token) {
      throw new Error('로그인에 실패했습니다.');
    }

    log.success('로그인 성공!');

    // 프로필 정보 가져오기
    const profile = await getProfile(authResponse.user.id, authResponse.access_token);
    
    console.log(`
${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);
    
    log.info(`사용자: ${profile.username || profile.display_name || email}`);
    log.info(`역할: ${profile.role || 'user'}`);
    
    console.log(`
${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.green}토큰이 생성되었습니다!${colors.reset}

${colors.yellow}일반 사용자 토큰:${colors.reset}
${authResponse.access_token}
`);

    if (profile.role === 'admin') {
      console.log(`${colors.red}관리자 토큰 (관리자 권한 확인됨):${colors.reset}
${authResponse.access_token}
`);
    } else if (needAdmin) {
      log.warn('이 계정은 관리자 권한이 없습니다.');
      log.info('관리자 권한이 필요한 API는 테스트할 수 없습니다.');
    }

    console.log(`
${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.blue}사용 방법:${colors.reset}
1. API 테스트 센터에서 "토큰 설정" 버튼을 클릭하세요.
2. 위의 토큰을 복사하여 붙여넣으세요.
3. 관리자 권한이 있다면 같은 토큰을 관리자 토큰 필드에도 입력하세요.

${colors.yellow}토큰 유효 기간:${colors.reset} 1시간
${colors.yellow}만료 시간:${colors.reset} ${new Date(authResponse.expires_at * 1000).toLocaleString()}
`);

  } catch (error) {
    log.error(`오류 발생: ${error.message}`);
    
    if (error.message.includes('Invalid login')) {
      log.info('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else if (error.message.includes('Email not confirmed')) {
      log.info('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
    }
    
    process.exit(1);
  }
}

// 실행
main();
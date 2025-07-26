#!/usr/bin/env node
/**
 * 시스템 전체 상태 점검 스크립트
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 시스템 체크 시작...\n');

// 1. 환경 변수 체크
console.log('1️⃣ 환경 변수 확인');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}: 설정됨`);
    } else {
      console.log(`❌ ${varName}: 누락됨`);
      process.exit(1);
    }
  });
} else {
  console.log('❌ .env.local 파일이 없습니다!');
  process.exit(1);
}

// 2. 의존성 체크
console.log('\n2️⃣ 주요 의존성 확인');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = [
  '@supabase/ssr',
  '@supabase/supabase-js',
  'next',
  'react',
  '@tanstack/react-query'
];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep}: 누락됨`);
  }
});

// 3. 디렉토리 구조 체크
console.log('\n3️⃣ 디렉토리 구조 확인');
const requiredDirs = [
  'src/app',
  'src/components',
  'src/hooks',
  'src/lib',
  'src/types'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}: 존재함`);
  } else {
    console.log(`❌ ${dir}: 누락됨`);
  }
});

// 4. TypeScript 설정 체크
console.log('\n4️⃣ TypeScript 설정 확인');
if (fs.existsSync('tsconfig.json')) {
  console.log('✅ tsconfig.json: 존재함');
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log(`  - strict: ${tsConfig.compilerOptions?.strict || false}`);
  console.log(`  - target: ${tsConfig.compilerOptions?.target || 'unknown'}`);
} else {
  console.log('❌ tsconfig.json: 누락됨');
}

console.log('\n✨ 시스템 체크 완료!');
// 환경 변수 검증 시스템
export interface EnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Security
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_WINDOW?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  
  // Features
  ENABLE_ANALYTICS?: string;
  ENABLE_EMAIL_NOTIFICATIONS?: string;
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private validated = false;
  
  private constructor() {}
  
  static getInstance(): EnvironmentValidator {
    if (!this.instance) {
      this.instance = new EnvironmentValidator();
    }
    return this.instance;
  }
  
  validate(): void {
    if (this.validated) return;
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingVars: string[] = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file.'
      );
    }
    
    // Validate Supabase URL format
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
    }
    
    // Validate Supabase Anon Key format
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (anonKey.length < 100) {
      throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format');
    }
    
    this.validated = true;
    console.log('✅ Environment variables validated successfully');
  }
  
  getConfig(): EnvConfig {
    this.validate();
    
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
      ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS
    };
  }
}

export const envValidator = EnvironmentValidator.getInstance();
export const env = envValidator.getConfig.bind(envValidator);

// 앱 시작시 자동 검증
if (typeof window === 'undefined') {
  envValidator.validate();
}
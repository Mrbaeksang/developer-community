import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from './config'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다:', {
      url: supabaseUrl ? '설정됨' : '미설정',
      key: supabaseAnonKey ? '설정됨' : '미설정'
    })
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: supabaseConfig.auth,
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split('; ')
            const cookie = cookies.find(c => c.startsWith(`${name}=`))
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
          }
          return undefined
        },
        set(name: string, value: string, options?: any) {
          if (typeof document !== 'undefined') {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            // 쿠키 옵션 설정
            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`
            }
            if (options?.expires) {
              cookieString += `; Expires=${options.expires.toUTCString()}`
            }
            cookieString += `; Path=/`
            cookieString += `; SameSite=Lax`
            
            // localhost에서는 Secure 제외
            if (window.location.protocol === 'https:') {
              cookieString += `; Secure`
            }
            
            document.cookie = cookieString
            console.log('[Cookie Set]', name, {
              value: value.substring(0, 20) + '...',
              options,
              cookieString
            })
          }
        },
        remove(name: string, options?: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT`
          }
        }
      }
    }
  )
}
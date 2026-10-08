import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          if (typeof document === 'undefined') return null
          const cookie = document.cookie
            .split('; ')
            .find((c) => c.startsWith(`${name}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
        },
        set(name, value, options) {
          if (typeof document === 'undefined') return
          let cookieString = `${name}=${encodeURIComponent(value)}`
          if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`
          else if (options?.expires) cookieString += `; Expires=${options.expires.toUTCString()}`
          if (options?.path) cookieString += `; Path=${options.path}`
          else cookieString += '; Path=/'
          if (options?.domain) cookieString += `; Domain=${options.domain}`
          if (options?.secure) cookieString += '; Secure'
          if (options?.sameSite) cookieString += `; SameSite=${options.sameSite}`
          else cookieString += '; SameSite=Lax'
          document.cookie = cookieString
        },
        remove(name, options) {
          if (typeof document === 'undefined') return
          let cookieString = `${name}=; Max-Age=-1`
          if (options?.path) cookieString += `; Path=${options.path}`
          else cookieString += '; Path=/'
          if (options?.domain) cookieString += `; Domain=${options.domain}`
          document.cookie = cookieString
        },
      },
    },
  )
}

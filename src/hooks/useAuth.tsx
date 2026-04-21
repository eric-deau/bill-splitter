import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session, Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  isRecoverySession: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signInWithOAuth: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  /** Re-authenticates with the current password. Throws if incorrect. */
  verifyPassword: (currentPassword: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecoverySession, setIsRecoverySession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true)
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsRecoverySession(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
  }

  const signIn = async (email: string, password: string, rememberMe = true) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!rememberMe && data.session) {
      sessionStorage.setItem('iou_session_only', '1')
    } else {
      sessionStorage.removeItem('iou_session_only')
    }
  }

  /**
   * Initiates an OAuth redirect flow. Supabase handles the popup/redirect;
   * the user lands back on /auth/callback where the session is exchanged.
   */
  const signInWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Request offline access from Google so the refresh token is issued
          ...(provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {}),
        },
      },
    })
    if (error) throw new Error(error.message)
    // After this call the browser redirects — no further client code runs
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    sessionStorage.removeItem('iou_session_only')
    if (error) throw new Error(error.message)
  }

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw new Error(error.message)
  }

  /** Resends the signup confirmation email for an unconfirmed account. */
  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }

  /**
   * Re-authenticates the current user by signing in with their email + the
   * supplied password. Throws with a user-facing message if the password is wrong.
   */
  const verifyPassword = async (currentPassword: string) => {
    const email = user?.email
    if (!email) throw new Error('No authenticated user')
    const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (error) {
      throw new Error('Current password is incorrect')
    }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
    setIsRecoverySession(false)
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, isAuthenticated: !!user, isRecoverySession,
      signUp, signIn, signInWithOAuth, signOut, sendPasswordReset, resendConfirmation, verifyPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

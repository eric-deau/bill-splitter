import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { Provider } from '@supabase/supabase-js'

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password'

export function AuthPage() {
  const { mode } = useParams<{ mode: string }>()
  const authMode = (mode as AuthMode) ?? 'login'
  const { signIn, signUp, signInWithOAuth, sendPasswordReset, updatePassword, isAuthenticated, isRecoverySession } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)
  const [resetSent, setResetSent] = useState(false)

  // If Supabase fired PASSWORD_RECOVERY, redirect to reset page
  useEffect(() => {
    if (isRecoverySession && authMode !== 'reset-password') {
      navigate('/auth/reset-password', { replace: true })
    }
  }, [isRecoverySession, authMode, navigate])

  // If already logged in (and not in a recovery flow), bounce to dashboard
  useEffect(() => {
    if (isAuthenticated && !isRecoverySession && authMode === 'login') {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isRecoverySession, authMode, navigate])

  const clearError = (field: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    const errs: Record<string, string> = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email'
    if (!password || password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await signIn(email, password, rememberMe)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign in failed')
    } finally { setSubmitting(false) }
  }

  const handleSignUp = async () => {
    const errs: Record<string, string> = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email'
    if (!password || password.length < 6) errs.password = 'At least 6 characters required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await signUp(email, password)
      toast.success('Account created! Check your email to confirm.')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign up failed')
    } finally { setSubmitting(false) }
  }

  const handleForgotPassword = async () => {
    const errs: Record<string, string> = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await sendPasswordReset(email)
      setResetSent(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send reset email')
    } finally { setSubmitting(false) }
  }

  const handleResetPassword = async () => {
    const errs: Record<string, string> = {}
    if (!password || password.length < 6) errs.password = 'At least 6 characters required'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await updatePassword(password)
      toast.success('Password updated! You are now signed in.')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update password')
    } finally { setSubmitting(false) }
  }

  const handleOAuth = async (provider: Provider) => {
    setOauthLoading(provider)
    try {
      await signInWithOAuth(provider)
      // Browser will redirect — this line only runs if the call somehow fails silently
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${provider} sign-in failed`)
      setOauthLoading(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-sm mx-auto py-8 space-y-6">

      {/* ── Login ── */}
      {authMode === 'login' && (
        <>
          <AuthHeader
            title="Welcome back"
            subtitle="Sign in to access your receipts."
          />
          <Card>
            <div className="space-y-4">
              <OAuthButtons onOAuth={handleOAuth} loading={oauthLoading} />
              <Divider label="or continue with email" />
              <FormField label="Email" htmlFor="auth-email">
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email') }}
                  error={errors.email}
                  autoFocus
                />
              </FormField>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-ink-600 font-body tracking-wide">Password</label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-sage-600 hover:text-sage-700 font-body underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                  error={errors.password}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-ink-200 text-sage-600 focus:ring-sage-500"
                />
                <span className="text-sm text-ink-600 font-body">Remember me</span>
              </label>

              <Button variant="primary" className="w-full" loading={submitting} onClick={handleLogin}>
                Sign in
              </Button>
            </div>
          </Card>
          <AuthFooter
            prompt="No account yet?"
            linkLabel="Sign up free"
            linkTo="/auth/signup"
          />
        </>
      )}

      {/* ── Sign up ── */}
      {authMode === 'signup' && (
        <>
          <AuthHeader
            title="Create an account"
            subtitle="Save receipts forever and manage them in one place."
          />
          <Card>
            <div className="space-y-4">
              <OAuthButtons onOAuth={handleOAuth} loading={oauthLoading} />
              <Divider label="or sign up with email" />
              <FormField label="Email" htmlFor="auth-email">
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email') }}
                  error={errors.email}
                  autoFocus
                />
              </FormField>
              <FormField label="Password" htmlFor="auth-password">
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                  error={errors.password}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                />
              </FormField>
              <Button variant="primary" className="w-full" loading={submitting} onClick={handleSignUp}>
                Create account
              </Button>
            </div>
          </Card>
          <AuthFooter
            prompt="Already have an account?"
            linkLabel="Sign in"
            linkTo="/auth/login"
          />
        </>
      )}

      {/* ── Forgot password ── */}
      {authMode === 'forgot-password' && (
        <>
          <AuthHeader
            title="Reset your password"
            subtitle="Enter your email and we'll send you a reset link."
          />
          {resetSent ? (
            <Card>
              <div className="text-center space-y-3 py-2">
                <div className="size-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✉️
                </div>
                <p className="font-body text-sm text-ink-800 font-medium">Check your inbox</p>
                <p className="font-body text-xs text-ink-500">
                  We sent a password reset link to <strong>{email}</strong>. Click it to set a new password.
                </p>
                <p className="font-body text-xs text-ink-400">
                  Didn't get it? Check your spam folder or{' '}
                  <button
                    onClick={() => setResetSent(false)}
                    className="text-sage-600 underline underline-offset-2"
                  >
                    try again
                  </button>.
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="space-y-4">
                <FormField label="Email" htmlFor="reset-email">
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError('email') }}
                    error={errors.email}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                  />
                </FormField>
                <Button variant="primary" className="w-full" loading={submitting} onClick={handleForgotPassword}>
                  Send reset link
                </Button>
              </div>
            </Card>
          )}
          <AuthFooter prompt="Remember it?" linkLabel="Back to sign in" linkTo="/auth/login" />
        </>
      )}

      {/* ── Reset password (arrived via email link) ── */}
      {authMode === 'reset-password' && (
        <>
          <AuthHeader
            title="Set a new password"
            subtitle="Choose a strong password for your account."
          />
          <Card>
            <div className="space-y-4">
              <FormField label="New password" htmlFor="new-password">
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                  error={errors.password}
                  autoFocus
                />
              </FormField>
              <FormField label="Confirm password" htmlFor="confirm-password">
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Same password again"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
                  error={errors.confirmPassword}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
              </FormField>

              {/* Strength hint */}
              {password.length > 0 && (
                <PasswordStrength password={password} />
              )}

              <Button variant="primary" className="w-full" loading={submitting} onClick={handleResetPassword}>
                Set new password
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-1">
      <h1 className="font-display text-3xl text-ink-900">{title}</h1>
      <p className="text-sm text-ink-500 font-body">{subtitle}</p>
    </div>
  )
}

function AuthFooter({ prompt, linkLabel, linkTo }: { prompt: string; linkLabel: string; linkTo: string }) {
  return (
    <p className="text-center text-sm text-ink-500 font-body">
      {prompt}{' '}
      <Link to={linkTo} className="text-sage-700 underline underline-offset-2 hover:text-sage-600">
        {linkLabel}
      </Link>
    </p>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '6+ characters', pass: password.length >= 6 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][score - 1] ?? 'Weak'
  const strengthColor = ['bg-rose-400', 'bg-amber-400', 'bg-sage-400', 'bg-sage-600'][score - 1] ?? 'bg-rose-400'

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('flex-1 h-1 rounded-full transition-all', i < score ? strengthColor : 'bg-ink-100')}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map((c) => (
            <span key={c.label} className={cn('text-xs font-body', c.pass ? 'text-sage-600' : 'text-ink-300')}>
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        <span className={cn('text-xs font-medium font-body', score >= 3 ? 'text-sage-600' : 'text-ink-400')}>
          {strengthLabel}
        </span>
      </div>
    </div>
  )
}

// ─── OAuth buttons ────────────────────────────────────────────────────────────

const OAUTH_PROVIDERS: { provider: Provider; label: string; icon: React.ReactNode }[] = [
  {
    provider: 'google',
    label: 'Google',
    icon: <GoogleIcon />,
  },
]

function OAuthButtons({
  onOAuth,
  loading,
}: {
  onOAuth: (provider: Provider) => void
  loading: Provider | null
}) {
  return (
    <div className="grid">
      {OAUTH_PROVIDERS.map(({ provider, label, icon }) => (
        <button
          key={provider}
          onClick={() => onOAuth(provider)}
          disabled={loading !== null}
          className={cn(
            'flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-body font-medium',
            'border-ink-200 bg-white text-ink-800 transition-all',
            'hover:bg-cream-50 hover:border-ink-300',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500'
          )}
        >
          {loading === provider ? (
            <span className="size-4 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
          ) : (
            <span className="size-4 shrink-0">{icon}</span>
          )}
          {label}
        </button>
      ))}
    </div>
  )
}

function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-ink-100" />
      <span className="text-xs text-ink-400 font-body whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-ink-100" />
    </div>
  )
}

// ─── Provider SVG icons ───────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-full">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

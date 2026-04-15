import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password'

export function AuthPage() {
  const { mode } = useParams<{ mode: string }>()
  const authMode = (mode as AuthMode) ?? 'login'
  const { signIn, signUp, sendPasswordReset, updatePassword, isAuthenticated, isRecoverySession } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
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

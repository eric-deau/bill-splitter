import { useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'

export function AuthPage() {
  const { mode } = useParams<{ mode: 'login' | 'signup' }>()
  const isSignUp = mode === 'signup'
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs: typeof errors = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Enter a valid email'
    if (!password || password.length < 6)
      errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        toast.success('Account created! Check your email to confirm.')
        navigate('/dashboard')
      } else {
        await signIn(email, password)
        toast.success('Welcome back!')
        navigate('/dashboard')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto py-8 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="font-display text-3xl text-ink-900">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-ink-500 font-body">
          {isSignUp
            ? 'Save receipts forever and manage them in one place.'
            : 'Sign in to access your receipts.'}
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <FormField label="Email" htmlFor="auth-email">
            <Input
              id="auth-email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
              error={errors.email}
              autoFocus
            />
          </FormField>

          <FormField label="Password" htmlFor="auth-password">
            <Input
              id="auth-password"
              type="password"
              placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
              error={errors.password}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </FormField>

          <Button
            variant="primary"
            className="w-full mt-2"
            loading={submitting}
            onClick={handleSubmit}
          >
            {isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </div>
      </Card>

      <p className="text-center text-sm text-ink-500 font-body">
        {isSignUp ? 'Already have an account? ' : 'No account yet? '}
        <Link
          to={isSignUp ? '/auth/login' : '/auth/signup'}
          className="text-sage-700 underline underline-offset-2 hover:text-sage-600"
        >
          {isSignUp ? 'Sign in' : 'Sign up free'}
        </Link>
      </p>
    </div>
  )
}

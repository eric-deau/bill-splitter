import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Card, CardSection } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export function AccountSettingsPage() {
  const { user, isAuthenticated, loading, signOut, updatePassword } = useAuth()
  const navigate = useNavigate()

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/auth/login')
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-7 border-2 border-ink-200 border-t-ink-700 rounded-full animate-spin" />
      </div>
    )
  }

  const clearPwError = (field: string) =>
    setPwErrors((prev) => { const next = { ...prev }; delete next[field]; return next })

  const handleChangePassword = async () => {
    const errs: Record<string, string> = {}
    if (!newPassword || newPassword.length < 6) errs.newPassword = 'At least 6 characters required'
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    setPwSubmitting(true)
    setPwSuccess(false)
    try {
      // Supabase updateUser doesn't require the current password client-side —
      // the active session acts as the credential. For extra security you could
      // re-authenticate first via signInWithPassword before calling updateUser.
      await updatePassword(newPassword)
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwErrors({})
      toast.success('Password updated successfully')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update password')
    } finally {
      setPwSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const passwordScore = (() => {
    const checks = [
      newPassword.length >= 6,
      /[A-Z]/.test(newPassword),
      /[0-9]/.test(newPassword),
      /[^A-Za-z0-9]/.test(newPassword),
    ]
    return checks.filter(Boolean).length
  })()

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl text-ink-900">Account settings</h1>
        <p className="text-sm text-ink-500 font-body mt-1">Manage your account and security preferences.</p>
      </div>

      {/* Account info */}
      <Card>
        <h2 className="font-display text-lg text-ink-900 mb-4">Account</h2>
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-sage-100 flex items-center justify-center text-xl font-medium text-sage-700 font-body shrink-0">
            {user?.email?.[0].toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-body font-medium text-ink-900">{user?.email}</p>
            <p className="text-xs text-ink-400 font-body mt-0.5">
              Member since{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="font-display text-lg text-ink-900 mb-1">Change password</h2>
        <p className="text-sm text-ink-500 font-body mb-5">
          Choose a strong password. You'll stay signed in on this device.
        </p>

        <div className="space-y-4">
          <FormField label="New password" htmlFor="new-pw">
            <Input
              id="new-pw"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); clearPwError('newPassword'); setPwSuccess(false) }}
              error={pwErrors.newPassword}
            />
          </FormField>

          {/* Strength meter */}
          {newPassword.length > 0 && (
            <div className="space-y-2 -mt-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => {
                  const colors = ['bg-rose-400', 'bg-amber-400', 'bg-sage-400', 'bg-sage-600']
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-1 rounded-full transition-all duration-200',
                        i < passwordScore ? colors[passwordScore - 1] : 'bg-ink-100'
                      )}
                    />
                  )
                })}
              </div>
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: '6+ chars', pass: newPassword.length >= 6 },
                  { label: 'Uppercase', pass: /[A-Z]/.test(newPassword) },
                  { label: 'Number', pass: /[0-9]/.test(newPassword) },
                  { label: 'Symbol', pass: /[^A-Za-z0-9]/.test(newPassword) },
                ].map((c) => (
                  <span key={c.label} className={cn('text-xs font-body', c.pass ? 'text-sage-600' : 'text-ink-300')}>
                    {c.pass ? '✓' : '○'} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <FormField label="Confirm new password" htmlFor="confirm-pw">
            <Input
              id="confirm-pw"
              type="password"
              placeholder="Same password again"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearPwError('confirmPassword'); setPwSuccess(false) }}
              error={pwErrors.confirmPassword}
              onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
            />
          </FormField>

          {pwSuccess && (
            <div className="flex items-center gap-2 text-sm text-sage-700 font-body bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 animate-fade-in">
              <span className="size-4 bg-sage-200 rounded-full flex items-center justify-center text-xs text-sage-700 shrink-0">✓</span>
              Password updated successfully
            </div>
          )}

          <Button
            variant="primary"
            loading={pwSubmitting}
            onClick={handleChangePassword}
          >
            Update password
          </Button>
        </div>
      </Card>

      {/* Session info */}
      <Card>
        <h2 className="font-display text-lg text-ink-900 mb-1">Session</h2>
        <p className="text-sm text-ink-500 font-body mb-4">
          Your session is saved in this browser. Signing out clears it.
        </p>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </Card>
    </div>
  )
}

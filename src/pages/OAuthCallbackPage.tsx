import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    async function exchange() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        toast.error(errorDescription ?? 'OAuth sign-in was cancelled or failed')
        navigate('/auth/login', { replace: true })
        return
      }

      if (!code) {
        toast.error('Missing OAuth code')
        navigate('/auth/login', { replace: true })
        return
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        toast.error(exchangeError.message)
        navigate('/auth/login', { replace: true })
        return
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        toast.error('OAuth completed, but no app session was established')
        navigate('/auth/login', { replace: true })
        return
      }

      toast.success('Signed in!')
      navigate('/dashboard', { replace: true })
    }

    void exchange()
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="size-10 border-2 border-ink-200 border-t-sage-600 rounded-full animate-spin" />
      <p className="text-sm text-ink-400 font-body">Completing sign-in…</p>
    </div>
  )
}
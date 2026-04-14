import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { createReceipt } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { cn, formatCurrency } from '@/lib/utils'
import type { CreateReceiptForm as FormType } from '@/types'

const EMPTY_FORM: FormType = {
  name: '',
  total: '',
  tax: '',
  tip: '',
  etransfer_email: '',
  etransfer_note: '',
  people_count: '2',
  host_name: '',
  save_account: false,
}

interface FieldErrors {
  name?: string
  total?: string
  etransfer_email?: string
  host_name?: string
  people_count?: string
}

function validate(form: FormType): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = 'Receipt name is required'
  const total = parseFloat(form.total)
  if (!form.total || isNaN(total) || total <= 0)
    errors.total = 'Enter a valid total greater than $0'
  if (!form.etransfer_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.etransfer_email))
    errors.etransfer_email = 'Enter a valid email address'
  if (!form.host_name.trim()) errors.host_name = 'Your name is required'
  const people = parseInt(form.people_count)
  if (!form.people_count || isNaN(people) || people < 1 || people > 50)
    errors.people_count = 'Enter a number between 1 and 50'
  return errors
}

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS = ['Receipt details', 'Your info', 'Review'] as const
type Step = 0 | 1 | 2

export function CreateReceiptForm() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormType>({
    ...EMPTY_FORM,
    etransfer_email: user?.email ?? '',
    host_name: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [step, setStep] = useState<Step>(0)
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof FormType) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const total = parseFloat(form.total) || 0
  const tax = parseFloat(form.tax) || 0
  const tip = parseFloat(form.tip) || 0
  const grandTotal = total + tax + tip
  const people = parseInt(form.people_count) || 1
  const evenSplit = grandTotal / people

  const goNext = () => {
    const allErrors = validate(form)
    if (step === 0) {
      const stepErrors: FieldErrors = {}
      if (allErrors.name) stepErrors.name = allErrors.name
      if (allErrors.total) stepErrors.total = allErrors.total
      if (allErrors.people_count) stepErrors.people_count = allErrors.people_count
      if (Object.keys(stepErrors).length) { setErrors(stepErrors); return }
    }
    if (step === 1) {
      const stepErrors: FieldErrors = {}
      if (allErrors.etransfer_email) stepErrors.etransfer_email = allErrors.etransfer_email
      if (allErrors.host_name) stepErrors.host_name = allErrors.host_name
      if (Object.keys(stepErrors).length) { setErrors(stepErrors); return }
    }
    setStep((s) => Math.min(s + 1, 2) as Step)
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 0) as Step)

  const handleSubmit = async () => {
    const allErrors = validate(form)
    if (Object.keys(allErrors).length) { setErrors(allErrors); return }
    setSubmitting(true)
    try {
      const receipt = await createReceipt(
        { ...form, total: String(grandTotal) },
        isAuthenticated ? (user?.id ?? null) : null
      )
      toast.success('Receipt created!')
      navigate(`/r/${receipt.slug}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create receipt')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Step bar */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => i < step && setStep(i as Step)}
              className={cn(
                'flex items-center gap-2 text-xs font-body font-medium transition-colors',
                i < step && 'cursor-pointer',
                i === step ? 'text-ink-900' : i < step ? 'text-sage-600' : 'text-ink-300'
              )}
              disabled={i >= step}
            >
              <span
                className={cn(
                  'size-5 rounded-full flex items-center justify-center text-xs shrink-0 transition-all',
                  i === step
                    ? 'bg-ink-900 text-white'
                    : i < step
                    ? 'bg-sage-600 text-white'
                    : 'bg-ink-100 text-ink-400'
                )}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-2', i < step ? 'bg-sage-300' : 'bg-ink-100')} />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* ── Step 0: Receipt details ── */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="font-display text-xl text-ink-900 mb-1">Receipt details</h2>
              <p className="text-sm text-ink-500">What's the occasion, and how much was the bill?</p>
            </div>

            <FormField label="Receipt name" htmlFor="name">
              <Input
                id="name"
                placeholder="Dinner at Miku, Taylor's birthday, etc."
                value={form.name}
                onChange={set('name')}
                error={errors.name}
              />
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <FormField label="Subtotal" htmlFor="total">
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    prefix="$"
                    value={form.total}
                    onChange={set('total')}
                    error={errors.total}
                  />
                </FormField>
              </div>
              <FormField label="Tax" htmlFor="tax" optional>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  prefix="$"
                  value={form.tax}
                  onChange={set('tax')}
                />
              </FormField>
              <FormField label="Tip" htmlFor="tip" optional>
                <Input
                  id="tip"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  prefix="$"
                  value={form.tip}
                  onChange={set('tip')}
                />
              </FormField>
              <div className="flex flex-col justify-end pb-0.5">
                <p className="text-xs text-ink-400 font-body mb-1.5">Grand total</p>
                <p className="text-sm font-medium text-ink-900 font-mono bg-cream-100 rounded-xl px-3 py-2.5 border border-ink-100">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>

            <FormField
              label="Number of people"
              htmlFor="people_count"
              hint={
                grandTotal > 0 && people > 0
                  ? `Even split: ${formatCurrency(evenSplit)} per person`
                  : undefined
              }
            >
              <Input
                id="people_count"
                type="number"
                min="1"
                max="50"
                step="1"
                placeholder="2"
                value={form.people_count}
                onChange={set('people_count')}
                error={errors.people_count}
              />
            </FormField>
          </div>
        )}

        {/* ── Step 1: Host info ── */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="font-display text-xl text-ink-900 mb-1">Your info</h2>
              <p className="text-sm text-ink-500">
                Guests will see your e-transfer email to send you payment.
              </p>
            </div>

            <FormField label="Your name" htmlFor="host_name">
              <Input
                id="host_name"
                placeholder="Alex"
                value={form.host_name}
                onChange={set('host_name')}
                error={errors.host_name}
                autoFocus
              />
            </FormField>

            <FormField
              label="E-transfer email"
              htmlFor="etransfer_email"
              hint="Shown to guests so they know where to send money"
            >
              <Input
                id="etransfer_email"
                type="email"
                placeholder="you@email.com"
                value={form.etransfer_email}
                onChange={set('etransfer_email')}
                error={errors.etransfer_email}
              />
            </FormField>

            <FormField label="E-transfer note" htmlFor="etransfer_note" optional>
              <Input
                id="etransfer_note"
                placeholder="e.g. 'Miku dinner July 12'"
                value={form.etransfer_note}
                onChange={set('etransfer_note')}
              />
            </FormField>

            {/* Guest upsell */}
            {!isAuthenticated && (
              <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-sage-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sage-700 text-sm">🔒</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-800 font-body">
                      Save this receipt permanently
                    </p>
                    <p className="text-xs text-sage-600 mt-0.5">
                      Guest receipts expire in 24 hours. Create a free account to keep your receipts forever and manage them in one place.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.save_account}
                    onChange={set('save_account')}
                    className="size-4 rounded border-ink-200 text-sage-600 focus:ring-sage-500"
                  />
                  <span className="text-sm text-sage-700 font-body">
                    Create a free account after this
                  </span>
                </label>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-2 text-xs text-sage-600 font-body">
                <span className="size-4 bg-sage-200 rounded-full flex items-center justify-center text-sage-700">✓</span>
                Signed in as {user?.email} — receipt saved to your account
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="font-display text-xl text-ink-900 mb-1">Review & create</h2>
              <p className="text-sm text-ink-500">Everything look right?</p>
            </div>

            <div className="space-y-3">
              <ReviewRow label="Receipt" value={form.name} />
              <ReviewRow label="Subtotal" value={formatCurrency(parseFloat(form.total) || 0)} />
              {tax > 0 && <ReviewRow label="Tax" value={formatCurrency(tax)} />}
              {tip > 0 && <ReviewRow label="Tip" value={formatCurrency(tip)} />}
              <ReviewRow
                label="Grand total"
                value={formatCurrency(grandTotal)}
                highlight
              />
              <ReviewRow label="Splitting between" value={`${people} people`} />
              <ReviewRow label="Even split" value={formatCurrency(evenSplit) + ' / person'} />
              <div className="border-t border-ink-100 pt-3 mt-1 space-y-3">
                <ReviewRow label="Host" value={form.host_name} />
                <ReviewRow label="E-transfer" value={form.etransfer_email} />
                {form.etransfer_note && (
                  <ReviewRow label="Note" value={form.etransfer_note} />
                )}
              </div>
              <div className="border-t border-ink-100 pt-3 mt-1">
                <ReviewRow
                  label="Expires"
                  value={isAuthenticated ? 'Never (saved to account)' : 'In 24 hours (guest)'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className={cn('flex gap-3 mt-8', step === 0 ? 'justify-end' : 'justify-between')}>
          {step > 0 && (
            <Button variant="secondary" onClick={goBack}>
              ← Back
            </Button>
          )}
          {step < 2 ? (
            <Button variant="primary" onClick={goNext}>
              Continue →
            </Button>
          ) : (
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              Create receipt
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-ink-500 font-body shrink-0">{label}</span>
      <span
        className={cn(
          'text-sm font-body text-right',
          highlight ? 'font-medium text-ink-900 text-base' : 'text-ink-800'
        )}
      >
        {value}
      </span>
    </div>
  )
}

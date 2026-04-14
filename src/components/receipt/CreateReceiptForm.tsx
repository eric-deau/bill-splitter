import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { createReceipt } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { cn, formatCurrency } from '@/lib/utils'
import type { CreateReceiptForm as FormType, TaxTipType } from '@/types'

const EMPTY_FORM: FormType = {
  name: '',
  total: '',
  tax: '',
  tax_type: 'flat',
  tip: '',
  tip_type: 'flat',
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

const STEPS = ['Receipt details', 'Your info', 'Review'] as const
type Step = 0 | 1 | 2

// ─── Tax/Tip type toggle pill ─────────────────────────────────────────────────

function TypeToggle({
  value,
  onChange,
}: {
  value: TaxTipType
  onChange: (v: TaxTipType) => void
}) {
  return (
    <div className="flex items-center bg-ink-100 rounded-lg p-0.5 gap-0.5 shrink-0">
      {(['flat', 'percent'] as TaxTipType[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            'px-2 py-1 rounded-md text-xs font-body font-medium transition-all',
            value === t
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          )}
        >
          {t === 'flat' ? '$' : '%'}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateReceiptForm() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormType>({
    ...EMPTY_FORM,
    etransfer_email: user?.email ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [step, setStep] = useState<Step>(0)
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof FormType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const setType = (field: 'tax_type' | 'tip_type') => (v: TaxTipType) => {
    setForm((prev) => ({ ...prev, [field]: v }))
  }

  // Live computed values
  const subtotal = parseFloat(form.total) || 0
  const taxRaw = parseFloat(form.tax) || 0
  const tipRaw = parseFloat(form.tip) || 0
  const taxFlat = form.tax_type === 'percent' ? (taxRaw / 100) * subtotal : taxRaw
  const tipFlat = form.tip_type === 'percent' ? (tipRaw / 100) * subtotal : tipRaw
  const grandTotal = subtotal + taxFlat + tipFlat
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
      const receipt = await createReceipt(form, isAuthenticated ? (user?.id ?? null) : null)
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
              <span className={cn(
                'size-5 rounded-full flex items-center justify-center text-xs shrink-0 transition-all',
                i === step ? 'bg-ink-900 text-white'
                : i < step ? 'bg-sage-600 text-white'
                : 'bg-ink-100 text-ink-400'
              )}>
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

            {/* Subtotal */}
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

            {/* Tax row: input + type toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-ink-600 font-body tracking-wide">
                  Tax <span className="text-ink-300 font-normal">(optional)</span>
                </label>
                <TypeToggle value={form.tax_type} onChange={setType('tax_type')} />
              </div>
              <div className="relative">
                {form.tax_type === 'flat' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-body text-sm pointer-events-none">$</span>
                )}
                <input
                  id="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={form.tax_type === 'percent' ? '0.0' : '0.00'}
                  value={form.tax}
                  onChange={set('tax')}
                  className={cn(
                    'w-full font-body text-sm text-ink-900 bg-white border border-ink-100 rounded-xl py-2.5',
                    'placeholder:text-ink-300 transition-all focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500',
                    'hover:border-ink-200',
                    form.tax_type === 'flat' ? 'pl-7 pr-3' : 'pl-3 pr-7'
                  )}
                />
                {form.tax_type === 'percent' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 font-body text-sm pointer-events-none">%</span>
                )}
              </div>
              {form.tax_type === 'percent' && taxRaw > 0 && subtotal > 0 && (
                <p className="mt-1.5 text-xs text-ink-400 font-body">
                  = {formatCurrency(taxFlat)}
                </p>
              )}
            </div>

            {/* Tip row: input + type toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-ink-600 font-body tracking-wide">
                  Tip <span className="text-ink-300 font-normal">(optional)</span>
                </label>
                <TypeToggle value={form.tip_type} onChange={setType('tip_type')} />
              </div>
              <div className="relative">
                {form.tip_type === 'flat' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-body text-sm pointer-events-none">$</span>
                )}
                <input
                  id="tip"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={form.tip_type === 'percent' ? '0.0' : '0.00'}
                  value={form.tip}
                  onChange={set('tip')}
                  className={cn(
                    'w-full font-body text-sm text-ink-900 bg-white border border-ink-100 rounded-xl py-2.5',
                    'placeholder:text-ink-300 transition-all focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500',
                    'hover:border-ink-200',
                    form.tip_type === 'flat' ? 'pl-7 pr-3' : 'pl-3 pr-7'
                  )}
                />
                {form.tip_type === 'percent' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 font-body text-sm pointer-events-none">%</span>
                )}
              </div>
              {form.tip_type === 'percent' && tipRaw > 0 && subtotal > 0 && (
                <p className="mt-1.5 text-xs text-ink-400 font-body">
                  = {formatCurrency(tipFlat)}
                </p>
              )}
            </div>

            {/* Grand total breakdown */}
            {grandTotal > 0 && (
              <div className="bg-cream-100 border border-ink-100 rounded-xl px-4 py-3 space-y-1.5">
                {subtotal > 0 && (
                  <div className="flex justify-between text-xs font-body text-ink-500">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                )}
                {taxFlat > 0 && (
                  <div className="flex justify-between text-xs font-body text-ink-500">
                    <span>Tax{form.tax_type === 'percent' && taxRaw > 0 ? ` (${taxRaw}%)` : ''}</span>
                    <span className="font-mono">{formatCurrency(taxFlat)}</span>
                  </div>
                )}
                {tipFlat > 0 && (
                  <div className="flex justify-between text-xs font-body text-ink-500">
                    <span>Tip{form.tip_type === 'percent' && tipRaw > 0 ? ` (${tipRaw}%)` : ''}</span>
                    <span className="font-mono">{formatCurrency(tipFlat)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-body font-medium text-ink-900 border-t border-ink-200 pt-1.5 mt-1">
                  <span>Grand total</span>
                  <span className="font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            )}

            <FormField
              label="Number of people"
              htmlFor="people_count"
              hint={grandTotal > 0 && people > 0
                ? `Even split: ${formatCurrency(evenSplit)} per person`
                : undefined}
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

            {!isAuthenticated && (
              <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-sage-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sage-700 text-sm">🔒</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-800 font-body">Save this receipt permanently</p>
                    <p className="text-xs text-sage-600 mt-0.5">
                      Guest receipts expire in 24 hours. Create a free account to keep your receipts forever.
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
                  <span className="text-sm text-sage-700 font-body">Create a free account after this</span>
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
              <ReviewRow label="Subtotal" value={formatCurrency(subtotal)} />
              {taxFlat > 0 && (
                <ReviewRow
                  label={`Tax${form.tax_type === 'percent' ? ` (${taxRaw}%)` : ''}`}
                  value={formatCurrency(taxFlat)}
                />
              )}
              {tipFlat > 0 && (
                <ReviewRow
                  label={`Tip${form.tip_type === 'percent' ? ` (${tipRaw}%)` : ''}`}
                  value={formatCurrency(tipFlat)}
                />
              )}
              <ReviewRow label="Grand total" value={formatCurrency(grandTotal)} highlight />
              <ReviewRow label="Splitting between" value={`${people} people`} />
              <ReviewRow label="Even split" value={`${formatCurrency(evenSplit)} / person`} />
              <div className="border-t border-ink-100 pt-3 mt-1 space-y-3">
                <ReviewRow label="Host" value={form.host_name} />
                <ReviewRow label="E-transfer" value={form.etransfer_email} />
                {form.etransfer_note && <ReviewRow label="Note" value={form.etransfer_note} />}
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

        {/* Footer */}
        <div className={cn('flex gap-3 mt-8', step === 0 ? 'justify-end' : 'justify-between')}>
          {step > 0 && <Button variant="secondary" onClick={goBack}>← Back</Button>}
          {step < 2 ? (
            <Button variant="primary" onClick={goNext}>Continue →</Button>
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

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-ink-500 font-body shrink-0">{label}</span>
      <span className={cn(
        'text-sm font-body text-right',
        highlight ? 'font-medium text-ink-900 text-base' : 'text-ink-800'
      )}>
        {value}
      </span>
    </div>
  )
}

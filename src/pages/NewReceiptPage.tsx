import { CreateReceiptForm } from '@/components/receipt/CreateReceiptForm'

export function NewReceiptPage() {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-md mx-auto">
        <h1 className="font-display text-3xl text-ink-900 mb-2">New receipt</h1>
        <p className="text-sm text-ink-500 font-body">
          Fill in the details below — you'll get a shareable link at the end.
        </p>
      </div>
      <CreateReceiptForm />
    </div>
  )
}

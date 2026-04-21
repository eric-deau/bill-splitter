import { useEffect, useState, useCallback } from 'react'
import { getReceiptBySlug, subscribeToReceipt } from '@/lib/api'
import type { ReceiptSummary } from '@/types'

interface UseReceiptResult {
  data: ReceiptSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useReceipt(slug: string | undefined): UseReceiptResult {
  const [data, setData] = useState<ReceiptSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!slug) return
    try {
      const result = await getReceiptBySlug(slug)
      if (!result) {
        setError('Receipt not found.')
      } else if (result.receipt.status === 'expired') {
        setError('This receipt has expired. Guest receipts are only available for 24 hours.')
      } else {
        setData(result)
        setError(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    setLoading(true)
    fetch()
  }, [fetch])

  // Realtime: re-fetch whenever anything changes on this receipt
  useEffect(() => {
    if (!data?.receipt.id) return
    const unsubscribe = subscribeToReceipt(data.receipt.id, fetch)
    // useEffect cleanup must be synchronous — fire the async unsubscribe without awaiting
    return () => { unsubscribe() }
  }, [data?.receipt.id, fetch])

  return { data, loading, error, refetch: fetch }
}

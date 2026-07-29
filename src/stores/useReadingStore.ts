import { useReading, type ReadingItem, type ReadingStatus } from '@/providers/reading-provider'

export type { ReadingItem, ReadingStatus }

export default function useReadingStore() {
  return useReading()
}

import MobileOnlyGuard from '@/components/MobileOnlyGuard'
import InternRankingContent from './InternRankingContent'

export const dynamic = 'force-dynamic'

export default function InternRankingPage() {
  return (
    <MobileOnlyGuard>
      <InternRankingContent />
    </MobileOnlyGuard>
  )
}

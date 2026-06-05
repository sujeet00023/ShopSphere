import { Suspense } from 'react'
import AdvancedSearch from './SearchContent'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdvancedSearch />
    </Suspense>
  )
}
import { deprecatedRoute } from '@/lib/deprecated-route'

export async function POST() {
  return deprecatedRoute('push.subscribe')
}

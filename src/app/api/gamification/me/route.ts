import { deprecatedRoute } from '@/lib/deprecated-route'

export async function GET() {
  return deprecatedRoute('gamification.me')
}

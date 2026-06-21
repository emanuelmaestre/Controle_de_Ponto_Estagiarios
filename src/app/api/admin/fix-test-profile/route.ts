import { deprecatedRoute } from '@/lib/deprecated-route'

export async function POST() {
  return deprecatedRoute('admin.fix-test-profile')
}

import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/infra/supabase/server'
import { createContainer } from '@/infra/container'
import { handleError, ok } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { fullName, email, password, course } = body

  if (!fullName || !email || !password) {
    return handleError(new Error('Nome, email e senha sao obrigatorios'))
  }

  const serverClient = await createSupabaseServerClient()
  const container = createContainer(serverClient)

  try {
    const user = await container.registerUseCase().execute({
      fullName,
      email,
      password,
      course,
    })
    return ok({ userId: user.id })
  } catch (error) {
    return handleError(error)
  }
}

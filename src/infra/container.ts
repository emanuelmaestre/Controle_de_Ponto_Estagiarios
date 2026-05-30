import { createSupabaseServiceClient } from '@/infra/supabase/server'
import { SupabaseUserRepository } from '@/infra/repositories/SupabaseUserRepository'
import { SupabaseTimeRecordRepository } from '@/infra/repositories/SupabaseTimeRecordRepository'
import { SupabaseActivityRepository } from '@/infra/repositories/SupabaseActivityRepository'
import { SupabaseSettingsRepository } from '@/infra/repositories/SupabaseSettingsRepository'
import { SupabaseAuthService } from '@/infra/services/SupabaseAuthService'
import { RegisterUseCase } from '@/application/use-cases/auth/RegisterUseCase'
import { LogoutUseCase } from '@/application/use-cases/auth/LogoutUseCase'
import { ClockInUseCase } from '@/application/use-cases/time-record/ClockInUseCase'
import { ClockOutUseCase } from '@/application/use-cases/time-record/ClockOutUseCase'
import { ListRecordsUseCase } from '@/application/use-cases/time-record/ListRecordsUseCase'
import { CreateInternUseCase } from '@/application/use-cases/intern/CreateInternUseCase'
import { ListInternsUseCase } from '@/application/use-cases/intern/ListInternsUseCase'
import { ToggleInternActiveUseCase } from '@/application/use-cases/intern/ToggleInternActiveUseCase'
import { GetMonthlyReportUseCase } from '@/application/use-cases/report/GetMonthlyReportUseCase'
import { UpdateProfileUseCase } from '@/application/use-cases/intern/UpdateProfileUseCase'
import { GetRankingUseCase } from '@/application/use-cases/report/GetRankingUseCase'
import type { SupabaseClient } from '@supabase/supabase-js'

function makeRepos(supabase: SupabaseClient) {
  return {
    user: new SupabaseUserRepository(supabase),
    record: new SupabaseTimeRecordRepository(supabase),
    activity: new SupabaseActivityRepository(supabase),
    settings: new SupabaseSettingsRepository(supabase),
  }
}

function makeAuth(serverClient: SupabaseClient, serviceClient: SupabaseClient) {
  return new SupabaseAuthService(serverClient, serviceClient)
}

export function createContainer(serverClient: SupabaseClient) {
  const serviceClient = createSupabaseServiceClient()
  const repos = makeRepos(serviceClient)
  const auth = makeAuth(serverClient, serviceClient)

  return {
    registerUseCase: () => new RegisterUseCase(auth, repos.user),
    logoutUseCase: () => new LogoutUseCase(auth),
    clockInUseCase: () => new ClockInUseCase(repos.user, repos.record),
    clockOutUseCase: () => new ClockOutUseCase(repos.record, repos.activity),
    listRecordsUseCase: () => new ListRecordsUseCase(repos.record, repos.activity),
    createInternUseCase: () => new CreateInternUseCase(auth, repos.user),
    listInternsUseCase: () => new ListInternsUseCase(repos.user),
    toggleInternActiveUseCase: () => new ToggleInternActiveUseCase(repos.user),
    getMonthlyReportUseCase: () => new GetMonthlyReportUseCase(repos.user, repos.record, repos.activity),
    updateProfileUseCase: () => new UpdateProfileUseCase(repos.user),
    getRankingUseCase: () => new GetRankingUseCase(repos.user, repos.record),
    repos,
    auth,
  }
}

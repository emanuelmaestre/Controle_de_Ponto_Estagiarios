import { z } from 'zod'

// ──────────────────────────────────────────────────────────
// Schema: Login por e-mail + senha
// ──────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .min(1, 'E-mail obrigatório'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
})
export type LoginInput = z.infer<typeof loginSchema>

// ──────────────────────────────────────────────────────────
// Schema: Login por PIN
// ──────────────────────────────────────────────────────────
export const pinLoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  pin: z
    .string()
    .min(4, 'PIN deve ter 4-6 dígitos')
    .max(6, 'PIN deve ter 4-6 dígitos')
    .regex(/^\d+$/, 'PIN deve conter apenas números'),
})
export type PinLoginInput = z.infer<typeof pinLoginSchema>

// ──────────────────────────────────────────────────────────
// Schema: Criar/editar estagiário
// ──────────────────────────────────────────────────────────
const internBase = z.object({
  full_name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  nickname: z.string().max(50).optional(),
  email: z.string().email('E-mail inválido'),
  course: z.string().max(100, 'Curso muito longo').optional(),
  internship_start: z.string().optional(),
  internship_end: z.string().optional(),
  is_active: z.boolean(),
})

export const internSchema = internBase.refine(
  (data) => {
    if (data.internship_start && data.internship_end) {
      return new Date(data.internship_end) >= new Date(data.internship_start)
    }
    return true
  },
  {
    message: 'Data de término deve ser após a data de início',
    path: ['internship_end'],
  },
)
export type InternInput = z.infer<typeof internSchema>

// ──────────────────────────────────────────────────────────
// Schema: Registrar saída + atividades
// ──────────────────────────────────────────────────────────
export const clockOutSchema = z.object({
  activities: z
    .array(z.string().min(3, 'Descrição muito curta').max(200, 'Descrição muito longa'))
    .min(1, 'Informe ao menos uma atividade realizada'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
})
export type ClockOutInput = z.infer<typeof clockOutSchema>

// ──────────────────────────────────────────────────────────
// Schema: Reprovar registro
// ──────────────────────────────────────────────────────────
export const rejectSchema = z.object({
  rejection_reason: z
    .string()
    .min(10, 'Justificativa deve ter no mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
})
export type RejectInput = z.infer<typeof rejectSchema>

// ──────────────────────────────────────────────────────────
// Schema: Configurações
// ──────────────────────────────────────────────────────────
export const settingsSchema = z.object({
  reminder_in_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato inválido (HH:MM)')
    .transform(v => v.slice(0, 5)),
  reminder_out_after_hours: z
    .number()
    .int()
    .min(1, 'Mínimo 1 hora')
    .max(12, 'Máximo 12 horas'),
  expected_daily_hours: z
    .number()
    .int()
    .min(1, 'Mínimo 1 hora')
    .max(12, 'Máximo 12 horas'),
  lab_name: z.string().min(2, 'Informe o nome do laboratório'),
  report_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})
export type SettingsInput = z.infer<typeof settingsSchema>

// ──────────────────────────────────────────────────────────
// Schema: Alterar PIN
// ──────────────────────────────────────────────────────────
export const changePinSchema = z
  .object({
    new_pin: z
      .string()
      .min(4, 'PIN deve ter 4-6 dígitos')
      .max(6, 'PIN deve ter 4-6 dígitos')
      .regex(/^\d+$/, 'PIN deve conter apenas números'),
    confirm_pin: z.string(),
  })
  .refine((d) => d.new_pin === d.confirm_pin, {
    message: 'PINs não conferem',
    path: ['confirm_pin'],
  })
export type ChangePinInput = z.infer<typeof changePinSchema>

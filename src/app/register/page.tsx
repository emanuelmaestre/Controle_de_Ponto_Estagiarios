'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, User, Mail, Lock, CheckCircle2, ArrowRight, Loader2, AlertCircle, Tag } from 'lucide-react'
import CourseSelect from '@/components/ui/CourseSelect'
import SelfieGate from '@/components/SelfieGate'

// ── Floating particle ────────────────────────────────
function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, bottom: '-10px', width: size, height: size, background: 'rgba(0,200,83,0.25)' }}
      animate={{ y: [0, -600], opacity: [0, 0.8, 0] }}
      transition={{ duration: 8 + Math.random() * 6, repeat: Infinity, delay, ease: 'linear' }}
    />
  )
}

// ── Animated Chronos Lab illustration ───────────────
function ChronosIllustration() {
  return (
    <motion.div className="relative flex flex-col items-center justify-center" style={{ width: 280, height: 280 }}>

      {/* Pulse rings */}
      {[280, 240, 200].map((size, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: size, height: size, border: `1px solid rgba(0,200,83,${0.08 + i * 0.04})` }}
          animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* Rotating dashed ring */}
      <motion.svg className="absolute" width="220" height="220" viewBox="0 0 220 220"
        animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(0,200,83,0.15)"
          strokeWidth="1" strokeDasharray="6 10" />
      </motion.svg>

      {/* Counter-rotating dashed ring */}
      <motion.svg className="absolute" width="180" height="180" viewBox="0 0 180 180"
        animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
        <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(0,200,83,0.10)"
          strokeWidth="1" strokeDasharray="3 14" />
      </motion.svg>

      {/* Main stopwatch — logo fiel */}
      <motion.div className="relative flex items-center justify-center"
        style={{ width: 140, height: 140, zIndex: 10 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>

        {/* Glow behind */}
        <div className="absolute rounded-full" style={{
          width: 110, height: 110, top: 15,
          background: 'radial-gradient(circle, rgba(0,200,83,0.18) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }} />

        <svg width="140" height="140" viewBox="0 0 180 180" fill="none">
          {/* Body */}
          <circle cx="90" cy="105" r="52" fill="rgba(0,200,83,0.05)" stroke="#00c853" strokeWidth="5"/>
          {/* Tick marks */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => {
            const r1 = 46, r2 = i % 3 === 0 ? 38 : 42
            const rad = (a - 90) * Math.PI / 180
            return <line key={a}
              x1={90 + r1 * Math.cos(rad)} y1={105 + r1 * Math.sin(rad)}
              x2={90 + r2 * Math.cos(rad)} y2={105 + r2 * Math.sin(rad)}
              stroke={i % 3 === 0 ? '#3fe56c' : 'rgba(0,200,83,0.35)'} strokeWidth={i % 3 === 0 ? 2.5 : 1.5} strokeLinecap="round"/>
          })}
          {/* Crown/top button */}
          <rect x="74" y="30" width="32" height="12" rx="6" fill="#00c853"/>
          <line x1="90" y1="42" x2="90" y2="53" stroke="#00c853" strokeWidth="6" strokeLinecap="round"/>
          {/* Side buttons */}
          <line x1="38" y1="65" x2="50" y2="77" stroke="#00c853" strokeWidth="4.5" strokeLinecap="round"/>
          <line x1="142" y1="65" x2="130" y2="77" stroke="#00c853" strokeWidth="4.5" strokeLinecap="round"/>
          {/* Minutes hand */}
          <motion.line x1="90" y1="105" x2="115" y2="87"
            stroke="rgba(0,200,83,0.6)" strokeWidth="3" strokeLinecap="round"
            animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '90px 105px' }} />
          {/* Seconds hand */}
          <motion.line x1="90" y1="105" x2="90" y2="65"
            stroke="#3fe56c" strokeWidth="4" strokeLinecap="round"
            animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '90px 105px' }} />
          {/* Center dot */}
          <circle cx="90" cy="105" r="5" fill="#00c853"/>
          <circle cx="90" cy="105" r="2.5" fill="#3fe56c"/>
        </svg>
      </motion.div>

      {/* Logo text below */}
      <motion.div className="flex flex-col items-center mt-3" style={{ zIndex: 10 }}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1, color: '#3fe56c' }}>
          Chronos <span style={{ color: '#C0392B' }}>Lab</span>
        </p>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(0,200,83,0.4)', marginTop: 3 }}>
          CONTROLE DE PONTO
        </p>
      </motion.div>

      {/* Orbiting dots on outer ring */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const r = 128
        const rad = ((deg - 90) * Math.PI) / 180
        return (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: 5, height: 5, background: '#00c853', top: '50%', left: '50%', marginTop: -2.5, marginLeft: -2.5 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
            initial={{ x: Math.cos(rad) * r, y: Math.sin(rad) * r }}
          />
        )
      })}
    </motion.div>
  )
}

// ── Step progress ────────────────────────────────────
const STEPS = ['Pessoal', 'Acesso', 'Foto']

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mt-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={i <= step ? { scale: 1, background: '#00c853' } : { scale: 0.8, background: 'rgba(0,200,83,0.2)' }}
            className="rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ width: 24, height: 24, color: i <= step ? '#003912' : 'rgba(0,200,83,0.5)' }}
          >
            {i < step ? <CheckCircle2 size={14} /> : i + 1}
          </motion.div>
          <span className="text-[11px] font-semibold" style={{ color: i <= step ? '#3fe56c' : 'rgba(0,200,83,0.3)' }}>{label}</span>
          {i < STEPS.length - 1 && (
            <motion.div
              className="rounded-full"
              style={{ width: 24, height: 2, background: i < step ? '#00c853' : 'rgba(0,200,83,0.15)' }}
              animate={{ scaleX: i < step ? 1 : 0.4 }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Input field ──────────────────────────────────────
function Field({ label, icon, error, children }: { label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,200,83,0.5)' }}>
          {icon}
        </span>
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-xs mt-1 flex items-center gap-1" style={{ color: '#ff5252' }}>
            <AlertCircle size={10} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const inputCls = "w-full pl-10 pr-4 py-2.5 rounded-xl font-medium outline-none transition-all"
const inputStyle = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(0,200,83,0.18)',
  color: '#d4e8d5',
  fontSize: '16px',
}

function RegisterContent() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [newUserId, setNewUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', nickname: '', email: '', course: '', password: '', confirm: '' })

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  // ── Validação em tempo real ──────────────────────────
  const nameHint = (() => {
    const v = form.full_name.trim()
    if (!v) return null
    const words = v.split(' ').filter(Boolean)
    if (words.length < 2) return '💡 Informe nome e sobrenome — ex: "Maria Silva"'
    if (words.some(w => w.length < 2)) return '💡 Cada parte do nome deve ter ao menos 2 letras'
    return null
  })()

  const emailHint = (() => {
    const v = form.email.trim()
    if (!v) return null
    if (!v.includes('@')) return '💡 Falta o @ no e-mail — ex: "nome@gmail.com"'
    const [local, domain] = v.split('@')
    if (!local) return '💡 Coloque algo antes do @ — ex: "nome@gmail.com"'
    if (!domain) return '💡 Coloque o domínio após o @ — ex: "@gmail.com"'
    if (!domain.includes('.')) return '💡 Domínio incompleto — ex: "@gmail.com"'
    if (domain.endsWith('.')) return '💡 E-mail incompleto — ex: "@gmail.com"'
    return null
  })()

  const nextStep = () => {
    if (!form.full_name.trim())
      return setError('Nome completo é obrigatório.')
    if (form.full_name.trim().split(' ').filter(Boolean).length < 2)
      return setError('Informe o nome completo (nome e sobrenome).')
    if (!form.email.trim() || !form.email.includes('@') || !form.email.includes('.'))
      return setError('Informe um e-mail válido.')
    if (!form.course)
      return setError('Selecione o curso de graduação.')
    setError(null)
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.')
    if (form.password !== form.confirm) return setError('As senhas não coincidem.')
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          nickname: form.nickname.trim() || null,
          email: form.email.trim().toLowerCase(),
          course: form.course || null,
          password: form.password,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao criar conta.'); return }
      // Vai para step de foto obrigatória
      setNewUserId(json.userId)
      setStep(2)
    } catch { setError('Erro de conexão.') } finally { setLoading(false) }
  }

  const passwordOk = form.confirm.length > 0 && form.password === form.confirm && form.password.length >= 6

  // ── Step 2: Foto obrigatória (após conta criada) ────
  if (step === 2 && newUserId) return (
    <div className="w-full">
      <div className="text-center mb-4">
        <p className="text-xs font-bold tracking-widest" style={{ color: 'rgba(63,229,108,0.6)' }}>
          PASSO 3 DE 3
        </p>
        <h2 className="text-lg font-black mt-1" style={{ color: 'white' }}>
          Foto de identificação
        </h2>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Obrigatória para concluir o cadastro
        </p>
      </div>
      <SelfieGate
        hasPhoto={false}
        internId={newUserId}
        onComplete={() => setSuccess(true)}
      />
      {/* After SelfieGate closes (hasPhoto becomes true), redirect to login */}
    </div>
  )

  // ── Success screen ──────────────────────────────────
  if (success) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center px-6 py-12 rounded-3xl max-w-sm mx-auto"
      style={{ background: 'rgba(15,35,24,0.95)', border: '1px solid rgba(0,200,83,0.25)' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(0,200,83,0.15)', border: '2px solid #00c853' }}
      >
        <CheckCircle2 size={40} style={{ color: '#00c853' }} />
      </motion.div>
      {[0,1,2,3,4,5,6,7].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: 6 + i, height: 6 + i, background: `hsl(${130 + i * 10}, 80%, 55%)` }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300, opacity: 0, scale: 0 }}
          transition={{ duration: 1.2, delay: 0.3 + i * 0.05 }}
        />
      ))}
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="text-2xl font-black mb-2" style={{ color: '#3fe56c' }}>
        Conta criada!
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Bem-vindo ao Chronos Lab. Seu acesso está pronto.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full">
        <Link href="/login"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm"
          style={{ background: '#00c853', color: '#003912' }}>
          Fazer login <ArrowRight size={16} />
        </Link>
      </motion.div>
    </motion.div>
  )

  return (
    <form onSubmit={step === 0 ? (e) => { e.preventDefault(); nextStep() } : handleSubmit} className="w-full">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div key="err"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: 'rgba(255,82,82,0.10)', border: '1px solid rgba(255,82,82,0.25)', color: '#ff5252' }}>
            <AlertCircle size={14} className="flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div key="step0"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-3">
            <Field label="Nome Completo *" icon={<User size={15} />}>
              <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Ex: Maria Silva" required className={inputCls}
                style={{ ...inputStyle, borderColor: nameHint ? 'rgba(255,191,0,0.45)' : 'rgba(0,200,83,0.18)' }}
                onFocus={e => (e.target.style.borderColor = nameHint ? 'rgba(255,191,0,0.6)' : '#3fe56c')}
                onBlur={e => (e.target.style.borderColor = nameHint ? 'rgba(255,191,0,0.45)' : 'rgba(0,200,83,0.18)')} />
            </Field>
            <AnimatePresence>
              {nameHint && (
                <motion.p key="nameHint" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[11px] -mt-2 px-1" style={{ color: '#ffbf00' }}>
                  {nameHint}
                </motion.p>
              )}
            </AnimatePresence>
            <Field label="Apelido (opcional)" icon={<Tag size={15} />}>
              <input type="text" value={form.nickname} onChange={e => set('nickname', e.target.value)}
                placeholder="Como te chamam" className={inputCls} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#3fe56c')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,200,83,0.18)')} />
            </Field>
            <Field label="E-mail *" icon={<Mail size={15} />}>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="ex: nome@gmail.com"
                required
                className={inputCls}
                style={{
                  ...inputStyle,
                  borderColor: emailHint ? 'rgba(255,191,0,0.45)' : 'rgba(0,200,83,0.18)',
                  caretColor: '#3fe56c',
                }}
                onFocus={e => (e.target.style.borderColor = emailHint ? 'rgba(255,191,0,0.6)' : '#3fe56c')}
                onBlur={e => (e.target.style.borderColor = emailHint ? 'rgba(255,191,0,0.45)' : 'rgba(0,200,83,0.18)')}
              />
            </Field>
            <AnimatePresence>
              {emailHint && (
                <motion.p key="emailHint" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[11px] -mt-2 px-1" style={{ color: '#ffbf00' }}>
                  {emailHint}
                </motion.p>
              )}
            </AnimatePresence>
            <div>
              <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
                CURSO DE GRADUAÇÃO *
              </label>
              <CourseSelect value={form.course} onChange={v => set('course', v)} />
              {!form.course && (
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,82,82,0.7)' }}>
                  Selecione seu curso para continuar
                </p>
              )}
            </div>
            <motion.button type="submit"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              disabled={!form.full_name.trim() || !form.email.trim() || !form.course}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#00c853', color: '#003912' }}>
              Continuar <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-4">
            <Field label="Senha *" icon={<Lock size={15} />}>
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Mínimo 6 caracteres" required className={`${inputCls} pr-11`} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#3fe56c')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,200,83,0.18)')} />
              <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'rgba(0,200,83,0.5)' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </Field>
            <Field label="Confirmar Senha *" icon={<Lock size={15} />}
              error={form.confirm && form.password !== form.confirm ? 'As senhas não coincidem' : undefined}>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="Repita a senha" required className={inputCls} style={{
                  ...inputStyle,
                  borderColor: passwordOk ? '#00c853' : form.confirm && form.password !== form.confirm ? '#ff5252' : 'rgba(0,200,83,0.18)'
                }}
                onFocus={e => { if (!passwordOk && !(form.confirm && form.password !== form.confirm)) e.target.style.borderColor = '#3fe56c' }}
                onBlur={e => { if (!passwordOk && !(form.confirm && form.password !== form.confirm)) e.target.style.borderColor = 'rgba(0,200,83,0.18)' }} />
              {passwordOk && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#00c853' }}>
                  <CheckCircle2 size={15} />
                </motion.span>
              )}
            </Field>

            {/* Força da senha */}
            {form.password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                <div className="flex gap-1">
                  {[0,1,2,3].map(i => (
                    <motion.div key={i} className="flex-1 h-1 rounded-full"
                      animate={{ background: form.password.length >= [1,4,7,10][i] ? ['#ff5252','#ffbf00','#00c853','#3fe56c'][Math.min(3, Math.floor((form.password.length - 1) / 3))] : 'rgba(255,255,255,0.08)' }}
                      transition={{ duration: 0.3 }} />
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {form.password.length < 4 ? 'Fraca' : form.password.length < 7 ? 'Média' : form.password.length < 10 ? 'Boa' : 'Forte'}
                </p>
              </motion.div>
            )}

            <div className="flex gap-3 mt-2">
              <motion.button type="button" onClick={() => { setStep(0); setError(null) }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm"
                style={{ border: '1px solid rgba(0,200,83,0.20)', color: 'rgba(255,255,255,0.4)', background: 'transparent' }}>
                Voltar
              </motion.button>
              <motion.button type="submit" disabled={loading || !passwordOk}
                whileTap={{ scale: 0.97 }} whileHover={!loading && passwordOk ? { scale: 1.01 } : {}}
                className="flex-2 flex-grow py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#00c853', color: '#003912' }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Criando...</> : <> Criar conta <CheckCircle2 size={15} /></>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StepDots step={step} />
    </form>
  )
}

// ── Main page ────────────────────────────────────────
export default function RegisterPage() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    delay: i * 0.7,
    x: 5 + (i * 5.5) % 90,
    size: 4 + (i % 4) * 3,
  }))

  return (
    <div className="min-h-dvh flex" style={{ background: '#07170c', overflowX: 'hidden', maxWidth: '100vw' }}>

      {/* ── LEFT PANEL (desktop only) ─────────────────── */}
      <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0"
        style={{ width: '45%', background: 'linear-gradient(160deg, #07170c 0%, #0a2010 50%, #071a0c 100%)', borderRight: '1px solid rgba(0,200,83,0.10)' }}>

        {/* Particles */}
        {particles.map((p, i) => <Particle key={i} {...p} />)}

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,200,83,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,83,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,200,83,0.06) 0%, transparent 70%)'
        }} />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-8">
            <p className="text-3xl font-black tracking-tight" style={{ color: '#3fe56c' }}>
              Chronos <span style={{ color: '#C0392B' }}>Lab</span>
            </p>
            <p className="text-[11px] font-bold tracking-[0.25em] mt-1" style={{ color: 'rgba(0,200,83,0.4)' }}>
              CONTROLE DE PONTO
            </p>
          </motion.div>

          {/* Illustration */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
            <ChronosIllustration />
          </motion.div>

          {/* Text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 space-y-3">
            <h2 className="text-2xl font-black leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Bem-vindo ao<br />
              <span style={{ color: '#3fe56c' }}>laboratório</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 280 }}>
              Crie sua conta para registrar presenças, acompanhar suas horas e manter seu histórico em dia.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-2 mt-8">
            {['Registro de ponto', 'Histórico completo', 'Notificações', 'Seguro'].map((f, i) => (
              <motion.span key={f}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.1 }}
                className="px-3 py-1 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.15)', color: '#3fe56c' }}>
                ✦ {f}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 py-6 sm:py-8 lg:py-12" style={{ minWidth: 0, maxWidth: '100vw', overflowX: 'hidden' }}>

        {/* Mobile background */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,200,83,0.08) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(63,229,108,0.05) 0%, transparent 70%)' }} />
          {particles.slice(0, 8).map((p, i) => <Particle key={i} {...p} />)}
        </div>

        <div className="relative z-10 w-full" style={{ maxWidth: 420 }}>

          {/* Mobile logo */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="lg:hidden text-center mb-8">
            <p className="text-2xl font-black" style={{ color: '#3fe56c' }}>
              Chronos <span style={{ color: '#C0392B' }}>Lab</span>
            </p>
            <p className="text-[10px] tracking-[0.25em] font-bold mt-0.5" style={{ color: 'rgba(0,200,83,0.4)' }}>CONTROLE DE PONTO</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl"
            style={{ background: 'rgba(15,35,24,0.95)', border: '1px solid rgba(0,200,83,0.15)', backdropFilter: 'blur(20px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,83,0.05)' }}
          >
            {/* Card header */}
            <div className="px-5 sm:px-8 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,200,83,0.08)' }}>
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.25)' }}>
                <User size={22} style={{ color: '#3fe56c' }} />
              </motion.div>
              <h1 className="text-xl font-black" style={{ color: 'white' }}>Criar conta</h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Preencha os dados para se cadastrar
              </p>
            </div>

            {/* Form — px menor no mobile para caber na tela */}
            <div className="px-5 sm:px-8 py-4">
              <Suspense fallback={
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin" style={{ color: '#00c853' }} />
                </div>
              }>
                <RegisterContent />
              </Suspense>
            </div>
          </motion.div>

          {/* Login link */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Já tem conta?{' '}
            <Link href="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: '#3fe56c' }}>
              Fazer login →
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  )
}

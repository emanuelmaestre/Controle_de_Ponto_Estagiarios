'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { rejectSchema, type RejectInput } from '@/lib/validations'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Props {
  recordId: string
  approverId: string
}

export default function ApprovalActions({ recordId, approverId }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } =
    useForm<RejectInput>({ resolver: zodResolver(rejectSchema) })

  const handleApprove = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('time_records')
      .update({
        status: 'approved' as const,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', recordId)

    if (error) {
      setError('Erro ao aprovar. Tente novamente.')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const handleReject = async (data: RejectInput) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('time_records')
      .update({
        status: 'rejected' as const,
        rejection_reason: data.rejection_reason.trim(),
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', recordId)

    if (error) {
      setError('Erro ao reprovar. Tente novamente.')
    } else {
      reset()
      setShowRejectModal(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="text-red-600 text-sm mb-2"
          >{error}</motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button
          onClick={handleApprove}
          disabled={loading}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Aprovar
        </motion.button>
        <motion.button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-sm border border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <XCircle size={14} /> Reprovar
        </motion.button>
      </div>

      {/* Modal de reprovação */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h3 className="font-bold text-gray-800 text-lg mb-1">Reprovar registro</h3>
              <p className="text-sm text-gray-500 mb-4">
                Informe o motivo da reprovação. O estagiário será notificado.
              </p>
              <form onSubmit={handleSubmit(handleReject)} className="space-y-4">
                <div>
                  <textarea
                    {...register('rejection_reason')}
                    rows={3}
                    placeholder="Ex: Horário registrado não confere com o período de expediente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                  {errors.rejection_reason && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >{errors.rejection_reason.message}</motion.p>
                  )}
                </div>
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => { setShowRejectModal(false); reset() }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Reprovando...</> : 'Confirmar reprovação'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

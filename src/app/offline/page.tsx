'use client'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Sem conexão</h1>
      <p className="text-gray-500 mb-6 max-w-sm">
        Você está offline. Verifique sua conexão com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}

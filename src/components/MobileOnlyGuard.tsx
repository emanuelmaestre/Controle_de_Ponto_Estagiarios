// ⚠️ Restrição de dispositivo DESATIVADA — acesso liberado em qualquer dispositivo.
// O componente é mantido como wrapper para facilitar reativar o bloqueio no futuro,
// caso necessário, sem ter que reimportar em todas as páginas.

interface Props {
  children: React.ReactNode
}

export default function MobileOnlyGuard({ children }: Props) {
  return <>{children}</>
}

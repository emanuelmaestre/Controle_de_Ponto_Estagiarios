// E-mails isentos da verificação de localização (GPS).
// O registro de ponto desses usuários é aceito sem checar a distância do laboratório,
// e o app nem solicita a localização no navegador para eles.
export const GEO_EXEMPT_EMAILS = ['emanuelmaestree@gmail.com']

export function isGeoExemptEmail(email: string | null | undefined): boolean {
  return GEO_EXEMPT_EMAILS.includes((email ?? '').toLowerCase())
}

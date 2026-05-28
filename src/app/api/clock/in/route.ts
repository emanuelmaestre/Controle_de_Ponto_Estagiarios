import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Haversine formula — distance between two GPS coords in meters
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { geo_lat, geo_lng, geo_accuracy, geo_status: clientStatus, user_agent } = body as {
      geo_lat?: number
      geo_lng?: number
      geo_accuracy?: number
      geo_status?: string
      user_agent?: string
    }

    // Usuários isentos de verificação de localização (temporário)
    const GEO_EXEMPT_EMAILS = ['emanuelmaestree@gmail.com']
    const isGeoExempt = GEO_EXEMPT_EMAILS.includes(user.email ?? '')

    // Get profile (role + name)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const isManager = profile.role === 'manager'

    // Get geo settings
    const { data: settings } = await supabase
      .from('settings')
      .select('geo_enabled, geo_lat, geo_lng, geo_radius_meters')
      .single()

    const geoEnabled = settings?.geo_enabled ?? false

    // ── Manager, geo disabled, ou usuário isento ────────
    if (!geoEnabled || isManager || isGeoExempt) {
      const { data: record, error } = await supabase
        .from('time_records')
        .insert({
          intern_id: user.id,
          clock_in: new Date().toISOString(),
          geo_lat: geo_lat ?? null,
          geo_lng: geo_lng ?? null,
          geo_accuracy: geo_accuracy ?? null,
          geo_status: isManager ? 'admin_exempt' : isGeoExempt ? 'user_exempt' : 'geo_disabled',
          geo_blocked: false,
        })
        .select('id, clock_in')
        .single()

      if (error) {
        if (error.message.includes('aberto')) {
          return NextResponse.json({ error: 'Você já tem uma entrada em aberto.' }, { status: 409 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        record,
        geo_status: isManager ? 'admin_exempt' : isGeoExempt ? 'user_exempt' : 'geo_disabled',
      })
    }

    // ── Geo enabled + intern ─────────────────────────────

    // No geo data or geo unavailable
    if (!geo_lat || !geo_lng || clientStatus !== 'available') {
      await supabase.from('location_attempts').insert({
        user_id: user.id,
        user_name: profile.full_name,
        action_type: 'clock_in',
        geo_lat: geo_lat ?? null,
        geo_lng: geo_lng ?? null,
        geo_accuracy: geo_accuracy ?? null,
        geo_distance: null,
        geo_status: clientStatus ?? 'unavailable',
        block_reason:
          clientStatus === 'permission_denied'
            ? 'Permissão de localização negada pelo usuário'
            : clientStatus === 'timeout'
            ? 'Tempo esgotado ao obter localização'
            : 'GPS indisponível ou desativado',
        user_agent: user_agent ?? null,
      })

      return NextResponse.json({
        success: false,
        blocked: true,
        geo_status: clientStatus ?? 'unavailable',
      })
    }

    // Calculate distance from lab
    const labLat = settings?.geo_lat ?? -17.485672
    const labLng = settings?.geo_lng ?? -48.2130547
    const radius = settings?.geo_radius_meters ?? 150
    const distance = haversine(geo_lat, geo_lng, labLat, labLng)
    const distanceRounded = Math.round(distance)

    // ── Blocked: outside radius ──────────────────────────
    if (distance > radius) {
      await supabase.from('location_attempts').insert({
        user_id: user.id,
        user_name: profile.full_name,
        action_type: 'clock_in',
        geo_lat,
        geo_lng,
        geo_accuracy: geo_accuracy ?? null,
        geo_distance: distanceRounded,
        geo_status: 'blocked',
        block_reason: `Fora da área permitida — ${distanceRounded}m do laboratório (máximo ${radius}m)`,
        user_agent: user_agent ?? null,
      })

      return NextResponse.json({
        success: false,
        blocked: true,
        geo_status: 'blocked',
        distance: distanceRounded,
        radius,
      })
    }

    // ── Approved ─────────────────────────────────────────
    const { data: record, error } = await supabase
      .from('time_records')
      .insert({
        intern_id: user.id,
        clock_in: new Date().toISOString(),
        geo_lat,
        geo_lng,
        geo_accuracy: geo_accuracy ?? null,
        geo_distance: distanceRounded,
        geo_status: 'approved',
        geo_blocked: false,
      })
      .select('id, clock_in')
      .single()

    if (error) {
      if (error.message.includes('aberto')) {
        return NextResponse.json({ error: 'Você já tem uma entrada em aberto.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      record,
      geo_status: 'approved',
      distance: distanceRounded,
    })
  } catch (err) {
    console.error('[clock/in]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  try {
    if (!supabaseUrl) {
      throw new Error('Supabase URL configuration is missing')
    }

    // Ping the Supabase Realtime service gateway
    const healthUrl = `${supabaseUrl}/realtime/v1/health`
    const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' })

    // For managed Cloud instances, a 200, 401, or 403 response indicates the gateway is operational and reachable
    const isOperational = res.status === 200 || res.status === 401 || res.status === 403

    if (!isOperational) {
      throw new Error(`Realtime gateway returned operational failure code: ${res.status}`)
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'realtime',
      statusCode: res.status,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('❌ Realtime Health Check Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'realtime',
        error: err.message || 'Realtime gateway connection timed out',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

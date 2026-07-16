import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()
  const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:5001'

  try {
    const res = await fetch(`${expressUrl}/health`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Express health endpoint returned HTTP ${res.status}`)
    }
    const health = await res.json()

    return NextResponse.json({
      status: 'healthy',
      service: 'database',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      express: health
    })
  } catch (err: any) {
    console.error('❌ Database Health Check Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'database',
        error: err.message || 'Database health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

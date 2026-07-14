import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const start = Date.now()
  const { origin } = new URL(request.url)

  try {
    const endpoints = [
      `${origin}/api/database-health`,
      `${origin}/api/storage-health`,
      `${origin}/api/realtime-health`,
    ]

    // Fetch individual health reports concurrently
    const results = await Promise.all(
      endpoints.map((url) =>
        fetch(url, { method: 'GET', cache: 'no-store' })
          .then(async (res) => {
            const body = await res.json().catch(() => ({}))
            return {
              service: url.split('/').pop()?.replace('-health', ''),
              ok: res.ok,
              status: body,
            }
          })
          .catch((err) => ({
            service: url.split('/').pop()?.replace('-health', ''),
            ok: false,
            status: { status: 'unhealthy', error: err.message },
          }))
      )
    )

    const allHealthy = results.every((r) => r.ok)

    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
        services: results.reduce((acc: Record<string, any>, curr) => {
          acc[curr.service!] = curr.status
          return acc
        }, {}),
        timestamp: new Date().toISOString(),
      },
      { status: allHealthy ? 200 : 500 }
    )
  } catch (err: any) {
    console.error('❌ Unified Health Check Aggregator Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: err.message || 'Unified health check aggregation failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

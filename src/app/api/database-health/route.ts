import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createClient()
  const start = Date.now()

  try {
    // Run a fast, lightweight query to check Postgres connectivity
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) {
      throw error
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'database',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('❌ Database Health Check Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'database',
        error: err.message || 'Database query execution failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

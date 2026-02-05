import { NextRequest, NextResponse } from 'next/server'

// In-memory schedule storage (use database in production)
const schedules = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, interval, niche } = body

    if (enabled && !niche) {
      return NextResponse.json(
        { error: 'Niche is required when enabling autopilot' },
        { status: 400 }
      )
    }

    const scheduleId = `schedule_${Date.now()}`

    schedules.set(scheduleId, {
      id: scheduleId,
      enabled,
      interval: interval || 'daily',
      niche,
      createdAt: new Date().toISOString(),
      nextRun: calculateNextRun(interval),
    })

    // In production, set up cron job or scheduled task
    // For example, use Vercel Cron Jobs or external scheduler

    return NextResponse.json({
      message: enabled
        ? `Autopilot enabled for ${niche} (${interval})`
        : 'Autopilot disabled',
      scheduleId,
      nextRun: calculateNextRun(interval),
    })
  } catch (error: any) {
    console.error('Error in schedule-autopilot:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const allSchedules = Array.from(schedules.values())
    return NextResponse.json({ schedules: allSchedules })
  } catch (error: any) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateNextRun(interval: string): string {
  const now = new Date()

  switch (interval) {
    case 'hourly':
      now.setHours(now.getHours() + 1)
      break
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    default:
      now.setDate(now.getDate() + 1)
  }

  return now.toISOString()
}

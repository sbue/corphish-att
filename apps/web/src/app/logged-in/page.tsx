import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@corphish/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@corphish/ui/components/card'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

function percentOf(value: number, goal: number) {
  if (goal <= 0) return 0
  return clampPercent(Math.round((value / goal) * 100))
}

function ProgressBar({ percent }: { percent: number }) {
  const pct = clampPercent(percent)

  return (
    <div className='h-2 w-full overflow-hidden rounded-full bg-muted/60'>
      <div
        className='h-full rounded-full bg-gradient-to-r from-emerald-300/90 via-sky-300/90 to-indigo-400/90 transition-[width]'
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default async function LoggedInPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/')
  }

  async function handleSignOut() {
    'use server'

    await signOut({ redirectTo: '/' })
  }

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const sleepHours = 7.6
  const sleepGoal = 8
  const steps = 11284
  const stepsGoal = 10000
  const hydrationLiters = 2.2
  const hydrationGoal = 3
  const didWorkout = true
  const workoutType = 'Strength'
  const workoutMinutes = 48
  const focusMinutes = 190
  const focusGoal = 240

  return (
    <div className='dark'>
      <main className='relative min-h-screen overflow-hidden bg-background text-foreground'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(123,242,192,0.08),transparent_35%),radial-gradient(circle_at_90%_5%,rgba(95,151,255,0.15),transparent_35%),radial-gradient(circle_at_70%_100%,rgba(138,100,255,0.14),transparent_40%)]' />
        <div className='pointer-events-none absolute inset-0 opacity-30 [background:linear-gradient(to_bottom,rgba(134,180,255,0.08)_1px,transparent_1px)] [background-size:100%_4px]' />

        <div className='relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-8'>
          <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
            <div className='space-y-1'>
              <p className='text-xs tracking-[0.32em] text-muted-foreground'>PRIVATE DASHBOARD</p>
              <h1 className='text-3xl font-semibold text-foreground sm:text-4xl'>Metrics</h1>
              <p className='text-sm text-muted-foreground'>
                {dateLabel} · Signed in as <span className='font-medium text-foreground'>{session.user.email}</span>
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button asChild variant='outline'>
                <Link href='/'>Back to terminal</Link>
              </Button>
              <form action={handleSignOut}>
                <Button type='submit' variant='secondary'>
                  Sign out
                </Button>
              </form>
            </div>
          </header>

          <section className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>Sleep</CardTitle>
                <CardDescription>Hours slept last night</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-baseline justify-between'>
                  <p className='text-3xl font-semibold'>{sleepHours.toFixed(1)}h</p>
                  <p className='text-sm text-muted-foreground'>Goal {sleepGoal.toFixed(0)}h</p>
                </div>
                <ProgressBar percent={percentOf(sleepHours, sleepGoal)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workout</CardTitle>
                <CardDescription>Did I train today?</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      didWorkout ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200',
                    ].join(' ')}
                  >
                    {didWorkout ? 'Yes' : 'No'}
                  </span>
                  <p className='text-sm text-muted-foreground'>
                    {didWorkout ? `${workoutType} · ${workoutMinutes} min` : 'Rest day'}
                  </p>
                </div>
                <p className='text-sm text-muted-foreground'>
                  This is placeholder data. Soon: real tracking and trends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steps</CardTitle>
                <CardDescription>Walking and movement</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-baseline justify-between'>
                  <p className='text-3xl font-semibold'>{formatNumber(steps)}</p>
                  <p className='text-sm text-muted-foreground'>Goal {formatNumber(stepsGoal)}</p>
                </div>
                <ProgressBar percent={percentOf(steps, stepsGoal)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hydration</CardTitle>
                <CardDescription>Water intake</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-baseline justify-between'>
                  <p className='text-3xl font-semibold'>{hydrationLiters.toFixed(1)}L</p>
                  <p className='text-sm text-muted-foreground'>Goal {hydrationGoal.toFixed(0)}L</p>
                </div>
                <ProgressBar percent={percentOf(hydrationLiters, hydrationGoal)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Focus</CardTitle>
                <CardDescription>Deep work minutes</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-baseline justify-between'>
                  <p className='text-3xl font-semibold'>{focusMinutes}m</p>
                  <p className='text-sm text-muted-foreground'>Goal {focusGoal}m</p>
                </div>
                <ProgressBar percent={percentOf(focusMinutes, focusGoal)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>What I’m optimizing this week</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm text-muted-foreground'>
                <p>1. Consistent sleep schedule.</p>
                <p>2. Daily Zone 2 walk.</p>
                <p>3. Less caffeine after noon.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

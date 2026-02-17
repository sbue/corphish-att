import { NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginRequestBody = {
  email?: unknown
}

export async function POST(request: Request) {
  let body: LoginRequestBody

  try {
    body = (await request.json()) as LoginRequestBody
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid request body.',
      },
      {
        status: 400,
      },
    )
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      {
        error: 'Please provide a valid email address.',
      },
      {
        status: 400,
      },
    )
  }

  try {
    await signIn('resend', {
      email,
      redirect: false,
      redirectTo: '/logged-in',
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to request passwordless login email', error)

    return NextResponse.json(
      {
        error: 'Could not send magic link. Check Auth.js and Resend configuration.',
      },
      {
        status: 500,
      },
    )
  }
}

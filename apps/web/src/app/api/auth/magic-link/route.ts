import { NextResponse } from 'next/server'
import { TRPCError } from '@trpc/server'
import { requestPasswordlessLogin } from '@/lib/trpc/server'

type LoginRequestBody = {
  email?: unknown
}

function statusForTrpcError(error: TRPCError) {
  switch (error.code) {
    case 'BAD_REQUEST':
      return 400
    case 'UNAUTHORIZED':
      return 401
    case 'FORBIDDEN':
      return 403
    default:
      return 500
  }
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

  const email = typeof body.email === 'string' ? body.email : ''

  try {
    await requestPasswordlessLogin(email)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: statusForTrpcError(error),
        },
      )
    }

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

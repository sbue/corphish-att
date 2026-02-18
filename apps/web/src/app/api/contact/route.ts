import { NextResponse } from 'next/server'
import { TRPCError } from '@trpc/server'
import { submitTerminalContact } from '@/lib/trpc/server'

type ContactRequestBody = {
  name?: unknown
  email?: unknown
  message?: unknown
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
  let body: ContactRequestBody

  try {
    body = (await request.json()) as ContactRequestBody
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      {
        status: 400,
      },
    )
  }

  const name = typeof body.name === 'string' ? body.name : ''
  const email = typeof body.email === 'string' ? body.email : ''
  const message = typeof body.message === 'string' ? body.message : ''

  try {
    const result = await submitTerminalContact({
      name,
      email,
      message,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: statusForTrpcError(error),
        },
      )
    }

    console.error('Failed to submit terminal contact request', error)

    return NextResponse.json(
      { error: 'Could not submit contact request right now.' },
      {
        status: 500,
      },
    )
  }
}

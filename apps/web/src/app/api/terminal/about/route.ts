import { NextResponse } from 'next/server'
import { TRPCError } from '@trpc/server'
import { getTerminalAbout } from '@/lib/trpc/server'

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

export async function GET() {
  try {
    const about = await getTerminalAbout()
    return NextResponse.json(about)
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

    console.error('Failed to load terminal about profile', error)

    return NextResponse.json(
      {
        error: 'Could not load profile right now.',
      },
      {
        status: 500,
      },
    )
  }
}

import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { PrismaService } from '@corphish/api/platform/database/application/prisma.service'
import { createTrpcContext } from '@corphish/api/trpc/context'
import { LOCATION_METRICS_WEBHOOK_KEY } from '@corphish/config'

const MAX_LOCATIONS_PER_REQUEST = 1000
const WEBHOOK_KEY_HEADER = 'x-location-metrics-key'

export const runtime = 'nodejs'

class ValidationError extends Error {}

type ParsedLocation = {
  timestampUtc: Date
  lat: number
  lon: number
  accuracyM: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function hasValidWebhookKey(rawValue: string | null): boolean {
  if (!rawValue || !LOCATION_METRICS_WEBHOOK_KEY) {
    return false
  }

  const expectedKey = Buffer.from(LOCATION_METRICS_WEBHOOK_KEY)
  const receivedKey = Buffer.from(rawValue)

  if (expectedKey.length !== receivedKey.length) {
    return false
  }

  return timingSafeEqual(expectedKey, receivedKey)
}

function parseLocation(rawValue: unknown, index: number): ParsedLocation {
  if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
    throw new ValidationError(`Location at index ${index} must be an object.`)
  }

  const rawLocation = rawValue as Record<string, unknown>
  const tsMs = rawLocation.tsMs
  const lat = rawLocation.lat
  const lon = rawLocation.lon
  const accuracyM = rawLocation.accuracyM

  if (typeof tsMs !== 'number' || !Number.isSafeInteger(tsMs) || tsMs < 0) {
    throw new ValidationError(`Location at index ${index} has an invalid tsMs.`)
  }

  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
    throw new ValidationError(`Location at index ${index} has an invalid lat.`)
  }

  if (!isFiniteNumber(lon) || lon < -180 || lon > 180) {
    throw new ValidationError(`Location at index ${index} has an invalid lon.`)
  }

  if (!isFiniteNumber(accuracyM) || accuracyM < 0) {
    throw new ValidationError(`Location at index ${index} has an invalid accuracyM.`)
  }

  const timestampUtc = new Date(tsMs)

  if (!Number.isFinite(timestampUtc.getTime())) {
    throw new ValidationError(`Location at index ${index} has an invalid tsMs timestamp.`)
  }

  return {
    timestampUtc,
    lat,
    lon,
    accuracyM,
  }
}

function parseLocations(payload: unknown): ParsedLocation[] {
  if (!Array.isArray(payload)) {
    throw new ValidationError('Request body must be an array of locations.')
  }

  if (payload.length > MAX_LOCATIONS_PER_REQUEST) {
    throw new ValidationError(`Request contains too many locations. Maximum is ${MAX_LOCATIONS_PER_REQUEST}.`)
  }

  return payload.map((location, index) => parseLocation(location, index))
}

export async function POST(request: Request) {
  if (!LOCATION_METRICS_WEBHOOK_KEY) {
    console.error('LOCATION_METRICS_WEBHOOK_KEY is not configured.')

    return NextResponse.json(
      {
        error: 'Webhook is not configured.',
      },
      {
        status: 500,
      },
    )
  }

  if (!hasValidWebhookKey(request.headers.get(WEBHOOK_KEY_HEADER))) {
    return NextResponse.json(
      {
        error: 'Unauthorized.',
      },
      {
        status: 401,
      },
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid JSON body.',
      },
      {
        status: 400,
      },
    )
  }

  let locations: ParsedLocation[]

  try {
    locations = parseLocations(payload)
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      )
    }

    return NextResponse.json(
      {
        error: 'Invalid request body.',
      },
      {
        status: 400,
      },
    )
  }

  if (locations.length === 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
    })
  }

  try {
    const trpcContext = await createTrpcContext()
    const prismaService = trpcContext.app.get<PrismaService>(PrismaService)

    await prismaService.client.locationPoint.createMany({
      data: locations,
    })
  } catch (error) {
    console.error('Failed to persist location metrics payload', error)

    return NextResponse.json(
      {
        error: 'Could not store location data.',
      },
      {
        status: 500,
      },
    )
  }

  return NextResponse.json({
    ok: true,
    inserted: locations.length,
  })
}

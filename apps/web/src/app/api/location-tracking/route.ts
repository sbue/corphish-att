import { NextResponse } from 'next/server'
import { prisma } from '@corphish/db/client'

const MAX_LOCATIONS_PER_REQUEST = 1000

export const runtime = 'nodejs'

class ValidationError extends Error {}

type ParsedLocation = {
  tsMs: bigint
  lat: number
  lon: number
  accuracyM: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
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

  if (typeof tsMs !== 'number' || !Number.isSafeInteger(tsMs)) {
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

  return {
    tsMs: BigInt(tsMs),
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
    await prisma.locationPoint.createMany({
      data: locations,
    })
  } catch (error) {
    console.error('Failed to persist location tracking payload', error)

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

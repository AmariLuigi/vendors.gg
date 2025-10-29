import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching PoE2 leagues from poe2scout.com...')
    
    // Fetch leagues from poe2scout.com API
    const response = await fetch('https://poe2scout.com/api/leagues', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'vendors.gg/1.0'
      },
      cache: 'no-store' // Always get fresh data
    })

    if (!response.ok) {
      console.error('poe2scout.com API request failed:', response.status, response.statusText)
      throw new Error(`poe2scout.com API request failed: ${response.status}`)
    }

    const leagues = await response.json()
    console.log('Successfully fetched PoE2 leagues from poe2scout.com:', leagues.length, 'leagues found')

    return NextResponse.json(leagues)

  } catch (error) {
    console.error('Error fetching PoE2 leagues:', error)
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch PoE2 leagues',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

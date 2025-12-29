import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
    matcher: [
        // Match all except static files and api routes that need large body
        '/((?!api/upload/process-aax|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

export function middleware(request: NextRequest) {
    // Just pass through - the config matcher already excludes the upload route
    return NextResponse.next()
}

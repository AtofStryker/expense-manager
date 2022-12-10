import { NextResponse, NextRequest } from 'next/server'

// https://stackoverflow.com/a/58182678
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname == '/') {
    // See: https://nextjs.org/docs/messages/middleware-relative-urls
    const url = req.nextUrl.clone()
    url.pathname = '/add'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

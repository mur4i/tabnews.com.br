import { NextResponse } from 'next/server';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';

export const config = {
  matcher: ['/api/:path*'],
};

export async function middleware(request) {
  console.log({
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.VERCEL_ENV': process.env.VERCEL_ENV,
    host: request.headers.get('host'),
    will_redirect: process.env.VERCEL_ENV === 'production' && request.headers.get('host') != 'www.tabnews.com.br',
  });
  if (process.env.VERCEL_ENV === 'production' && request.headers.get('host') != 'www.tabnews.com.br') {
    return NextResponse.redirect(`https://www.tabnews.com.br${request.nextUrl.pathname}`);
  }

  const url = request.nextUrl;

  try {
    const rateLimitResult = await rateLimit.check(request);

    if (!rateLimitResult.success && url.pathname === '/api/v1/sessions') {
      url.pathname = '/api/v1/_responses/rate-limit-reached-sessions'; // Fake response.
      return NextResponse.rewrite(url);
    }

    if (!rateLimitResult.success) {
      url.pathname = '/api/v1/_responses/rate-limit-reached';
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error(snakeize({ message: error.message, ...error }));
    return NextResponse.next();
  }
}

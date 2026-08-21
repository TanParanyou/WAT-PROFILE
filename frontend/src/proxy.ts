import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

const handleProxy = createMiddleware(routing);

export default handleProxy;
export { handleProxy as proxy };

export const config = {
  // Match only internationalized pathnames and root
  matcher: [
    '/',
    '/(th|en|de)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};

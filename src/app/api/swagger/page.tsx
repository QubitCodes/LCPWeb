'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Explicitly resolving 'default' and casting to any to bypass strict React type checks
// that often conflict between Next.js dynamic loader and external libraries.
const SwaggerUI = dynamic<{ url: string }>(
  () => import('swagger-ui-react').then((mod) => mod.default as any),
  { ssr: false }
);

export default function ApiDocPage() {
  return <SwaggerUI url="/api/docs-spec" />;
}
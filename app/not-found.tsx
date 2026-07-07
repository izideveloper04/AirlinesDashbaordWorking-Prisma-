// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <svg className="not-found-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M10.5 3.5 12 2l1.5 1.5v5.6l6.7 3.9v2.2l-6.7-2.2v4.4l2.2 1.6v1.8L12 19l-3.7 1.2v-1.8l2.2-1.6v-4.4L3.8 15V12.8l6.7-3.9V3.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>
        We couldn&apos;t find the office page you&apos;re looking for.
        It may have moved or the URL might be incorrect.
      </p>
      <Link href="/" className="btn btn-gold">
        Back to Home
      </Link>
    </div>
  );
}

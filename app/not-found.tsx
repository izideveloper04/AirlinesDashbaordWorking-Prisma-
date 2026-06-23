// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>
        We couldn't find the office page you're looking for.<br />
        It may have moved or the URL might be incorrect.
      </p>
      <Link href="/" className="btn">
        ✈ Back to Home
      </Link>
    </div>
  );
}
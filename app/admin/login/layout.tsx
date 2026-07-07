// app/admin/login/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Log In' };

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

'use client';
// app/admin/login/page.tsx
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const params      = useSearchParams();
    const callbackUrl = params.get('callbackUrl') || '/admin/dashboard';

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPwd,  setShowPwd]  = useState(false);
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await signIn('credentials', {
            email:    email.trim().toLowerCase(),
            password,
            redirect: false,
        });

        setLoading(false);

        if (!res?.ok || res?.error) {
            setError('Invalid email or password.');
            return;
        }

        // Full page reload so the browser sends the new session cookie
        // with the very first request. router.push() can race against
        // cookie propagation and land the middleware on a missing token.
        window.location.href = callbackUrl;
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>✈</div>
                    <div>
                        <div style={styles.logoTitle}>Airlines Office Map</div>
                        <div style={styles.logoSub}>Admin Dashboard</div>
                    </div>
                </div>

                <h1 style={styles.heading}>Sign in</h1>
                <p style={styles.subheading}>Enter your credentials to continue</p>

                {error && (
                    <div style={styles.errorBox}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            placeholder="you@example.com"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPwd ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={{ ...styles.input, paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(p => !p)}
                                style={styles.eyeBtn}
                            >
                                {showPwd ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Signing in…' : 'Sign in →'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight:      '100vh',
        background:     'linear-gradient(135deg, #0A1628 0%, #112240 60%, #1B4A7A 100%)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
    },
    card: {
        background:   '#fff',
        borderRadius: '16px',
        padding:      '40px 44px',
        width:        '100%',
        maxWidth:     '420px',
        boxShadow:    '0 24px 64px rgba(0,0,0,0.35)',
    },
    logo: {
        display:       'flex',
        alignItems:    'center',
        gap:           '12px',
        marginBottom:  '28px',
    },
    logoIcon: {
        width:          '44px',
        height:         '44px',
        background:     '#1B6CA8',
        borderRadius:   '10px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '22px',
        flexShrink:     0,
    },
    logoTitle: {
        fontWeight: 700,
        fontSize:   '15px',
        color:      '#0A1628',
    },
    logoSub: {
        fontSize: '12px',
        color:    '#7A909E',
    },
    heading: {
        fontSize:     '24px',
        fontWeight:   800,
        color:        '#0A1628',
        margin:       '0 0 4px',
    },
    subheading: {
        fontSize:     '14px',
        color:        '#7A909E',
        margin:       '0 0 24px',
    },
    errorBox: {
        background:   '#fdf2f2',
        border:       '1px solid #f5c2c2',
        borderRadius: '8px',
        padding:      '12px 16px',
        fontSize:     '13.5px',
        color:        '#8a1f1f',
        marginBottom: '20px',
    },
    form: {
        display:       'flex',
        flexDirection: 'column',
        gap:           '18px',
    },
    field: {
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
    },
    label: {
        fontSize:   '13px',
        fontWeight: 600,
        color:      '#1A2B3C',
    },
    input: {
        padding:      '10px 14px',
        border:       '1px solid #E2EAF0',
        borderRadius: '8px',
        fontSize:     '14px',
        outline:      'none',
        width:        '100%',
        boxSizing:    'border-box',
        color:        '#1A2B3C',
    },
    eyeBtn: {
        position:   'absolute',
        right:      '12px',
        top:        '50%',
        transform:  'translateY(-50%)',
        background: 'none',
        border:     'none',
        cursor:     'pointer',
        fontSize:   '16px',
        padding:    '0',
    },
    btn: {
        background:   '#1B6CA8',
        color:        '#fff',
        border:       'none',
        borderRadius: '8px',
        padding:      '12px',
        fontSize:     '15px',
        fontWeight:   700,
        cursor:       'pointer',
        width:        '100%',
        marginTop:    '4px',
    },
};
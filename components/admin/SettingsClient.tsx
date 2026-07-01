'use client';
// components/admin/SettingsClient.tsx
import { useState } from 'react';

type Props = {
    initialDiscourage: boolean;
};

export default function SettingsClient({ initialDiscourage }: Props) {
    const [discourage, setDiscourage] = useState(initialDiscourage);
    const [saving,     setSaving]     = useState(false);
    const [msg,        setMsg]        = useState('');
    const [error,      setError]      = useState('');

    async function save(nextValue: boolean) {
        setDiscourage(nextValue);
        setSaving(true);
        setMsg('');
        setError('');
        try {
            const res  = await fetch('/api/admin/settings', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ discourageSearchEngines: String(nextValue) }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to save.'); setDiscourage(!nextValue); return; }
            setMsg('Settings saved.');
            setTimeout(() => setMsg(''), 3000);
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
            setDiscourage(!nextValue);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <h1 style={s.pageTitle}>Settings</h1>

            {/* Reading & Visibility */}
            <section style={s.section}>
                <div style={s.sectionHeader}>
                    <h2 style={s.sectionTitle}>Reading</h2>
                    <p style={s.sectionDesc}>Control how search engines index your site.</p>
                </div>

                <div style={s.card}>
                    <div style={s.row}>
                        <label style={s.checkLabel}>
                            <input
                                type="checkbox"
                                checked={discourage}
                                disabled={saving}
                                onChange={e => save(e.target.checked)}
                                style={s.checkbox}
                            />
                            <span style={s.checkText}>
                                Discourage search engines from indexing this site
                            </span>
                        </label>
                    </div>

                    {/* Live preview of what gets written */}
                    <div style={s.preview}>
                        <div style={s.previewLabel}>robots.txt preview</div>
                        <pre style={s.previewCode}>{[
                            'User-agent: *',
                            `Disallow: ${discourage ? '/' : ''}`,
                        ].join('\n')}</pre>
                    </div>

                    {discourage && (
                        <div style={s.warning}>
                            ⚠ Search engines are currently discouraged from indexing this site.
                            Your site will not appear in search results.
                        </div>
                    )}
                </div>
            </section>

            {/* Status messages */}
            <div style={s.statusRow}>
                {saving && <span style={s.savingMsg}>Saving…</span>}
                {msg    && <span style={s.successMsg}>✓ {msg}</span>}
                {error  && <span style={s.errorMsg}>⚠ {error}</span>}
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    pageTitle:    { fontSize: '22px', fontWeight: 800, color: '#0A1628', margin: '0 0 28px' },
    section:      { marginBottom: '32px' },
    sectionHeader:{ marginBottom: '12px' },
    sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#0A1628', margin: '0 0 4px' },
    sectionDesc:  { fontSize: '13px', color: '#7A909E', margin: 0 },
    card:         { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    row:          { display: 'flex', alignItems: 'flex-start', gap: '12px' },
    checkLabel:   { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' },
    checkbox:     { width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1B6CA8', flexShrink: 0, marginTop: '1px' },
    checkText:    { fontSize: '14px', color: '#1A2B3C', fontWeight: 500 },
    preview:      { background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '7px', padding: '12px 16px' },
    previewLabel: { fontSize: '11px', fontWeight: 700, color: '#7A909E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
    previewCode:  { margin: 0, fontSize: '13px', fontFamily: 'monospace', color: '#1A2B3C', lineHeight: 1.6 },
    warning:      { background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: '#92400E', fontWeight: 500 },
    statusRow:    { marginTop: '4px', minHeight: '24px' },
    savingMsg:    { fontSize: '13px', color: '#7A909E' },
    successMsg:   { fontSize: '13px', color: '#16a34a', fontWeight: 600 },
    errorMsg:     { fontSize: '13px', color: '#dc2626', fontWeight: 600 },
};

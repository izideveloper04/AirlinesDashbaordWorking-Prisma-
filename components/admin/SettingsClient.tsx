'use client';
// components/admin/SettingsClient.tsx
import { useState } from 'react';
import { parsePermalinkPattern, buildPermalinkPattern } from '@/lib/permalink-utils';

type Props = {
    initialDiscourage:    boolean;
    initialPermalinkBase: string;
};

const PERMALINK_PRESETS = [
    { label: 'Plain',        pattern: '/%post-slug%',      desc: 'Posts served at the root, e.g. /my-post' },
    { label: 'Blog prefix',  pattern: '/blog/%post-slug%', desc: 'Posts under /blog/, e.g. /blog/my-post' },
    { label: 'Custom',       pattern: 'custom',            desc: 'Enter your own base path below' },
];

export default function SettingsClient({ initialDiscourage, initialPermalinkBase }: Props) {
    const [discourage,    setDiscourage]    = useState(initialDiscourage);
    const [savedDiscourage, setSavedDiscourage] = useState(initialDiscourage);

    const initialPattern = buildPermalinkPattern(initialPermalinkBase);
    const isPreset = (p: string) => PERMALINK_PRESETS.slice(0, 2).some(pr => pr.pattern === p);

    const [permalinkPattern, setPermalinkPattern] = useState(initialPattern);
    const [savedPattern,     setSavedPattern]     = useState(initialPattern);
    const [customInput,      setCustomInput]      = useState(
        isPreset(initialPattern) ? '' : initialPattern
    );
    const [presetKey, setPresetKey] = useState<string>(
        isPreset(initialPattern) ? initialPattern : 'custom'
    );

    const [saving, setSaving] = useState(false);
    const [msg,    setMsg]    = useState('');
    const [error,  setError]  = useState('');

    function handlePresetChange(pattern: string) {
        setPresetKey(pattern);
        if (pattern !== 'custom') {
            setPermalinkPattern(pattern);
        } else {
            setPermalinkPattern(customInput || '/%post-slug%');
        }
    }

    function handleCustomInput(val: string) {
        setCustomInput(val);
        setPermalinkPattern(val);
    }

    const activePattern = presetKey === 'custom' ? customInput : presetKey;
    const permalinkBase = parsePermalinkPattern(activePattern || '/%post-slug%');
    const examplePost = permalinkBase ? `/${permalinkBase}/my-post` : `/my-post`;

    const isDirty = discourage !== savedDiscourage || activePattern !== savedPattern;

    async function handleSave() {
        if (presetKey === 'custom' && !customInput.includes('%post-slug%')) {
            setError('Custom permalink must include %post-slug%.');
            return;
        }
        setSaving(true);
        setMsg('');
        setError('');
        try {
            const res  = await fetch('/api/admin/settings', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    discourageSearchEngines: String(discourage),
                    postPermalinkBase:       permalinkBase,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to save.'); return; }
            setSavedDiscourage(discourage);
            setSavedPattern(activePattern);
            setMsg('Settings saved.');
            setTimeout(() => setMsg(''), 3000);
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
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
                    <label style={s.checkLabel}>
                        <input
                            type="checkbox"
                            checked={discourage}
                            disabled={saving}
                            onChange={e => setDiscourage(e.target.checked)}
                            style={s.checkbox}
                        />
                        <span style={s.checkText}>Discourage search engines from indexing this site</span>
                    </label>
                    <div style={s.preview}>
                        <div style={s.previewLabel}>robots.txt preview</div>
                        <pre style={s.previewCode}>{`User-agent: *\nDisallow: ${discourage ? '/' : ''}`}</pre>
                    </div>
                    {savedDiscourage && (
                        <div style={s.warning}>
                            ⚠ Search engines are currently discouraged from indexing this site.
                        </div>
                    )}
                </div>
            </section>

            {/* Permalink */}
            <section style={s.section}>
                <div style={s.sectionHeader}>
                    <h2 style={s.sectionTitle}>Permalinks</h2>
                    <p style={s.sectionDesc}>
                        Choose the URL structure for your posts. Pages are always served at their own root path and are not affected by this setting.
                    </p>
                </div>
                <div style={s.card}>
                    <div style={s.radioGroup}>
                        {PERMALINK_PRESETS.map(preset => (
                            <label key={preset.pattern} style={s.radioLabel}>
                                <input
                                    type="radio"
                                    name="permalink"
                                    value={preset.pattern}
                                    checked={presetKey === preset.pattern}
                                    onChange={() => handlePresetChange(preset.pattern)}
                                    style={s.radio}
                                />
                                <div>
                                    <div style={s.radioName}>{preset.label}</div>
                                    <div style={s.radioDesc}>
                                        {preset.pattern !== 'custom'
                                            ? <code style={s.code}>{preset.pattern}</code>
                                            : preset.desc}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    {presetKey === 'custom' && (
                        <div style={s.customRow}>
                            <label style={s.customLabel}>Custom structure</label>
                            <input
                                type="text"
                                value={customInput}
                                onChange={e => handleCustomInput(e.target.value)}
                                placeholder="/posts/%post-slug%"
                                style={s.textInput}
                            />
                            <div style={s.tokenHint}>
                                Available token: <code style={s.code}>%post-slug%</code>
                            </div>
                        </div>
                    )}

                    {/* Live URL preview */}
                    <div style={s.preview}>
                        <div style={s.previewLabel}>Example post URL</div>
                        <div style={s.previewCode}>
                            <span style={{ color: '#7A909E' }}>yourdomain.com</span>
                            <span style={{ color: '#1B6CA8', fontWeight: 600 }}>{examplePost}</span>
                        </div>
                    </div>

                    {savedPattern !== activePattern && (
                        <div style={s.infoBox}>
                            ℹ Existing posts at the old URL will automatically redirect to the new one after saving.
                        </div>
                    )}
                </div>
            </section>

            {/* Save button + status */}
            <div style={s.footer}>
                <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    style={{ ...s.saveBtn, ...(saving || !isDirty ? s.saveBtnDisabled : {}) }}
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {msg   && <span style={s.successMsg}>✓ {msg}</span>}
                {error && <span style={s.errorMsg}>⚠ {error}</span>}
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
    checkLabel:   { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' },
    checkbox:     { width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1B6CA8', flexShrink: 0 },
    checkText:    { fontSize: '14px', color: '#1A2B3C', fontWeight: 500 },
    preview:      { background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '7px', padding: '12px 16px' },
    previewLabel: { fontSize: '11px', fontWeight: 700, color: '#7A909E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
    previewCode:  { margin: 0, fontSize: '13px', fontFamily: 'monospace', color: '#1A2B3C', lineHeight: 1.6 },
    warning:      { background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: '#92400E', fontWeight: 500 },
    infoBox:      { background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: '#1D4ED8', fontWeight: 500 },
    radioGroup:   { display: 'flex', flexDirection: 'column', gap: '12px' },
    radioLabel:   { display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' },
    radio:        { marginTop: '3px', accentColor: '#1B6CA8', flexShrink: 0 },
    radioName:    { fontSize: '14px', fontWeight: 600, color: '#1A2B3C', marginBottom: '2px' },
    radioDesc:    { fontSize: '13px', color: '#7A909E' },
    code:         { fontFamily: 'monospace', background: '#F1F5F9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', color: '#1B6CA8' },
    customRow:    { display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '22px' },
    customLabel:  { fontSize: '13px', fontWeight: 600, color: '#4A6070' },
    textInput:    { padding: '8px 12px', border: '1px solid #C8D8E4', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', color: '#1A2B3C', outline: 'none' },
    tokenHint:    { fontSize: '12px', color: '#7A909E' },
    footer:       { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' },
    saveBtn:      { padding: '9px 22px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
    saveBtnDisabled: { background: '#B0C4D8', cursor: 'not-allowed' },
    successMsg:   { fontSize: '13px', color: '#16a34a', fontWeight: 600 },
    errorMsg:     { fontSize: '13px', color: '#dc2626', fontWeight: 600 },
};

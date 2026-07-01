'use client';
// components/admin/UsersClient.tsx
import { useState } from 'react';

type UserRow = {
    id:        number;
    name:      string;
    email:     string;
    role:      string;
    avatar:    string;
    active:    boolean;
    createdAt: string;
    _count:    { pages: number; posts: number };
};

type Props = {
    initialUsers: UserRow[];
    currentUserId: number;
};

type FormState = {
    name:     string;
    email:    string;
    role:     string;
    active:   boolean;
    password: string;
    confirm:  string;
};

const BLANK: FormState = { name: '', email: '', role: 'editor', active: true, password: '', confirm: '' };

function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ROLE_COLORS: Record<string, React.CSSProperties> = {
    admin:  { background: '#FEF3C7', color: '#92400E' },
    editor: { background: '#E8F4FD', color: '#1B6CA8' },
};

export default function UsersClient({ initialUsers, currentUserId }: Props) {
    const [users,      setUsers]      = useState<UserRow[]>(initialUsers);
    const [filterRole, setFilterRole] = useState('all');
    const [modal,      setModal]      = useState<'create' | 'edit' | null>(null);
    const [editTarget, setEditTarget] = useState<UserRow | null>(null);
    const [form,       setForm]       = useState<FormState>(BLANK);
    const [saving,     setSaving]     = useState(false);
    const [deleting,   setDeleting]   = useState<number | null>(null);
    const [error,      setError]      = useState('');
    const [success,    setSuccess]    = useState('');
    const [showPwd,    setShowPwd]    = useState(false);

    // ── Filtered users ──────────────────────────────────
    const filtered = filterRole === 'all'
        ? users
        : users.filter(u => u.role === filterRole);

    const counts = {
        all:    users.length,
        admin:  users.filter(u => u.role === 'admin').length,
        editor: users.filter(u => u.role === 'editor').length,
    };

    // ── Open modal ──────────────────────────────────────
    function openCreate() {
        setForm(BLANK);
        setEditTarget(null);
        setModal('create');
        setError('');
        setSuccess('');
        setShowPwd(false);
    }

    function openEdit(user: UserRow) {
        setForm({ name: user.name, email: user.email, role: user.role, active: user.active, password: '', confirm: '' });
        setEditTarget(user);
        setModal('edit');
        setError('');
        setSuccess('');
        setShowPwd(false);
    }

    function closeModal() {
        setModal(null);
        setEditTarget(null);
        setError('');
        setSuccess('');
    }

    // ── Submit (create or edit) ──────────────────────────
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Client-side validation
        if (!form.name.trim())  return setError('Name is required.');
        if (!form.email.trim()) return setError('Email is required.');

        if (modal === 'create') {
            if (!form.password) return setError('Password is required for new users.');
            if (form.password.length < 8) return setError('Password must be at least 8 characters.');
            if (form.password !== form.confirm) return setError('Passwords do not match.');
        }

        if (modal === 'edit' && form.password) {
            if (form.password.length < 8) return setError('Password must be at least 8 characters.');
            if (form.password !== form.confirm) return setError('Passwords do not match.');
        }

        setSaving(true);
        try {
            if (modal === 'create') {
                const res  = await fetch('/api/admin/users', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ name: form.name, email: form.email, role: form.role, active: form.active, password: form.password }),
                });
                const data = await res.json();
                if (!res.ok) { setError(data.error || 'Failed to create user.'); return; }

                setUsers(prev => [...prev, { ...data.user, _count: { pages: 0, posts: 0 } }]);
                setSuccess('User created successfully!');
                setTimeout(closeModal, 1200);

            } else if (modal === 'edit' && editTarget) {
                const payload: any = { name: form.name, email: form.email, role: form.role, active: form.active };
                if (form.password) payload.password = form.password;

                const res  = await fetch(`/api/admin/users/${editTarget.id}`, {
                    method:  'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok) { setError(data.error || 'Failed to update user.'); return; }

                setUsers(prev => prev.map(u => u.id === editTarget.id
                    ? { ...u, name: form.name, email: form.email, role: form.role, active: form.active }
                    : u
                ));
                setSuccess('User updated!');
                setTimeout(closeModal, 1200);
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setSaving(false);
        }
    }

    // ── Delete ──────────────────────────────────────────
    async function handleDelete(user: UserRow) {
        if (!confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
        setDeleting(user.id);
        try {
            const res  = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Delete failed.'); return; }
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } finally {
            setDeleting(null);
        }
    }

    // ── Toggle active inline ─────────────────────────────
    async function toggleActive(user: UserRow) {
        const res  = await fetch(`/api/admin/users/${user.id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ active: !user.active }),
        });
        if (res.ok) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
        }
    }

    // ══════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════
    return (
        <div>
            {/* ── Header ── */}
            <div style={s.header}>
                <div>
                    <h1 style={s.pageTitle}>Users</h1>
                    {/* Role filter tabs */}
                    <div style={s.tabs}>
                        {(['all', 'admin', 'editor'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setFilterRole(r)}
                                style={{ ...s.tab, ...(filterRole === r ? s.tabActive : {}) }}
                            >
                                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                                <span style={s.tabCount}>{counts[r]}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={openCreate} style={s.addBtn}>+ Add New User</button>
            </div>

            {/* ── Users table ── */}
            <div style={s.card}>
                {/* Table header */}
                <div style={s.tableHead}>
                    <div style={{ ...s.th, flex: 3 }}>User</div>
                    <div style={s.th}>Email</div>
                    <div style={s.th}>Role</div>
                    <div style={s.th}>Content</div>
                    <div style={s.th}>Status</div>
                    <div style={s.th}>Joined</div>
                    <div style={{ ...s.th, textAlign: 'right' }}>Actions</div>
                </div>

                {filtered.length === 0 ? (
                    <div style={s.empty}>No users found.</div>
                ) : (
                    filtered.map(user => (
                        <div key={user.id} style={s.row}>
                            {/* Avatar + Name */}
                            <div style={{ ...s.td, flex: 3, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ ...s.avatar, ...(user.id === currentUserId ? s.avatarSelf : {}) }}>
                                    {initials(user.name)}
                                </div>
                                <div>
                                    <div style={s.userName}>
                                        {user.name}
                                        {user.id === currentUserId && <span style={s.youBadge}> (You)</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div style={s.td}>{user.email}</div>

                            {/* Role */}
                            <div style={s.td}>
                                <span style={{ ...s.roleBadge, ...ROLE_COLORS[user.role] }}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                            </div>

                            {/* Content count */}
                            <div style={s.td}>
                                <span style={s.contentCount}>
                                    {user._count.pages} pages · {user._count.posts} posts
                                </span>
                            </div>

                            {/* Active toggle */}
                            <div style={s.td}>
                                <button
                                    onClick={() => user.id !== currentUserId && toggleActive(user)}
                                    disabled={user.id === currentUserId}
                                    style={{
                                        ...s.statusBadge,
                                        ...(user.active ? s.statusActive : s.statusInactive),
                                        cursor: user.id === currentUserId ? 'default' : 'pointer',
                                        opacity: user.id === currentUserId ? 0.6 : 1,
                                    }}
                                    title={user.id === currentUserId ? "Can't deactivate yourself" : (user.active ? 'Click to deactivate' : 'Click to activate')}
                                >
                                    {user.active ? 'Active' : 'Inactive'}
                                </button>
                            </div>

                            {/* Joined */}
                            <div style={s.td}>{formatDate(user.createdAt)}</div>

                            {/* Actions */}
                            <div style={{ ...s.td, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button onClick={() => openEdit(user)} style={s.actionEdit}>Edit</button>
                                {user.id !== currentUserId && (
                                    <button
                                        onClick={() => handleDelete(user)}
                                        disabled={deleting === user.id}
                                        style={s.actionDelete}
                                    >
                                        {deleting === user.id ? '…' : 'Delete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <div style={s.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div style={s.modalBox}>

                        {/* Modal header */}
                        <div style={s.modalHeader}>
                            <h2 style={s.modalTitle}>
                                {modal === 'create' ? 'Add New User' : `Edit User — ${editTarget?.name}`}
                            </h2>
                            <button onClick={closeModal} style={s.modalClose}>✕</button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={s.modalBody}>

                            {/* Alerts */}
                            {error   && <div style={s.alertErr}>{error}</div>}
                            {success && <div style={s.alertOk}>{success}</div>}

                            {/* Two-col row: Name + Email */}
                            <div style={s.row2}>
                                <div style={s.fieldWrap}>
                                    <label style={s.label}>Full Name <span style={s.req}>*</span></label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Jane Smith"
                                        style={s.input}
                                        required
                                    />
                                </div>
                                <div style={s.fieldWrap}>
                                    <label style={s.label}>Email Address <span style={s.req}>*</span></label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="jane@example.com"
                                        style={s.input}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role + Active */}
                            <div style={s.row2}>
                                <div style={s.fieldWrap}>
                                    <label style={s.label}>Role</label>
                                    <select
                                        value={form.role}
                                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        style={s.select}
                                    >
                                        <option value="editor">Editor — can manage pages, posts, media, categories & tags</option>
                                        <option value="admin">Admin — full access to all settings and users</option>
                                    </select>
                                </div>
                                <div style={s.fieldWrap}>
                                    <label style={s.label}>Account Status</label>
                                    <div style={s.toggleRow}>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                                            style={{ ...s.toggle, ...(form.active ? s.toggleOn : s.toggleOff) }}
                                        >
                                            <span style={{ ...s.toggleThumb, ...(form.active ? s.toggleThumbOn : {}) }} />
                                        </button>
                                        <span style={s.toggleLabel}>{form.active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Password section */}
                            <div style={s.pwdSection}>
                                <div style={s.pwdHeader}>
                                    <span style={s.pwdTitle}>
                                        {modal === 'create' ? 'Set Password' : 'Change Password'}
                                    </span>
                                    {modal === 'edit' && (
                                        <span style={s.pwdHint}>Leave blank to keep the current password</span>
                                    )}
                                </div>

                                <div style={s.row2}>
                                    <div style={s.fieldWrap}>
                                        <label style={s.label}>
                                            {modal === 'create' ? 'Password' : 'New Password'}{modal === 'create' && <span style={s.req}> *</span>}
                                        </label>
                                        <div style={s.pwdRow}>
                                            <input
                                                type={showPwd ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                                placeholder="Min. 8 characters"
                                                style={{ ...s.input, flex: 1 }}
                                                required={modal === 'create'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPwd(v => !v)}
                                                style={s.pwdToggleBtn}
                                                title={showPwd ? 'Hide' : 'Show'}
                                            >
                                                {showPwd ? '🙈' : '👁'}
                                            </button>
                                        </div>
                                        {form.password && (
                                            <PasswordStrength password={form.password} />
                                        )}
                                    </div>
                                    <div style={s.fieldWrap}>
                                        <label style={s.label}>
                                            Confirm Password{modal === 'create' && <span style={s.req}> *</span>}
                                        </label>
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={form.confirm}
                                            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                                            placeholder="Repeat password"
                                            style={{
                                                ...s.input,
                                                ...(form.confirm && form.password !== form.confirm
                                                    ? { borderColor: '#f87171' }
                                                    : form.confirm && form.password === form.confirm
                                                    ? { borderColor: '#34d399' }
                                                    : {}),
                                            }}
                                            required={modal === 'create'}
                                        />
                                        {form.confirm && form.password !== form.confirm && (
                                            <div style={s.pwdMismatch}>Passwords do not match</div>
                                        )}
                                        {form.confirm && form.password === form.confirm && form.password && (
                                            <div style={s.pwdMatch}>✓ Passwords match</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer actions */}
                            <div style={s.modalFooter}>
                                <button type="button" onClick={closeModal} style={s.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={saving} style={s.submitBtn}>
                                    {saving
                                        ? 'Saving…'
                                        : modal === 'create' ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Password strength indicator ─────────────────────────
function PasswordStrength({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score  = checks.filter(Boolean).length;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

    return (
        <div style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                        height: '3px', flex: 1, borderRadius: '2px',
                        background: i < score ? colors[score - 1] : '#E2EAF0',
                        transition: 'background 0.2s',
                    }} />
                ))}
            </div>
            <span style={{ fontSize: '11px', color: score > 0 ? colors[score - 1] : '#7A909E', fontWeight: 600 }}>
                {score > 0 ? labels[score - 1] : ''}
            </span>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
    header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px' },
    pageTitle:     { fontSize: '22px', fontWeight: 800, color: '#0A1628', margin: '0 0 10px' },
    tabs:          { display: 'flex', gap: '4px' },
    tab:           { background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#7A909E', padding: '4px 2px', display: 'flex', gap: '5px', alignItems: 'center' },
    tabActive:     { color: '#0A1628', fontWeight: 700, borderBottom: '2px solid #1B6CA8' },
    tabCount:      { background: '#E2EAF0', borderRadius: '99px', padding: '1px 6px', fontSize: '11px', fontWeight: 700, color: '#4A6070' },
    addBtn:        { padding: '9px 20px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

    card:          { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', overflow: 'hidden' },
    tableHead:     { display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2EAF0', gap: '12px' },
    th:            { flex: 1, fontSize: '11px', fontWeight: 700, color: '#7A909E', textTransform: 'uppercase', letterSpacing: '0.05em' },
    row:           { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', gap: '12px', transition: 'background 0.1s' },
    td:            { flex: 1, fontSize: '13px', color: '#4A6070' },
    empty:         { padding: '48px', textAlign: 'center', color: '#7A909E', fontSize: '14px' },

    avatar:        { width: '36px', height: '36px', background: '#1B6CA8', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
    avatarSelf:    { background: '#7C3AED' },
    userName:      { fontSize: '13px', fontWeight: 700, color: '#0A1628' },
    youBadge:      { fontSize: '11px', color: '#7A909E', fontWeight: 400 },
    roleBadge:     { display: 'inline-block', borderRadius: '99px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' },
    contentCount:  { fontSize: '12px', color: '#7A909E' },
    statusBadge:   { borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, border: 'none' },
    statusActive:  { background: '#D1FAE5', color: '#065F46' },
    statusInactive:{ background: '#FEE2E2', color: '#991B1B' },
    actionEdit:    { padding: '5px 12px', background: '#F0F7FF', border: '1px solid #C2DFF5', borderRadius: '5px', fontSize: '12px', fontWeight: 600, color: '#1B6CA8', cursor: 'pointer' },
    actionDelete:  { padding: '5px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '5px', fontSize: '12px', fontWeight: 600, color: '#DC2626', cursor: 'pointer' },

    // Modal
    modalOverlay:  { position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' },
    modalBox:      { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
    modalHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2EAF0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
    modalTitle:    { fontSize: '17px', fontWeight: 800, color: '#0A1628', margin: 0 },
    modalClose:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#7A909E', padding: '0 2px', lineHeight: 1 },
    modalBody:     { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
    modalFooter:   { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },

    // Form
    row2:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    fieldWrap:     { display: 'flex', flexDirection: 'column', gap: '6px' },
    label:         { fontSize: '12px', fontWeight: 700, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '0.05em' },
    req:           { color: '#DC2626' },
    input:         { padding: '9px 12px', border: '1px solid #E2EAF0', borderRadius: '7px', fontSize: '13px', color: '#0A1628', outline: 'none', width: '100%', boxSizing: 'border-box' },
    select:        { padding: '9px 12px', border: '1px solid #E2EAF0', borderRadius: '7px', fontSize: '13px', color: '#0A1628', outline: 'none', width: '100%', background: '#fff' },
    toggleRow:     { display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' },
    toggle:        { width: '44px', height: '24px', borderRadius: '99px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0 },
    toggleOn:      { background: '#1B6CA8' },
    toggleOff:     { background: '#CBD5E1' },
    toggleThumb:   { position: 'absolute', top: '3px', left: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' },
    toggleThumbOn: { left: '23px' },
    toggleLabel:   { fontSize: '13px', fontWeight: 600, color: '#4A6070' },

    // Password
    pwdSection:    { background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '9px', padding: '16px' },
    pwdHeader:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
    pwdTitle:      { fontSize: '13px', fontWeight: 700, color: '#0A1628' },
    pwdHint:       { fontSize: '12px', color: '#7A909E' },
    pwdRow:        { display: 'flex', gap: '6px', width: '100%' },
    pwdToggleBtn:  { padding: '9px 10px', border: '1px solid #E2EAF0', borderRadius: '7px', background: '#fff', cursor: 'pointer', fontSize: '14px', flexShrink: 0 },
    pwdMismatch:   { fontSize: '11px', color: '#ef4444', marginTop: '4px' },
    pwdMatch:      { fontSize: '11px', color: '#22c55e', marginTop: '4px' },

    // Alerts
    alertErr:      { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' },
    alertOk:       { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: '#15803D' },

    cancelBtn:     { padding: '9px 20px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '7px', fontSize: '13px', fontWeight: 600, color: '#4A6070', cursor: 'pointer' },
    submitBtn:     { padding: '9px 24px', background: '#1B6CA8', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' },
};

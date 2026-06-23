'use client';
// components/admin/PagesClient.tsx
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Page = {
    id:          number;
    title:       string;
    fullPath:    string;
    status:      string;
    template:    string;
    updatedAt:   string;
    createdBy:   { name: string } | null;
    lock:        { user: { name: string }; expiresAt: string } | null;
};

type Props = {
    pages:         Page[];
    total:         number;
    totalPages:    number;
    currentPage:   number;
    currentStatus: string;
    currentSearch: string;
    counts:        { all: number; published: number; draft: number; trash: number };
    userRole:      string;
};

const STATUS_TABS = [
    { key: 'all',       label: 'All'       },
    { key: 'published', label: 'Published' },
    { key: 'draft',     label: 'Draft'     },
    { key: 'trash',     label: 'Trash'     },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    published: { bg: '#dcfce7', color: '#16a34a' },
    draft:     { bg: '#fef9c3', color: '#ca8a04' },
    trash:     { bg: '#fee2e2', color: '#dc2626' },
};

export default function PagesClient({
    pages, total, totalPages, currentPage,
    currentStatus, currentSearch, counts, userRole,
}: Props) {
    const router              = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(currentSearch);
    const [selected, setSelected] = useState<number[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    function buildUrl(overrides: Record<string, string>) {
        const p = new URLSearchParams();
        if (currentStatus !== 'all') p.set('status', currentStatus);
        if (currentSearch)           p.set('search', currentSearch);
        if (currentPage > 1)         p.set('p', String(currentPage));
        Object.entries(overrides).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
        return `/admin/pages?${p.toString()}`;
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        startTransition(() => router.push(buildUrl({ search, p: '1' })));
    }

    function toggleSelect(id: number) {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    }

    function toggleAll() {
        setSelected(s => s.length === pages.length ? [] : pages.map(p => p.id));
    }

    async function bulkAction(action: string) {
        if (!selected.length) return;
        if (action === 'trash' && !confirm(`Move ${selected.length} page(s) to trash?`)) return;
        if (action === 'delete' && !confirm(`Permanently delete ${selected.length} page(s)? This cannot be undone.`)) return;

        setActionLoading(true);
        await fetch('/api/admin/pages/bulk', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ids: selected, action }),
        });
        setSelected([]);
        setActionLoading(false);
        startTransition(() => router.refresh());
    }

    async function quickAction(id: number, action: string) {
        await fetch(`/api/admin/pages/${id}/${action}`, { method: 'POST' });
        startTransition(() => router.refresh());
    }

    async function duplicatePage(id: number) {
        const res  = await fetch(`/api/admin/pages/${id}/duplicate`, { method: 'POST' });
        const data = await res.json();
        if (data.id) router.push(`/admin/pages/${data.id}/edit`);
    }

    return (
        <div>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={s.heading}>Pages</h1>
                    <p style={s.sub}>{total} total</p>
                </div>
                <Link href="/admin/pages/new" style={s.newBtn}>+ Add New Page</Link>
            </div>

            {/* Status tabs */}
            <div style={s.tabs}>
                {STATUS_TABS.map(tab => (
                    <Link
                        key={tab.key}
                        href={buildUrl({ status: tab.key === 'all' ? '' : tab.key, p: '1' })}
                        style={{
                            ...s.tab,
                            ...(currentStatus === tab.key ? s.tabActive : {}),
                        }}
                    >
                        {tab.label}
                        <span style={s.tabCount}>
                            {counts[tab.key as keyof typeof counts]}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Toolbar */}
            <div style={s.toolbar}>
                {/* Bulk actions */}
                <div style={s.bulkBar}>
                    <select
                        style={s.select}
                        onChange={e => e.target.value && bulkAction(e.target.value)}
                        value=""
                        disabled={!selected.length || actionLoading}
                    >
                        <option value="">Bulk actions</option>
                        <option value="publish">Publish</option>
                        <option value="draft">Set to Draft</option>
                        <option value="trash">Move to Trash</option>
                        {currentStatus === 'trash' && (
                            <option value="delete">Delete Permanently</option>
                        )}
                    </select>
                    {selected.length > 0 && (
                        <span style={s.selectedCount}>{selected.length} selected</span>
                    )}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} style={s.searchForm}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search pages…"
                        style={s.searchInput}
                    />
                    <button type="submit" style={s.searchBtn}>Search</button>
                </form>
            </div>

            {/* Table */}
            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr style={s.thead}>
                            <th style={{ ...s.th, width: 32 }}>
                                <input
                                    type="checkbox"
                                    checked={selected.length === pages.length && pages.length > 0}
                                    onChange={toggleAll}
                                />
                            </th>
                            <th style={s.th}>Title</th>
                            <th style={s.th}>Status</th>
                            <th style={s.th}>Template</th>
                            <th style={s.th}>Author</th>
                            <th style={s.th}>Updated</th>
                            <th style={s.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.length === 0 && (
                            <tr>
                                <td colSpan={7} style={s.empty}>
                                    No pages found.
                                </td>
                            </tr>
                        )}
                        {pages.map(page => {
                            const isLocked    = page.lock && new Date(page.lock.expiresAt) > new Date();
                            const statusStyle = STATUS_COLORS[page.status] || STATUS_COLORS.draft;

                            return (
                                <tr key={page.id} style={s.tr}>
                                    <td style={s.td}>
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(page.id)}
                                            onChange={() => toggleSelect(page.id)}
                                        />
                                    </td>
                                    <td style={s.td}>
                                        <div>
                                            <Link
                                                href={`/admin/pages/${page.id}/edit`}
                                                style={s.titleLink}
                                            >
                                                {page.title || '(no title)'}
                                            </Link>
                                            <div style={s.pagePath}>/{page.fullPath}</div>
                                            {/* Lock warning */}
                                            {isLocked && (
                                                <div style={s.lockBadge}>
                                                    🔒 Being edited by {page.lock!.user.name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ ...s.badge, background: statusStyle.bg, color: statusStyle.color }}>
                                            {page.status}
                                        </span>
                                    </td>
                                    <td style={{ ...s.td, color: '#7A909E', fontSize: '12px' }}>
                                        {page.template || 'default'}
                                    </td>
                                    <td style={{ ...s.td, color: '#7A909E', fontSize: '13px' }}>
                                        {page.createdBy?.name || '—'}
                                    </td>
                                    <td style={{ ...s.td, color: '#7A909E', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                        {new Date(page.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td style={s.td}>
                                        <div style={s.actions}>
                                            <Link
                                                href={`/admin/pages/${page.id}/edit`}
                                                style={s.actionBtn}
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => duplicatePage(page.id)}
                                                style={s.actionBtn}
                                                title="Duplicate"
                                            >
                                                Copy
                                            </button>
                                            <a
                                                href={page.status === 'published' ? `/${page.fullPath}` : `/preview/${page.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    ...s.actionBtn,
                                                    ...(page.status !== 'published' ? { color: '#d97706' } : {}),
                                                }}
                                            >
                                                {page.status === 'published' ? 'View' : '👁 Preview'}
                                            </a>
                                            {page.status !== 'trash' ? (
                                                <button
                                                    onClick={() => quickAction(page.id, 'trash')}
                                                    style={{ ...s.actionBtn, color: '#dc2626' }}
                                                >
                                                    Trash
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => quickAction(page.id, 'restore')}
                                                        style={{ ...s.actionBtn, color: '#16a34a' }}
                                                    >
                                                        Restore
                                                    </button>
                                                    <button
                                                        onClick={() => quickAction(page.id, 'delete')}
                                                        style={{ ...s.actionBtn, color: '#dc2626' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={s.pagination}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link
                            key={p}
                            href={buildUrl({ p: String(p) })}
                            style={{
                                ...s.pageBtn,
                                ...(p === currentPage ? s.pageBtnActive : {}),
                            }}
                        >
                            {p}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    heading:   { fontSize: '22px', fontWeight: 800, color: '#0A1628', margin: 0 },
    sub:       { fontSize: '13px', color: '#7A909E', margin: '3px 0 0' },
    newBtn:    { background: '#1B6CA8', color: '#fff', padding: '9px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' },
    tabs:      { display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #E2EAF0', paddingBottom: '0' },
    tab:       { padding: '8px 14px', fontSize: '13px', color: '#7A909E', textDecoration: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px' },
    tabActive: { color: '#1B6CA8', borderBottom: '2px solid #1B6CA8', fontWeight: 600 },
    tabCount:  { background: '#E2EAF0', color: '#4A6070', borderRadius: '99px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 },
    toolbar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' },
    bulkBar:   { display: 'flex', alignItems: 'center', gap: '10px' },
    select:    { padding: '7px 12px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', background: '#fff', cursor: 'pointer' },
    selectedCount: { fontSize: '13px', color: '#7A909E' },
    searchForm:  { display: 'flex', gap: '8px' },
    searchInput: { padding: '7px 12px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', width: '220px' },
    searchBtn:   { padding: '7px 14px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
    tableWrap: { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', overflow: 'hidden' },
    table:     { width: '100%', borderCollapse: 'collapse' },
    thead:     { background: '#F8FAFC' },
    th:        { padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: '#7A909E', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2EAF0' },
    tr:        { borderBottom: '1px solid #F0F4F8' },
    td:        { padding: '13px 14px', fontSize: '13.5px', color: '#1A2B3C', verticalAlign: 'middle' },
    titleLink: { fontWeight: 600, color: '#0A1628', textDecoration: 'none', fontSize: '14px' },
    pagePath:  { fontSize: '11px', color: '#7A909E', marginTop: '2px' },
    lockBadge: { fontSize: '11px', color: '#d97706', background: '#fef9c3', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' },
    badge:     { display: 'inline-block', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' },
    actions:   { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    actionBtn: { padding: '4px 10px', fontSize: '12px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '5px', cursor: 'pointer', color: '#1A2B3C', textDecoration: 'none', fontWeight: 500 },
    empty:     { textAlign: 'center', padding: '48px', color: '#7A909E', fontSize: '14px' },
    pagination:{ display: 'flex', gap: '6px', marginTop: '20px', justifyContent: 'center' },
    pageBtn:   { padding: '7px 13px', border: '1px solid #E2EAF0', borderRadius: '6px', textDecoration: 'none', color: '#1A2B3C', fontSize: '13px', background: '#fff' },
    pageBtnActive: { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' },
};
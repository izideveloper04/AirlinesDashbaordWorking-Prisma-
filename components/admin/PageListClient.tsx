'use client';
// components/admin/PageListClient.tsx
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type PageRow = {
    id:          number;
    title:       string;
    fullPath:    string;
    status:      string;
    template:    string;
    updatedAt:   string;
    createdBy:   { name: string } | null;
};

type Props = {
    pages:         PageRow[];
    currentStatus: string;
    currentSearch: string;
    currentPage:   number;
    totalPages:    number;
    total:         number;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    published: { bg: '#edfaee', color: '#16a34a' },
    draft:     { bg: '#fef9e7', color: '#d97706' },
    trash:     { bg: '#fef2f2', color: '#dc2626' },
};

export default function PageListClient({
    pages, currentStatus, currentSearch, currentPage, totalPages, total,
}: Props) {
    const router             = useRouter();
    const [search, setSearch] = useState(currentSearch);
    const [selected, setSelected] = useState<number[]>([]);
    const [isPending, startTransition] = useTransition();

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (currentStatus !== 'all') params.set('status', currentStatus);
        if (search) params.set('search', search);
        router.push(`/admin/pages?${params.toString()}`);
    }

    function toggleAll(checked: boolean) {
        setSelected(checked ? pages.map(p => p.id) : []);
    }

    function toggleOne(id: number) {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    async function bulkAction(action: string) {
        if (!selected.length) return;
        if (action === 'trash' && !confirm(`Move ${selected.length} page(s) to trash?`)) return;
        if (action === 'delete' && !confirm(`Permanently delete ${selected.length} page(s)? This cannot be undone.`)) return;

        await fetch('/api/admin/pages/bulk', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ids: selected, action }),
        });

        setSelected([]);
        startTransition(() => router.refresh());
    }

    async function quickAction(id: number, action: string) {
        await fetch(`/api/admin/pages/${id}/${action}`, { method: 'POST' });
        startTransition(() => router.refresh());
    }

    return (
        <div style={s.wrap}>
            {/* Toolbar */}
            <div style={s.toolbar}>
                {/* Search */}
                <form onSubmit={handleSearch} style={s.searchForm}>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search pages…"
                        style={s.searchInput}
                    />
                    <button type="submit" style={s.searchBtn}>Search</button>
                </form>

                {/* Bulk actions */}
                {selected.length > 0 && (
                    <div style={s.bulkBar}>
                        <span style={s.bulkCount}>{selected.length} selected</span>
                        {currentStatus !== 'trash' && (
                            <>
                                <button onClick={() => bulkAction('publish')} style={s.bulkBtn}>Publish</button>
                                <button onClick={() => bulkAction('draft')}   style={s.bulkBtn}>Set Draft</button>
                                <button onClick={() => bulkAction('trash')}   style={{ ...s.bulkBtn, color: '#dc2626' }}>Trash</button>
                            </>
                        )}
                        {currentStatus === 'trash' && (
                            <>
                                <button onClick={() => bulkAction('restore')} style={s.bulkBtn}>Restore</button>
                                <button onClick={() => bulkAction('delete')}  style={{ ...s.bulkBtn, color: '#dc2626' }}>Delete Permanently</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr style={s.thead}>
                            <th style={{ ...s.th, width: 40 }}>
                                <input
                                    type="checkbox"
                                    checked={selected.length === pages.length && pages.length > 0}
                                    onChange={e => toggleAll(e.target.checked)}
                                />
                            </th>
                            <th style={s.th}>Title</th>
                            <th style={s.th}>Status</th>
                            <th style={s.th}>Template</th>
                            <th style={s.th}>Author</th>
                            <th style={s.th}>URL Path</th>
                            <th style={s.th}>Last Modified</th>
                            <th style={s.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.length === 0 && (
                            <tr>
                                <td colSpan={8} style={s.empty}>No pages found.</td>
                            </tr>
                        )}
                        {pages.map(page => {
                            const sc = STATUS_COLORS[page.status] ?? STATUS_COLORS.draft;
                            return (
                                <tr key={page.id} style={s.row}>
                                    <td style={s.td}>
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(page.id)}
                                            onChange={() => toggleOne(page.id)}
                                        />
                                    </td>
                                    <td style={s.td}>
                                        <Link href={`/admin/pages/${page.id}/edit`} style={s.titleLink}>
                                            {page.title || <em style={{ color: '#aaa' }}>(no title)</em>}
                                        </Link>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>
                                            {page.status}
                                        </span>
                                    </td>
                                    <td style={{ ...s.td, fontSize: '12px', color: '#7A909E' }}>
                                        {page.template || 'default'}
                                    </td>
                                    <td style={{ ...s.td, fontSize: '12px', color: '#7A909E' }}>
                                        {page.createdBy?.name || '—'}
                                    </td>
                                    <td style={{ ...s.td, fontSize: '12px', color: '#7A909E', maxWidth: 200 }}>
                                        <span style={s.pathChip}>/{page.fullPath}</span>
                                    </td>
                                    <td style={{ ...s.td, fontSize: '12px', color: '#7A909E', whiteSpace: 'nowrap' }}>
                                        {new Date(page.updatedAt).toLocaleDateString('en-GB', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        })}
                                    </td>
                                    <td style={s.td}>
                                        <div style={s.actions}>
                                            <Link href={`/admin/pages/${page.id}/edit`} style={s.actionBtn} title="Edit">
                                                ✏️
                                            </Link>
                                            <a
                                                href={`/${page.fullPath}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={s.actionBtn}
                                                title="View"
                                            >
                                                👁
                                            </a>
                                            <button
                                                onClick={() => quickAction(page.id, 'duplicate')}
                                                style={s.actionBtnBtn}
                                                title="Duplicate"
                                            >
                                                ⧉
                                            </button>
                                            {page.status !== 'trash' ? (
                                                <button
                                                    onClick={() => quickAction(page.id, 'trash')}
                                                    style={{ ...s.actionBtnBtn, color: '#dc2626' }}
                                                    title="Trash"
                                                >
                                                    🗑
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => quickAction(page.id, 'restore')}
                                                        style={s.actionBtnBtn}
                                                        title="Restore"
                                                    >
                                                        ↩
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Permanently delete this page?')) {
                                                                quickAction(page.id, 'delete');
                                                            }
                                                        }}
                                                        style={{ ...s.actionBtnBtn, color: '#dc2626' }}
                                                        title="Delete permanently"
                                                    >
                                                        ✕
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
                    <span style={s.pageInfo}>
                        Page {currentPage} of {totalPages} ({total} total)
                    </span>
                    <div style={s.pageBtns}>
                        {currentPage > 1 && (
                            <Link
                                href={`/admin/pages?status=${currentStatus}&search=${currentSearch}&p=${currentPage - 1}`}
                                style={s.pageBtn}
                            >
                                ← Prev
                            </Link>
                        )}
                        {currentPage < totalPages && (
                            <Link
                                href={`/admin/pages?status=${currentStatus}&search=${currentSearch}&p=${currentPage + 1}`}
                                style={s.pageBtn}
                            >
                                Next →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    wrap:     { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', overflow: 'hidden', marginTop: '20px' },
    toolbar:  { padding: '14px 20px', borderBottom: '1px solid #E2EAF0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
    searchForm: { display: 'flex', gap: '8px' },
    searchInput: { padding: '7px 12px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', width: '240px', outline: 'none' },
    searchBtn: { padding: '7px 14px', background: '#F0F4F8', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
    bulkBar:  { display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' },
    bulkCount:{ fontSize: '13px', color: '#7A909E' },
    bulkBtn:  { padding: '6px 12px', background: '#F0F4F8', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#1A2B3C' },
    tableWrap:{ overflowX: 'auto' },
    table:    { width: '100%', borderCollapse: 'collapse' },
    thead:    { background: '#F8FAFC' },
    th:       { padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#7A909E', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2EAF0', whiteSpace: 'nowrap' },
    td:       { padding: '12px 16px', fontSize: '13.5px', color: '#1A2B3C', borderBottom: '1px solid #F0F4F8', verticalAlign: 'middle' },
    row:      { transition: 'background 0.1s' },
    titleLink:{ color: '#0A1628', textDecoration: 'none', fontWeight: 600, fontSize: '14px' },
    badge:    { display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' },
    pathChip: { background: '#F0F4F8', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' },
    actions:  { display: 'flex', gap: '4px', alignItems: 'center' },
    actionBtn:{ fontSize: '15px', padding: '4px 6px', borderRadius: '5px', textDecoration: 'none', background: 'transparent', cursor: 'pointer', border: 'none', display: 'inline-flex' },
    actionBtnBtn: { fontSize: '15px', padding: '4px 6px', borderRadius: '5px', background: 'transparent', cursor: 'pointer', border: 'none' },
    empty:    { padding: '48px', textAlign: 'center', color: '#7A909E', fontSize: '14px' },
    pagination:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #E2EAF0' },
    pageInfo: { fontSize: '13px', color: '#7A909E' },
    pageBtns: { display: 'flex', gap: '8px' },
    pageBtn:  { padding: '6px 14px', background: '#F0F4F8', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', color: '#1A2B3C' },
};
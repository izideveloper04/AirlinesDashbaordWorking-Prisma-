'use client';
// components/admin/MediaClient.tsx
import { useState, useEffect, useRef, useCallback } from 'react';

type MediaItem = {
    id:           number;
    filename:     string;
    originalName: string;
    url:          string;
    alt:          string;
    title:        string;
    size:         number;
    mimeType:     string;
    createdAt:    string;
    uploadedBy:   { name: string } | null;
};

type Props = {
    initialItems: MediaItem[];
    initialTotal: number;
    perPage:      number;
};

function formatSize(bytes: number) {
    if (bytes < 1024)             return `${bytes} B`;
    if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function mimeLabel(mime: string) {
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG';
    if (mime.includes('png'))  return 'PNG';
    if (mime.includes('webp')) return 'WebP';
    if (mime.includes('gif'))  return 'GIF';
    if (mime.includes('svg'))  return 'SVG';
    return mime.split('/')[1]?.toUpperCase() || mime;
}

export default function MediaClient({ initialItems, initialTotal, perPage }: Props) {
    const [view,       setView]       = useState<'grid' | 'list'>('grid');
    const [items,      setItems]      = useState<MediaItem[]>(initialItems);
    const [total,      setTotal]      = useState(initialTotal);
    const [page,       setPage]       = useState(1);
    const [search,     setSearch]     = useState('');
    const [loading,    setLoading]    = useState(false);
    const [selected,   setSelected]   = useState<MediaItem | null>(null);
    const [editAlt,    setEditAlt]    = useState('');
    const [editTitle,  setEditTitle]  = useState('');
    const [saving,     setSaving]     = useState(false);
    const [deleting,   setDeleting]   = useState(false);
    const [uploading,  setUploading]  = useState(false);
    const [uploadErr,  setUploadErr]  = useState('');
    const [copyMsg,    setCopyMsg]    = useState('');
    const [dragOver,   setDragOver]   = useState(false);
    const [saveMsg,    setSaveMsg]    = useState('');
    const fileInput = useRef<HTMLInputElement>(null);
    const totalPages = Math.ceil(total / perPage);

    // ── Fetch ──────────────────────────────────────────────
    const fetchItems = useCallback(async (pg: number, q: string) => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/admin/media?page=${pg}&search=${encodeURIComponent(q)}`);
            const data = await res.json();
            setItems(data.items);
            setTotal(data.total);
            setPage(pg);
            setSelected(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => fetchItems(1, search), 350);
        return () => clearTimeout(t);
    }, [search, fetchItems]);

    // ── Select ─────────────────────────────────────────────
    function selectItem(item: MediaItem) {
        setSelected(item);
        setEditAlt(item.alt);
        setEditTitle(item.title || item.originalName.replace(/\.[^.]+$/, ''));
        setCopyMsg('');
        setSaveMsg('');
    }

    // ── Upload ─────────────────────────────────────────────
    async function uploadFile(file: File) {
        setUploading(true);
        setUploadErr('');
        try {
            const form = new FormData();
            form.append('file', file);
            const res  = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok) { setUploadErr(data.error || 'Upload failed'); return; }
            await fetchItems(1, search);
        } catch (e: any) {
            setUploadErr(e.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    }

    // ── Save details ───────────────────────────────────────
    async function saveDetails() {
        if (!selected) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/media/${selected.id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ alt: editAlt, title: editTitle }),
            });
            if (!res.ok) return;
            const updated = { ...selected, alt: editAlt, title: editTitle };
            setItems(prev => prev.map(i => i.id === selected.id ? updated : i));
            setSelected(updated);
            setSaveMsg('Saved!');
            setTimeout(() => setSaveMsg(''), 2000);
        } finally {
            setSaving(false);
        }
    }

    // ── Delete ─────────────────────────────────────────────
    async function deleteItem() {
        if (!selected) return;
        if (!confirm(`Delete "${selected.originalName}" permanently? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/media/${selected.id}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== selected.id));
                setTotal(t => t - 1);
                setSelected(null);
            }
        } finally {
            setDeleting(false);
        }
    }

    // ── Copy URL ───────────────────────────────────────────
    function copyUrl() {
        if (!selected) return;
        const text = selected.url;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
        setCopyMsg('Copied!');
        setTimeout(() => setCopyMsg(''), 2000);
    }

    function fallbackCopy(text: string) {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity  = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    // ══════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════
    return (
        <div
            style={s.root}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {dragOver && (
                <div style={s.dragOverlay}>
                    <div style={s.dragMsg}>Drop image to upload</div>
                </div>
            )}

            {/* ── Header ── */}
            <div style={s.header}>
                <div style={s.headerLeft}>
                    <h1 style={s.pageTitle}>Media Library</h1>
                    <span style={s.totalBadge}>{total} file{total !== 1 ? 's' : ''}</span>
                </div>
                <div style={s.headerRight}>
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search files…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={s.searchInput}
                    />

                    {/* View toggle */}
                    <div style={s.viewToggle}>
                        <button
                            onClick={() => setView('grid')}
                            style={{ ...s.toggleBtn, ...(view === 'grid' ? s.toggleBtnActive : {}) }}
                            title="Grid view"
                        >
                            ⊞
                        </button>
                        <button
                            onClick={() => setView('list')}
                            style={{ ...s.toggleBtn, ...(view === 'list' ? s.toggleBtnActive : {}) }}
                            title="List view"
                        >
                            ☰
                        </button>
                    </div>

                    {/* Upload button */}
                    <button
                        onClick={() => fileInput.current?.click()}
                        disabled={uploading}
                        style={s.uploadBtn}
                    >
                        {uploading ? 'Uploading…' : '+ Add New'}
                    </button>
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {uploadErr && <div style={s.uploadErr}>{uploadErr}</div>}

            {/* ── Body: media area + detail panel ── */}
            <div style={s.body}>

                {/* ── Media area ── */}
                <div style={{ ...s.mediaArea, flex: selected ? '1 1 0' : '1 1 auto' }}>

                    {loading ? (
                        <div style={s.empty}>Loading…</div>
                    ) : items.length === 0 ? (
                        <div style={s.emptyState}>
                            <div style={s.emptyIcon}>🖼</div>
                            <div style={s.emptyText}>No media found</div>
                            <button onClick={() => fileInput.current?.click()} style={s.emptyUploadBtn}>
                                Upload your first file
                            </button>
                        </div>
                    ) : view === 'grid' ? (
                        <GridView items={items} selected={selected} onSelect={selectItem} />
                    ) : (
                        <ListView items={items} selected={selected} onSelect={selectItem} />
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={s.pagination}>
                            <button
                                disabled={page <= 1}
                                onClick={() => fetchItems(page - 1, search)}
                                style={s.pageBtn}
                            >
                                ← Prev
                            </button>
                            <span style={s.pageInfo}>Page {page} of {totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => fetchItems(page + 1, search)}
                                style={s.pageBtn}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Detail panel ── */}
                {selected && (
                    <aside style={s.detailPanel}>

                        {/* Close */}
                        <div style={s.detailHeader}>
                            <span style={s.detailTitle}>Attachment Details</span>
                            <button onClick={() => setSelected(null)} style={s.closeBtn}>✕</button>
                        </div>

                        {/* Preview */}
                        <div style={s.previewWrap}>
                            <img
                                src={selected.url}
                                alt={selected.alt || selected.originalName}
                                style={s.previewImg}
                            />
                        </div>

                        {/* Meta */}
                        <div style={s.metaBlock}>
                            <div style={s.metaName}>{selected.originalName}</div>
                            <div style={s.metaRow}><span style={s.metaKey}>Uploaded</span><span style={s.metaVal}>{formatDate(selected.createdAt)}</span></div>
                            <div style={s.metaRow}><span style={s.metaKey}>By</span><span style={s.metaVal}>{selected.uploadedBy?.name || '—'}</span></div>
                            <div style={s.metaRow}><span style={s.metaKey}>Type</span><span style={s.metaVal}>{mimeLabel(selected.mimeType)}</span></div>
                            <div style={s.metaRow}><span style={s.metaKey}>Size</span><span style={s.metaVal}>{formatSize(selected.size)}</span></div>
                        </div>

                        <hr style={s.divider} />

                        {/* URL copy */}
                        <div style={s.fieldGroup}>
                            <label style={s.fieldLabel}>File URL</label>
                            <div style={s.urlRow}>
                                <input
                                    readOnly
                                    value={selected.url}
                                    style={s.urlInput}
                                    onClick={e => (e.target as HTMLInputElement).select()}
                                />
                                <button onClick={copyUrl} style={s.copyBtn}>
                                    {copyMsg || 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Alt text */}
                        <div style={s.fieldGroup}>
                            <label style={s.fieldLabel}>Alt Text</label>
                            <input
                                type="text"
                                value={editAlt}
                                onChange={e => setEditAlt(e.target.value)}
                                placeholder="Describe this image…"
                                style={s.fieldInput}
                            />
                            <div style={s.fieldHint}>Describe the image for screen readers and search engines.</div>
                        </div>

                        {/* Title */}
                        <div style={s.fieldGroup}>
                            <label style={s.fieldLabel}>Title</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                placeholder="File title…"
                                style={s.fieldInput}
                            />
                        </div>

                        {/* Save */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <button
                                onClick={saveDetails}
                                disabled={saving}
                                style={s.saveBtn}
                            >
                                {saving ? 'Saving…' : 'Update'}
                            </button>
                            {saveMsg && <span style={s.savedMsg}>{saveMsg}</span>}
                        </div>

                        <hr style={s.divider} />

                        {/* Delete */}
                        <button
                            onClick={deleteItem}
                            disabled={deleting}
                            style={s.deleteBtn}
                        >
                            {deleting ? 'Deleting…' : 'Delete Permanently'}
                        </button>
                    </aside>
                )}
            </div>
        </div>
    );
}

// ── Grid View ─────────────────────────────────────────────
function GridView({ items, selected, onSelect }: {
    items:    MediaItem[];
    selected: MediaItem | null;
    onSelect: (item: MediaItem) => void;
}) {
    return (
        <div style={g.grid}>
            {items.map(item => {
                const isSelected = selected?.id === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        style={{
                            ...g.cell,
                            ...(isSelected ? g.cellSelected : {}),
                        }}
                        title={item.originalName}
                    >
                        <img
                            src={item.url}
                            alt={item.alt || item.originalName}
                            style={g.thumb}
                            loading="lazy"
                        />
                        {isSelected && <div style={g.checkmark}>✓</div>}
                        <div style={g.cellName}>{item.originalName}</div>
                    </button>
                );
            })}
        </div>
    );
}

// ── List View ─────────────────────────────────────────────
function ListView({ items, selected, onSelect }: {
    items:    MediaItem[];
    selected: MediaItem | null;
    onSelect: (item: MediaItem) => void;
}) {
    return (
        <div style={l.table}>
            {/* Header */}
            <div style={l.headerRow}>
                <div style={l.colThumb}></div>
                <div style={{ ...l.col, flex: 3 }}>File</div>
                <div style={l.col}>Author</div>
                <div style={l.col}>Type</div>
                <div style={l.col}>Size</div>
                <div style={l.col}>Date</div>
            </div>

            {/* Rows */}
            {items.map(item => {
                const isSelected = selected?.id === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        style={{
                            ...l.row,
                            ...(isSelected ? l.rowSelected : {}),
                        }}
                    >
                        <div style={l.colThumb}>
                            <img
                                src={item.url}
                                alt={item.alt || item.originalName}
                                style={l.thumb}
                                loading="lazy"
                            />
                        </div>
                        <div style={{ ...l.col, flex: 3, textAlign: 'left' }}>
                            <div style={l.fileName}>{item.title || item.originalName.replace(/\.[^.]+$/, '')}</div>
                            <div style={l.fileOrig}>{item.originalName}</div>
                        </div>
                        <div style={l.col}>{item.uploadedBy?.name || '—'}</div>
                        <div style={l.col}>{mimeLabel(item.mimeType)}</div>
                        <div style={l.col}>{formatSize(item.size)}</div>
                        <div style={l.col}>{formatDate(item.createdAt)}</div>
                    </button>
                );
            })}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
    root:           { position: 'relative', minHeight: '60vh' },
    dragOverlay:    { position: 'fixed', inset: 0, background: 'rgba(27,108,168,0.15)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', border: '3px dashed #1B6CA8', borderRadius: '12px', pointerEvents: 'none' },
    dragMsg:        { background: '#1B6CA8', color: '#fff', padding: '20px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 700 },
    header:         { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' },
    headerLeft:     { display: 'flex', alignItems: 'center', gap: '10px' },
    pageTitle:      { fontSize: '22px', fontWeight: 800, color: '#0A1628', margin: 0 },
    totalBadge:     { background: '#E8F4FD', color: '#1B6CA8', borderRadius: '99px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 },
    headerRight:    { display: 'flex', alignItems: 'center', gap: '10px' },
    searchInput:    { padding: '8px 12px', border: '1px solid #E2EAF0', borderRadius: '7px', fontSize: '13px', width: '200px', outline: 'none', color: '#1A2B3C' },
    viewToggle:     { display: 'flex', border: '1px solid #E2EAF0', borderRadius: '7px', overflow: 'hidden' },
    toggleBtn:      { padding: '7px 12px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#7A909E', lineHeight: 1 },
    toggleBtnActive:{ background: '#1B6CA8', color: '#fff' },
    uploadBtn:      { padding: '8px 18px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' },
    uploadErr:      { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '7px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px' },
    body:           { display: 'flex', gap: '20px', alignItems: 'flex-start' },
    mediaArea:      { minWidth: 0 },
    empty:          { textAlign: 'center', padding: '60px', color: '#7A909E', fontSize: '15px' },
    emptyState:     { textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    emptyIcon:      { fontSize: '48px', opacity: 0.3 },
    emptyText:      { fontSize: '16px', color: '#7A909E', fontWeight: 600 },
    emptyUploadBtn: { padding: '10px 24px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' },
    pagination:     { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2EAF0' },
    pageBtn:        { padding: '7px 16px', border: '1px solid #E2EAF0', borderRadius: '7px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#1A2B3C' },
    pageInfo:       { fontSize: '13px', color: '#7A909E' },

    // Detail panel
    detailPanel:    { width: '300px', flexShrink: 0, background: '#fff', border: '1px solid #E2EAF0', borderRadius: '12px', overflow: 'hidden', position: 'sticky', top: '80px', alignSelf: 'flex-start' },
    detailHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #E2EAF0' },
    detailTitle:    { fontSize: '13px', fontWeight: 700, color: '#0A1628' },
    closeBtn:       { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#7A909E', padding: '0 2px', lineHeight: 1 },
    previewWrap:    { background: '#0A1628', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' },
    previewImg:     { width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' },
    metaBlock:      { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '5px' },
    metaName:       { fontSize: '13px', fontWeight: 700, color: '#0A1628', wordBreak: 'break-all', marginBottom: '6px' },
    metaRow:        { display: 'flex', gap: '6px', fontSize: '12px' },
    metaKey:        { color: '#7A909E', flexShrink: 0, width: '56px' },
    metaVal:        { color: '#1A2B3C', fontWeight: 500 },
    divider:        { border: 'none', borderTop: '1px solid #E2EAF0', margin: '0' },
    fieldGroup:     { padding: '12px 16px 0' },
    fieldLabel:     { display: 'block', fontSize: '11px', fontWeight: 700, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' },
    fieldInput:     { width: '100%', padding: '7px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', color: '#1A2B3C', boxSizing: 'border-box', outline: 'none' },
    fieldHint:      { fontSize: '11px', color: '#7A909E', marginTop: '4px', lineHeight: 1.4 },
    urlRow:         { display: 'flex', gap: '6px' },
    urlInput:       { flex: 1, padding: '7px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '12px', color: '#7A909E', background: '#F8FAFC', outline: 'none', minWidth: 0 },
    copyBtn:        { padding: '7px 10px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: '#1B6CA8', flexShrink: 0 },
    saveBtn:        { padding: '8px 20px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginLeft: '16px', marginBottom: '4px' },
    savedMsg:       { fontSize: '12px', color: '#16a34a', fontWeight: 600 },
    deleteBtn:      { display: 'block', width: 'calc(100% - 32px)', margin: '12px 16px 16px', padding: '9px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' },
};

// Grid styles
const g: Record<string, React.CSSProperties> = {
    grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' },
    cell:         { background: '#fff', border: '2px solid #E2EAF0', borderRadius: '8px', cursor: 'pointer', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'border-color 0.15s', textAlign: 'left' },
    cellSelected: { borderColor: '#1B6CA8', boxShadow: '0 0 0 3px rgba(27,108,168,0.15)' },
    thumb:        { width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', background: '#F8FAFC' },
    checkmark:    { position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: '#1B6CA8', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 },
    cellName:     { padding: '6px 8px', fontSize: '11px', color: '#4A6070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderTop: '1px solid #E2EAF0' },
};

// List styles
const l: Record<string, React.CSSProperties> = {
    table:      { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', overflow: 'hidden' },
    headerRow:  { display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2EAF0', fontSize: '11px', fontWeight: 700, color: '#7A909E', textTransform: 'uppercase', letterSpacing: '0.05em', gap: '12px' },
    row:        { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', width: '100%', background: 'none', border: 'none', cursor: 'pointer', gap: '12px', transition: 'background 0.1s', textAlign: 'left' },
    rowSelected:{ background: '#EFF6FF', borderLeft: '3px solid #1B6CA8' },
    colThumb:   { width: '64px', flexShrink: 0 },
    col:        { flex: 1, fontSize: '13px', color: '#4A6070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' },
    thumb:      { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', display: 'block', border: '1px solid #E2EAF0', background: '#F8FAFC' },
    fileName:   { fontSize: '13px', fontWeight: 600, color: '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    fileOrig:   { fontSize: '11px', color: '#7A909E', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

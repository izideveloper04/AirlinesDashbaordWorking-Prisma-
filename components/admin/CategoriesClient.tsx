'use client';
// components/admin/CategoriesClient.tsx
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Category = {
    id:     number;
    name:   string;
    slug:   string;
    _count: { posts: number };
};

type Props = { categories: Category[] };

export default function CategoriesClient({ categories: initial }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [cats,    setCats]    = useState<Category[]>(initial);
    const [newName, setNewName] = useState('');
    const [adding,  setAdding]  = useState(false);
    const [editId,  setEditId]  = useState<number | null>(null);
    const [editName,setEditName]= useState('');
    const [error,   setError]   = useState('');

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setAdding(true);
        setError('');
        const res  = await fetch('/api/admin/categories', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name: newName.trim() }),
        });
        const cat = await res.json();
        setAdding(false);
        if (!res.ok) { setError(cat.error || 'Failed to add.'); return; }
        setCats(prev => [...prev.filter(c => c.id !== cat.id), { ...cat, _count: { posts: 0 } }]
            .sort((a, b) => a.name.localeCompare(b.name)));
        setNewName('');
    }

    async function handleUpdate(id: number) {
        if (!editName.trim()) return;
        const res  = await fetch(`/api/admin/categories/${id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name: editName.trim() }),
        });
        const cat = await res.json();
        if (!res.ok) { setError(cat.error || 'Failed to update.'); return; }
        setCats(prev => prev.map(c => c.id === id ? { ...c, name: cat.name, slug: cat.slug } : c)
            .sort((a, b) => a.name.localeCompare(b.name)));
        setEditId(null);
        setEditName('');
    }

    async function handleDelete(id: number, name: string) {
        if (!confirm(`Delete category "${name}"? Posts in this category will not be deleted.`)) return;
        await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        setCats(prev => prev.filter(c => c.id !== id));
    }

    return (
        <div>
            <div style={s.header}>
                <div>
                    <h1 style={s.heading}>Categories</h1>
                    <p style={s.sub}>{cats.length} total</p>
                </div>
            </div>

            <div style={s.layout}>
                {/* Add new */}
                <div style={s.addCard}>
                    <div style={s.cardTitle}>Add New Category</div>
                    <form onSubmit={handleAdd}>
                        <div style={s.formRow}>
                            <label style={s.label}>Name</label>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="e.g. Airlines"
                                style={s.input}
                                required
                            />
                        </div>
                        <div style={s.formRow}>
                            <label style={s.label}>Slug (auto-generated)</label>
                            <div style={s.slugPreview}>
                                {newName
                                    ? newName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                                    : <span style={{ color: '#C4D0DB' }}>will-be-auto-generated</span>
                                }
                            </div>
                        </div>
                        {error && <div style={s.error}>{error}</div>}
                        <button type="submit" disabled={adding || !newName.trim()} style={s.addBtn}>
                            {adding ? 'Adding…' : 'Add Category'}
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div style={s.tableWrap}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.thead}>
                                <th style={s.th}>Name</th>
                                <th style={s.th}>Slug</th>
                                <th style={s.th}>Posts</th>
                                <th style={s.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cats.length === 0 && (
                                <tr><td colSpan={4} style={s.empty}>No categories yet. Add one on the left.</td></tr>
                            )}
                            {cats.map(cat => (
                                <tr key={cat.id} style={s.tr}>
                                    <td style={s.td}>
                                        {editId === cat.id ? (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    style={{ ...s.input, margin: 0 }}
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdate(cat.id)} style={s.saveBtn}>Save</button>
                                                <button onClick={() => { setEditId(null); setEditName(''); }} style={s.cancelBtn}>Cancel</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontWeight: 600, color: '#0A1628' }}>{cat.name}</span>
                                        )}
                                    </td>
                                    <td style={{ ...s.td, color: '#7A909E', fontSize: '12px' }}>{cat.slug}</td>
                                    <td style={{ ...s.td, color: '#7A909E', fontSize: '13px' }}>
                                        <a href={`/category/${cat.slug}`} target="_blank" rel="noreferrer" style={s.countLink}>
                                            {cat._count.posts}
                                        </a>
                                    </td>
                                    <td style={s.td}>
                                        {editId !== cat.id && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                                                    style={s.actionBtn}
                                                >
                                                    Edit
                                                </button>
                                                <a href={`/category/${cat.slug}`} target="_blank" rel="noreferrer" style={s.actionBtn}>View</a>
                                                <button
                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                    style={{ ...s.actionBtn, color: '#dc2626' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    heading:    { fontSize: '22px', fontWeight: 800, color: '#0A1628', margin: 0 },
    sub:        { fontSize: '13px', color: '#7A909E', margin: '3px 0 0' },
    layout:     { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' },
    addCard:    { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', padding: '20px' },
    cardTitle:  { fontSize: '14px', fontWeight: 700, color: '#0A1628', marginBottom: '16px' },
    formRow:    { marginBottom: '14px' },
    label:      { display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6070', marginBottom: '5px' },
    input:      { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '0' },
    slugPreview:{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', color: '#4A6070', minHeight: '36px' },
    error:      { color: '#dc2626', fontSize: '12px', marginBottom: '10px' },
    addBtn:     { background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '7px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', width: '100%' },
    tableWrap:  { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', overflow: 'hidden' },
    table:      { width: '100%', borderCollapse: 'collapse' },
    thead:      { background: '#F8FAFC' },
    th:         { padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: '#7A909E', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2EAF0' },
    tr:         { borderBottom: '1px solid #F0F4F8' },
    td:         { padding: '13px 14px', fontSize: '13.5px', color: '#1A2B3C', verticalAlign: 'middle' },
    countLink:  { color: '#1B6CA8', textDecoration: 'none', fontWeight: 600 },
    actionBtn:  { padding: '4px 10px', fontSize: '12px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '5px', cursor: 'pointer', color: '#1A2B3C', textDecoration: 'none', fontWeight: 500 },
    saveBtn:    { padding: '6px 12px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' },
    cancelBtn:  { padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2EAF0', color: '#1A2B3C', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
    empty:      { textAlign: 'center', padding: '48px', color: '#7A909E', fontSize: '14px' },
};

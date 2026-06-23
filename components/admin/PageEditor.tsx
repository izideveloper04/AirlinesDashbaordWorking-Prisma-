'use client';
// components/admin/PageEditor.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';

// Generate preview token client-side using page ID
// Note: this is just for constructing the URL — actual validation happens server-side
function generateToken(pageId: number): string {
    // We can't use crypto.createHmac on the client, so we fetch it instead
    // The preview page validates the token server-side
    return btoa(`preview-${pageId}`).slice(0, 24);
}

type PageData = {
    id?:                number;
    title:              string;
    slug:               string;
    fullPath:           string;
    status:             string;
    template:           string;
    templateFile:       string;
    parentId:           number | null;
    featuredImage:      string;
    featuredImageLocal: string;
    metaTitle:          string;
    metaDescription:    string;
    menuOrder:          number;
    featuredImageAlt: string;
} | null;

type Props = {
    page:            PageData;
    allPages:        { id: number; title: string; fullPath: string }[];
    currentUserId:   number;
    currentUserName: string;
    isLocked:        boolean;
    lockedBy:        string | null;
};

const TEMPLATES = [
    { value: 'default',  label: 'Default'      },
    { value: 'home',     label: 'Home'          },
    { value: 'parent',   label: 'Parent Page'   },
    { value: 'child',    label: 'Child Page'    },
];



export default function PageEditor({ page, allPages, currentUserId, currentUserName, isLocked: initialLocked, lockedBy: initialLockedBy }: Props) {
    const router = useRouter();
    const isNew  = !page?.id;

    // Form state
    const [title,          setTitle]          = useState(page?.title          || '');
    const [slug,           setSlug]           = useState(page?.slug           || '');
    const [fullPath,       setFullPath]       = useState(page?.fullPath       || '');
    const [status,         setStatus]         = useState(page?.status         || 'draft');
    const [template,       setTemplate]       = useState(page?.template       || 'default');
    const [parentId,       setParentId]       = useState<number | null>(page?.parentId || null);
    const [featuredImage,  setFeaturedImage]  = useState(page?.featuredImage  || '');
    const [metaTitle,      setMetaTitle]      = useState(page?.metaTitle      || '');
    const [metaDesc,       setMetaDesc]       = useState(page?.metaDescription|| '');
    const [menuOrder,      setMenuOrder]      = useState(page?.menuOrder      || 0);
    const [saving,         setSaving]         = useState(false);
    const [saveMsg,        setSaveMsg]        = useState('');
    const [error,          setError]          = useState('');
    const [locked,         setLocked]         = useState(initialLocked);
    const [lockedBy,       setLockedBy]       = useState(initialLockedBy);
    const [linkUrl,        setLinkUrl]        = useState('');
    const [showLinkBox,    setShowLinkBox]    = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [featuredImageAlt, setFeaturedImageAlt] = useState(page?.featuredImageAlt || '');
    const [uploadError,    setUploadError]    = useState('');
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const titleRef     = useRef<HTMLInputElement>(null);

    async function uploadFeaturedImage(file: File) {
        setUploadingImage(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('file', file);

        const res  = await fetch('/api/admin/media/upload', {
            method: 'POST',
            body:   formData,
        });
        const data = await res.json();

        setUploadingImage(false);

        if (!res.ok) {
            setUploadError(data.error || 'Upload failed.');
            return;
        }

        // data.url is already the local path e.g. /images/uploads/filename.jpg
        setFeaturedImage(data.url);      // sets featuredImage
    }

    // Auto-generate slug from title
    function slugify(str: string) {
        return str.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    function handleTitleChange(val: string) {
        setTitle(val);
        if (isNew) {
            const s = slugify(val);
            setSlug(s);
            setFullPath(parentId
                ? `${allPages.find(p => p.id === parentId)?.fullPath}/${s}`
                : s
            );
        }
    }

    function handleParentChange(pid: number | null) {
        setParentId(pid);
        const parent = allPages.find(p => p.id === pid);
        setFullPath(parent ? `${parent.fullPath}/${slug}` : slug);
    }

    // TipTap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
            Image.configure({ inline: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Start writing your page content here…' }),
            CharacterCount,
        ],
        content:  page?.content || '',
        editable: !locked,
    });

    // Lock management
    useEffect(() => {
        if (isNew || locked) return;

        async function acquireLock() {
            const res  = await fetch('/api/admin/pages/lock', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ pageId: page!.id, action: 'acquire' }),
            });
            const data = await res.json();
            if (data.locked) {
                setLocked(true);
                setLockedBy(data.lockedBy);
                editor?.setEditable(false);
            }
        }

        acquireLock();

        // Heartbeat every 60 seconds
        heartbeatRef.current = setInterval(() => {
            fetch('/api/admin/pages/lock', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ pageId: page!.id, action: 'heartbeat' }),
            });
        }, 60_000);

        // Release lock on unmount
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            if (page?.id) {
                fetch('/api/admin/pages/lock', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ pageId: page.id, action: 'release' }),
                    keepalive: true,
                });
            }
        };
    }, [page?.id, isNew]);

    async function takeover() {
        await fetch('/api/admin/pages/lock', {
            method:  'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ pageId: page!.id }),
        });
        setLocked(false);
        setLockedBy(null);
        editor?.setEditable(true);
    }

    // Save
    const handleSave = useCallback(async (saveStatus?: string) => {
        setSaving(true);
        setError('');

        const res = await fetch('/api/admin/pages/save', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                id:            page?.id,
                title,
                slug,
                fullPath,
                content:       editor?.getHTML() || '',
                status:        saveStatus || status,
                template,
                templateFile:  page?.templateFile || '',
                parentId,
                parentSlug:    allPages.find(p => p.id === parentId)?.fullPath?.split('/').pop() || '',
                parentFullPath:allPages.find(p => p.id === parentId)?.fullPath || '',
                featuredImage,
                // If featuredImage starts with /images/uploads/ it's a local upload
                featuredImageLocal: featuredImage.startsWith('/images/uploads/')
                    ? featuredImage
                    : page?.featuredImageLocal || '',
                metaTitle,
                metaDescription: metaDesc,
                menuOrder,
                featuredImageAlt,
            }),
        });

        const data = await res.json();
        setSaving(false);

        if (!res.ok) {
            setError(data.error || 'Failed to save.');
            return;
        }

        setSaveMsg(saveStatus === 'published' ? '✅ Published!' : '✅ Saved!');
        setTimeout(() => setSaveMsg(''), 3000);

        if (isNew && data.id) {
            router.push(`/admin/pages/${data.id}/edit`);
        }
    }, [title, slug, fullPath, status, template, parentId, featuredImage, metaTitle, metaDesc, menuOrder, editor]);

    // Link insertion
    function insertLink() {
        if (!linkUrl) return;
        editor?.chain().focus().setLink({ href: linkUrl }).run();
        setLinkUrl('');
        setShowLinkBox(false);
    }

    function insertImage() {
        const url = prompt('Enter image URL:');
        if (url) editor?.chain().focus().setImage({ src: url }).run();
    }

    const wordCount = editor?.storage.characterCount?.words() || 0;

    return (
        <div style={s.root}>

            {/* Top bar */}
            <div style={s.topBar}>
                <div style={s.topBarLeft}>
                    <button onClick={() => router.push('/admin/pages')} style={s.backBtn}>← Pages</button>
                    <h1 style={s.heading}>{isNew ? 'Add New Page' : 'Edit Page'}</h1>
                </div>
                <div style={s.topBarRight}>
                    {saveMsg && <span style={s.saveMsg}>{saveMsg}</span>}
                    {error   && <span style={s.errorMsg}>{error}</span>}
                    <button onClick={() => handleSave('draft')} disabled={saving || locked} style={s.draftBtn}>
                        {saving ? 'Saving…' : 'Save Draft'}
                    </button>
                    <button onClick={() => handleSave('published')} disabled={saving || locked} style={s.publishBtn}>
                        {saving ? 'Saving…' : 'Publish'}
                    </button>
                    {/* View page button — only shows if page has a fullPath */}
                    
                    {page?.id && (
                        <a
                            href={status === 'published' ? `/${fullPath}` : `/preview/${page.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                ...s.viewBtn,
                                ...(status !== 'published' ? {
                                    background:   '#fef9c3',
                                    borderColor:  '#fde68a',
                                    color:        '#92400e',
                                } : {}),
                            }}
                        >
                            {status === 'published' ? 'View Page ↗' : '👁 Preview Draft ↗'}
                        </a>
                    )}

                </div>
            </div>

            {/* Lock banner */}
            {locked && (
                <div style={s.lockBanner}>
                    <span>⚠️ <strong>{lockedBy}</strong> is currently editing this page. Editing is disabled.</span>
                    <button onClick={takeover} style={s.takeoverBtn}>Take Over Editing</button>
                </div>
            )}

            <div style={s.layout}>

                {/* ── Main content area ── */}
                <div style={s.main}>

                    {/* Title */}
                    <input
                        ref={titleRef}
                        value={title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="Page title"
                        style={s.titleInput}
                        disabled={locked}
                    />

                    {/* Slug */}
                    <div style={s.slugRow}>
                        <span style={s.slugLabel}>URL:</span>
                        <span style={s.slugPrefix}>/</span>
                        <input
                            value={fullPath}
                            onChange={e => setFullPath(e.target.value)}
                            style={s.slugInput}
                            disabled={locked}
                        />
                    </div>

                    {/* Editor toolbar */}
                    {editor && (
                        <div style={s.toolbar}>
                            {/* Text format */}
                            <select
                                onChange={e => {
                                    const v = e.target.value;
                                    if (v === 'p') editor.chain().focus().setParagraph().run();
                                    else editor.chain().focus().toggleHeading({ level: parseInt(v) as 1|2|3|4 }).run();
                                }}
                                style={s.toolSelect}
                            >
                                <option value="p">Paragraph</option>
                                <option value="1">Heading 1</option>
                                <option value="2">Heading 2</option>
                                <option value="3">Heading 3</option>
                                <option value="4">Heading 4</option>
                            </select>

                            <div style={s.toolSep} />

                            {/* Bold, Italic, Underline, Strike */}
                            {[
                                { label: 'B',  title: 'Bold',          action: () => editor.chain().focus().toggleBold().run(),          active: editor.isActive('bold')      },
                                { label: 'I',  title: 'Italic',        action: () => editor.chain().focus().toggleItalic().run(),        active: editor.isActive('italic')    },
                                { label: 'U',  title: 'Underline',     action: () => editor.chain().focus().toggleUnderline().run(),     active: editor.isActive('underline') },
                                { label: 'S',  title: 'Strikethrough', action: () => editor.chain().focus().toggleStrike().run(),        active: editor.isActive('strike')    },
                            ].map(btn => (
                                <button key={btn.label} title={btn.title} onClick={btn.action}
                                    style={{ ...s.toolBtn, ...(btn.active ? s.toolBtnActive : {}) }}>
                                    {btn.label}
                                </button>
                            ))}

                            <div style={s.toolSep} />

                            {/* Alignment */}
                            {[
                                { label: '≡', title: 'Align Left',   align: 'left'   },
                                { label: '≡', title: 'Align Center', align: 'center' },
                                { label: '≡', title: 'Align Right',  align: 'right'  },
                            ].map(btn => (
                                <button key={btn.align} title={btn.title}
                                    onClick={() => editor.chain().focus().setTextAlign(btn.align).run()}
                                    style={{ ...s.toolBtn, ...(editor.isActive({ textAlign: btn.align }) ? s.toolBtnActive : {}) }}>
                                    {btn.label}
                                </button>
                            ))}

                            <div style={s.toolSep} />

                            {/* Lists */}
                            <button title="Bullet List"  onClick={() => editor.chain().focus().toggleBulletList().run()}  style={{ ...s.toolBtn, ...(editor.isActive('bulletList')  ? s.toolBtnActive : {}) }}>• List</button>
                            <button title="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={{ ...s.toolBtn, ...(editor.isActive('orderedList') ? s.toolBtnActive : {}) }}>1. List</button>
                            <button title="Blockquote"   onClick={() => editor.chain().focus().toggleBlockquote().run()}  style={{ ...s.toolBtn, ...(editor.isActive('blockquote')  ? s.toolBtnActive : {}) }}>" Quote</button>
                            <button title="Code Block"   onClick={() => editor.chain().focus().toggleCodeBlock().run()}   style={{ ...s.toolBtn, ...(editor.isActive('codeBlock')   ? s.toolBtnActive : {}) }}>{'<>'} Code</button>

                            <div style={s.toolSep} />

                            {/* Link */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    title="Insert Link"
                                    onClick={() => setShowLinkBox(v => !v)}
                                    style={{ ...s.toolBtn, ...(editor.isActive('link') ? s.toolBtnActive : {}) }}
                                >
                                    🔗 Link
                                </button>
                                {showLinkBox && (
                                    <div style={s.linkBox}>
                                        <input
                                            value={linkUrl}
                                            onChange={e => setLinkUrl(e.target.value)}
                                            placeholder="https://…"
                                            style={s.linkInput}
                                            onKeyDown={e => e.key === 'Enter' && insertLink()}
                                            autoFocus
                                        />
                                        <button onClick={insertLink}         style={s.linkApplyBtn}>Apply</button>
                                        <button onClick={() => editor.chain().focus().unsetLink().run()} style={s.linkRemoveBtn}>Remove</button>
                                    </div>
                                )}
                            </div>

                            {/* Image */}
                            <button title="Insert Image" onClick={insertImage} style={s.toolBtn}>🖼 Image</button>

                            {/* Table */}
                            <button title="Insert Table"
                                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                                style={s.toolBtn}>⊞ Table</button>

                            <div style={s.toolSep} />

                            {/* Undo / Redo */}
                            <button title="Undo" onClick={() => editor.chain().focus().undo().run()} style={s.toolBtn}>↩ Undo</button>
                            <button title="Redo" onClick={() => editor.chain().focus().redo().run()} style={s.toolBtn}>↪ Redo</button>
                        </div>
                    )}

                    {/* Editor content area */}
                    <div style={{ ...s.editorWrap, opacity: locked ? 0.6 : 1 }}>
                        <EditorContent editor={editor} style={s.editor} />
                    </div>

                    <div style={s.wordCount}>{wordCount} words</div>

                </div>

                {/* ── Sidebar ── */}
                <aside style={s.sidebar}>

                    {/* Publish box */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Publish</div>
                        <div style={s.sideRow}>
                            <label style={s.sideLabel}>Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} style={s.sideSelect} disabled={locked}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="trash">Trash</option>
                            </select>
                        </div>
                        <div style={s.sideRow}>
                            <label style={s.sideLabel}>Menu Order</label>
                            <input type="number" value={menuOrder} onChange={e => setMenuOrder(parseInt(e.target.value))} style={s.sideInput} disabled={locked} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={() => handleSave('draft')}     disabled={saving || locked} style={s.sideDraftBtn}>Save Draft</button>
                            <button onClick={() => handleSave('published')} disabled={saving || locked} style={s.sidePublishBtn}>Publish</button>
                        </div>
                    </div>

                    {/* Template */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Page Template</div>
                        <select value={template} onChange={e => setTemplate(e.target.value)} style={s.sideSelect} disabled={locked}>
                            {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {/* Parent page */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Parent Page</div>
                        <select
                            value={parentId || ''}
                            onChange={e => handleParentChange(e.target.value ? parseInt(e.target.value) : null)}
                            style={s.sideSelect}
                            disabled={locked}
                        >
                            <option value="">— No parent —</option>
                            {allPages.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Featured image */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Featured Image</div>

                        {featuredImage ? (
                            <div style={s.featImgPreview}>
                                <img
                                    src={featuredImage}
                                    alt=""
                                    style={{ width: '100%', borderRadius: 6, display: 'block', maxHeight: 160, objectFit: 'cover' }}
                                />
                                <button onClick={() => setFeaturedImage('')} style={s.removeImgBtn}>✕ Remove Image</button>
                            </div>
                        ) : (
                            <div
                                style={s.uploadZone}
                                onClick={() => !locked && document.getElementById('feat-img-input')?.click()}
                                onDragOver={e => { e.preventDefault(); }}
                                onDrop={async e => {
                                    e.preventDefault();
                                    if (locked) return;
                                    const file = e.dataTransfer.files[0];
                                    if (file) await uploadFeaturedImage(file);
                                }}
                            >
                                {uploadingImage ? (
                                    <div style={s.uploadingText}>Uploading…</div>
                                ) : (
                                    <>
                                        <div style={s.uploadIcon}>🖼</div>
                                        <div style={s.uploadText}>Click to upload or drag & drop</div>
                                        <div style={s.uploadSub}>JPG, PNG, WebP, GIF up to 5MB</div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Hidden file input */}
                        <input
                            id="feat-img-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={locked}
                            onChange={async e => {
                                const file = e.target.files?.[0];
                                if (file) await uploadFeaturedImage(file);
                                e.target.value = '';
                            }}
                        />

                        {uploadError && (
                            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>{uploadError}</div>
                        )}

                        {featuredImage && (
                            <div style={{ marginTop: '10px' }}>
                                <label style={s.sideLabel}>Alt Text</label>
                                <input
                                    value={featuredImageAlt}
                                    onChange={e => setFeaturedImageAlt(e.target.value)}
                                    placeholder="Describe the image…"
                                    style={s.sideInput}
                                    disabled={locked}
                                />
                            </div>
                        )}
                    </div>

                    {/* SEO */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>SEO</div>
                        <div style={s.sideRow}>
                            <label style={s.sideLabel}>Meta Title</label>
                            <input
                                value={metaTitle}
                                onChange={e => setMetaTitle(e.target.value)}
                                placeholder={title}
                                style={s.sideInput}
                                disabled={locked}
                            />
                            <div style={s.charCount}>{metaTitle.length}/60</div>
                        </div>
                        <div style={s.sideRow}>
                            <label style={s.sideLabel}>Meta Description</label>
                            <textarea
                                value={metaDesc}
                                onChange={e => setMetaDesc(e.target.value)}
                                placeholder="Brief description for search engines…"
                                style={s.sideTextarea}
                                disabled={locked}
                                rows={3}
                            />
                            <div style={s.charCount}>{metaDesc.length}/160</div>
                        </div>

                        {/* SEO preview */}
                        <div style={s.seoPreview}>
                            <div style={s.seoPreviewTitle}>{metaTitle || title || 'Page Title'}</div>
                            <div style={s.seoPreviewUrl}>airlinesofficemap.com/{fullPath}</div>
                            <div style={s.seoPreviewDesc}>{metaDesc || 'No description set.'}</div>
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    root:          { display: 'flex', flexDirection: 'column', height: '100%' },
    topBar:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
    topBarLeft:    { display: 'flex', alignItems: 'center', gap: '12px' },
    topBarRight:   { display: 'flex', alignItems: 'center', gap: '10px' },
    backBtn:       { background: 'none', border: 'none', color: '#7A909E', cursor: 'pointer', fontSize: '13px', padding: '6px 0' },
    heading:       { fontSize: '20px', fontWeight: 800, color: '#0A1628', margin: 0 },
    saveMsg:       { fontSize: '13px', color: '#16a34a', fontWeight: 600 },
    errorMsg:      { fontSize: '13px', color: '#dc2626', fontWeight: 600 },
    draftBtn:      { padding: '8px 16px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#1A2B3C' },
    publishBtn:    { padding: '8px 16px', background: '#1B6CA8', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#fff' },
    lockBanner:    { background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '13.5px', color: '#92400e' },
    takeoverBtn:   { background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
    layout:        { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' },
    main:          { display: 'flex', flexDirection: 'column', gap: '0' },
    titleInput:    { width: '100%', padding: '14px 16px', fontSize: '22px', fontWeight: 700, border: '1px solid #E2EAF0', borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box', color: '#0A1628', background: '#fff' },
    slugRow:       { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '7px' },
    slugLabel:     { fontSize: '12px', color: '#7A909E', fontWeight: 600 },
    slugPrefix:    { fontSize: '13px', color: '#7A909E' },
    slugInput:     { flex: 1, border: 'none', background: 'none', fontSize: '13px', color: '#1B6CA8', outline: 'none' },
    toolbar:       { display: 'flex', flexWrap: 'wrap', gap: '3px', padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '8px 8px 0 0', alignItems: 'center' },
    toolBtn:       { padding: '5px 9px', background: '#fff', border: '1px solid #E2EAF0', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', color: '#1A2B3C', fontWeight: 500 },
    toolBtnActive: { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' },
    toolSelect:    { padding: '5px 8px', border: '1px solid #E2EAF0', borderRadius: '5px', fontSize: '12px', background: '#fff', cursor: 'pointer' },
    toolSep:       { width: '1px', height: '20px', background: '#E2EAF0', margin: '0 3px' },
    linkBox:       { position: 'absolute', top: '110%', left: 0, background: '#fff', border: '1px solid #E2EAF0', borderRadius: '8px', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, display: 'flex', gap: '6px', minWidth: '300px' },
    linkInput:     { flex: 1, padding: '7px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', outline: 'none' },
    linkApplyBtn:  { padding: '7px 12px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 },
    linkRemoveBtn: { padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
    editorWrap:    { border: '1px solid #E2EAF0', borderTop: 'none', borderRadius: '0 0 8px 8px', background: '#fff', minHeight: '400px' },
    editor:        { padding: '20px', minHeight: '400px', outline: 'none', fontSize: '15px', lineHeight: 1.7, color: '#1A2B3C' },
    wordCount:     { fontSize: '12px', color: '#7A909E', marginTop: '6px', textAlign: 'right' },
    sidebar:       { display: 'flex', flexDirection: 'column', gap: '14px' },
    sideCard:      { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', padding: '16px' },
    sideCardTitle: { fontSize: '12px', fontWeight: 700, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' },
    sideRow:       { marginBottom: '10px' },
    sideLabel:     { display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6070', marginBottom: '5px' },
    sideSelect:    { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', background: '#fff' },
    sideInput:     { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' },
    sideTextarea:  { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
    charCount:     { fontSize: '11px', color: '#7A909E', textAlign: 'right', marginTop: '3px' },
    sideDraftBtn:  { flex: 1, padding: '8px', background: '#F8FAFC', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    sidePublishBtn:{ flex: 1, padding: '8px', background: '#1B6CA8', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#fff' },
    featImgPreview:{ marginBottom: '10px', position: 'relative' },
    removeImgBtn:  { marginTop: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', width: '100%' },
    seoPreview:    { marginTop: '14px', padding: '12px', background: '#F8FAFC', borderRadius: '7px', border: '1px solid #E2EAF0' },
    seoPreviewTitle:{ fontSize: '14px', color: '#1a0dab', fontWeight: 600, marginBottom: '2px' },
    seoPreviewUrl: { fontSize: '12px', color: '#006621', marginBottom: '4px' },
    seoPreviewDesc:{ fontSize: '12px', color: '#545454', lineHeight: 1.5 },
    viewBtn: {  padding: '8px 14px', background: '#F0F7FF', border: '1px solid #C2DFF5', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#1B6CA8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', },
    uploadZone:     { border: '2px dashed #C2DFF5', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: '#F0F7FF', transition: 'all 0.2s' },
    uploadIcon:     { fontSize: '28px', marginBottom: '8px' },
    uploadText:     { fontSize: '13px', fontWeight: 600, color: '#1B6CA8', marginBottom: '4px' },
    uploadSub:      { fontSize: '11px', color: '#7A909E' },
    uploadingText:  { fontSize: '13px', color: '#7A909E', fontStyle: 'italic' },
};
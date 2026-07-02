'use client';
// components/admin/PostEditor.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { buildPostUrl } from '@/lib/permalink-utils';
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

type CategoryOption = { id: number; name: string; slug: string };
type TagOption      = { id: number; name: string; slug: string };

type PostData = {
    id?:             number;
    title:           string;
    slug:            string;
    content:         string;
    excerpt:         string;
    status:          string;
    featuredImage:   string;
    featuredImageAlt:string;
    metaTitle:       string;
    metaDescription: string;
    faqSchema:       string;
    categoryIds:     number[];
    tagNames:        string[];
} | null;

type Props = {
    post:            PostData;
    allCategories:   CategoryOption[];
    currentUserId:   number;
    currentUserName: string;
    isLocked:        boolean;
    lockedBy:        string | null;
    permalinkBase:   string;
};

export default function PostEditor({ post, allCategories: initialCategories, currentUserId, currentUserName, isLocked: initialLocked, lockedBy: initialLockedBy, permalinkBase }: Props) {
    const router = useRouter();
    const isNew  = !post?.id;

    // Form state
    const [title,          setTitle]          = useState(post?.title           || '');
    const [slug,           setSlug]           = useState(post?.slug            || '');
    const [excerpt,        setExcerpt]        = useState(post?.excerpt         || '');
    const [status,         setStatus]         = useState(post?.status          || 'draft');
    const [featuredImage,  setFeaturedImage]  = useState(post?.featuredImage   || '');
    const [featuredImageAlt,setFeaturedImageAlt] = useState(post?.featuredImageAlt || '');
    const [metaTitle,      setMetaTitle]      = useState(post?.metaTitle       || '');
    const [metaDesc,       setMetaDesc]       = useState(post?.metaDescription || '');
    const [saving,         setSaving]         = useState(false);
    const [saveMsg,        setSaveMsg]        = useState('');
    const [error,          setError]          = useState('');
    const [locked,         setLocked]         = useState(initialLocked);
    const [lockedBy,       setLockedBy]       = useState(initialLockedBy);
    const [linkUrl,        setLinkUrl]        = useState('');
    const [showLinkBox,    setShowLinkBox]    = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadError,    setUploadError]    = useState('');

    // Categories state
    const [allCategories,  setAllCategories]  = useState<CategoryOption[]>(initialCategories);
    const [selectedCatIds, setSelectedCatIds] = useState<number[]>(post?.categoryIds || []);
    const [newCatName,     setNewCatName]     = useState('');
    const [addingCat,      setAddingCat]      = useState(false);

    // Tags state
    const [tagInput,  setTagInput]  = useState('');
    const [tagNames,  setTagNames]  = useState<string[]>(post?.tagNames || []);

    // FAQ state
    const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(
        post?.faqSchema ? JSON.parse(post.faqSchema) : []
    );

    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    function slugify(str: string) {
        return str.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    function handleTitleChange(val: string) {
        setTitle(val);
        if (isNew) setSlug(slugify(val));
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
            Placeholder.configure({ placeholder: 'Start writing your post content here…' }),
            CharacterCount,
        ],
        content:  post?.content || '',
        editable: !locked,
    });

    // Lock management
    useEffect(() => {
        if (isNew || locked) return;

        async function acquireLock() {
            const res  = await fetch('/api/admin/posts/lock', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ postId: post!.id, action: 'acquire' }),
            });
            const data = await res.json();
            if (data.locked) {
                setLocked(true);
                setLockedBy(data.lockedBy);
                editor?.setEditable(false);
            }
        }

        acquireLock();

        heartbeatRef.current = setInterval(() => {
            fetch('/api/admin/posts/lock', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ postId: post!.id, action: 'heartbeat' }),
            });
        }, 60_000);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            if (post?.id) {
                fetch('/api/admin/posts/lock', {
                    method:    'POST',
                    headers:   { 'Content-Type': 'application/json' },
                    body:      JSON.stringify({ postId: post.id, action: 'release' }),
                    keepalive: true,
                });
            }
        };
    }, [post?.id, isNew]);

    async function takeover() {
        await fetch('/api/admin/posts/lock', {
            method:  'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ postId: post!.id }),
        });
        setLocked(false);
        setLockedBy(null);
        editor?.setEditable(true);
    }

    async function uploadFeaturedImage(file: File) {
        setUploadingImage(true);
        setUploadError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res  = await fetch('/api/admin/media/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) {
                setUploadError(data.error || 'Upload failed.');
            } else {
                setFeaturedImage(data.url);
            }
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    }

    const handleSave = useCallback(async (saveStatus?: string) => {
        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/admin/posts/save', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    id:              post?.id,
                    title,
                    slug,
                    content:         editor?.getHTML() || '',
                    excerpt,
                    status:          saveStatus || status,
                    featuredImage,
                    featuredImageAlt,
                    metaTitle,
                    metaDescription: metaDesc,
                    faqSchema:       JSON.stringify(faqs),
                    categoryIds:     selectedCatIds,
                    tagNames,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to save.');
                return;
            }

            setSaveMsg(saveStatus === 'published' ? '✅ Published!' : '✅ Saved!');
            setTimeout(() => setSaveMsg(''), 3000);

            if (isNew && data.id) {
                router.push(`/admin/posts/${data.id}/edit`);
            }
        } catch (err: any) {
            setError(err.message || 'Save failed. Check the console for details.');
        } finally {
            setSaving(false);
        }
    }, [title, slug, excerpt, status, featuredImage, featuredImageAlt, metaTitle, metaDesc, faqs, selectedCatIds, tagNames, editor]);

    // Category helpers
    async function addNewCategory() {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        const res  = await fetch('/api/admin/categories', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name: newCatName.trim() }),
        });
        const cat = await res.json();
        setAddingCat(false);
        if (cat.id) {
            setAllCategories(prev => [...prev.filter(c => c.id !== cat.id), cat].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedCatIds(prev => prev.includes(cat.id) ? prev : [...prev, cat.id]);
            setNewCatName('');
        }
    }

    function toggleCategory(id: number) {
        setSelectedCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    // Tag helpers
    function addTag(name: string) {
        const trimmed = name.trim();
        if (!trimmed || tagNames.includes(trimmed)) return;
        setTagNames(prev => [...prev, trimmed]);
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
            setTagInput('');
        }
        if (e.key === 'Backspace' && !tagInput && tagNames.length > 0) {
            setTagNames(prev => prev.slice(0, -1));
        }
    }

    function removeTag(name: string) {
        setTagNames(prev => prev.filter(t => t !== name));
    }

    // Link / Image helpers
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

    // FAQ helpers
    function addFaq()    { setFaqs(f => [...f, { question: '', answer: '' }]); }
    function removeFaq(i: number)  { setFaqs(f => f.filter((_, idx) => idx !== i)); }
    function updateFaq(i: number, field: 'question' | 'answer', val: string) {
        setFaqs(f => f.map((faq, idx) => idx === i ? { ...faq, [field]: val } : faq));
    }
    function moveFaq(i: number, dir: 'up' | 'down') {
        const arr = [...faqs];
        const t   = dir === 'up' ? i - 1 : i + 1;
        if (t < 0 || t >= arr.length) return;
        [arr[i], arr[t]] = [arr[t], arr[i]];
        setFaqs(arr);
    }

    const wordCount = editor?.storage.characterCount?.words() || 0;

    return (
        <div style={s.root}>

            {/* Top bar */}
            <div style={s.topBar}>
                <div style={s.topBarLeft}>
                    <button onClick={() => router.push('/admin/posts')} style={s.backBtn}>← Posts</button>
                    <h1 style={s.heading}>{isNew ? 'Add New Post' : 'Edit Post'}</h1>
                </div>
                <div style={s.topBarRight}>
                    {saveMsg && <span style={s.saveMsg}>{saveMsg}</span>}
                    {error   && <span style={s.errorMsg}>{error}</span>}
                    <button onClick={() => handleSave('draft')}     disabled={saving || locked} style={s.draftBtn}>
                        {saving ? 'Saving…' : 'Save Draft'}
                    </button>
                    <button onClick={() => handleSave('published')} disabled={saving || locked} style={s.publishBtn}>
                        {saving ? 'Saving…' : 'Publish'}
                    </button>
                    {post?.id && (
                        <a
                            href={status === 'published' ? buildPostUrl(slug, permalinkBase) : `/post-preview/${post.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                ...s.viewBtn,
                                ...(status !== 'published' ? { background: '#fef9c3', borderColor: '#fde68a', color: '#92400e' } : {}),
                            }}
                        >
                            {status === 'published' ? 'View Post ↗' : '👁 Preview Draft ↗'}
                        </a>
                    )}
                </div>
            </div>

            {/* Lock banner */}
            {locked && (
                <div style={s.lockBanner}>
                    <span>⚠️ <strong>{lockedBy}</strong> is currently editing this post. Editing is disabled.</span>
                    <button onClick={takeover} style={s.takeoverBtn}>Take Over Editing</button>
                </div>
            )}

            <div style={s.layout}>

                {/* ── Main content ── */}
                <div style={s.main}>

                    {/* Title */}
                    <input
                        value={title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="Post title"
                        style={s.titleInput}
                        disabled={locked}
                    />

                    {/* Slug */}
                    <div style={s.slugRow}>
                        <span style={s.slugLabel}>URL:</span>
                        <span style={s.slugPrefix}>/blog/</span>
                        <input
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            style={s.slugInput}
                            disabled={locked}
                        />
                    </div>

                    {/* Editor toolbar */}
                    {editor && (
                        <div style={s.toolbar}>
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

                            {[
                                { label: 'B', title: 'Bold',          action: () => editor.chain().focus().toggleBold().run(),      active: editor.isActive('bold')      },
                                { label: 'I', title: 'Italic',        action: () => editor.chain().focus().toggleItalic().run(),    active: editor.isActive('italic')    },
                                { label: 'U', title: 'Underline',     action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
                                { label: 'S', title: 'Strikethrough', action: () => editor.chain().focus().toggleStrike().run(),    active: editor.isActive('strike')    },
                            ].map(btn => (
                                <button key={btn.label} title={btn.title} onClick={btn.action}
                                    style={{ ...s.toolBtn, ...(btn.active ? s.toolBtnActive : {}) }}>
                                    {btn.label}
                                </button>
                            ))}

                            <div style={s.toolSep} />

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

                            <button onClick={() => editor.chain().focus().toggleBulletList().run()}  style={{ ...s.toolBtn, ...(editor.isActive('bulletList')  ? s.toolBtnActive : {}) }}>• List</button>
                            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={{ ...s.toolBtn, ...(editor.isActive('orderedList') ? s.toolBtnActive : {}) }}>1. List</button>
                            <button onClick={() => editor.chain().focus().toggleBlockquote().run()}  style={{ ...s.toolBtn, ...(editor.isActive('blockquote')  ? s.toolBtnActive : {}) }}>" Quote</button>
                            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}   style={{ ...s.toolBtn, ...(editor.isActive('codeBlock')   ? s.toolBtnActive : {}) }}>{'<>'} Code</button>

                            <div style={s.toolSep} />

                            <div style={{ position: 'relative' }}>
                                <button
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
                                        <button onClick={insertLink} style={s.linkApplyBtn}>Apply</button>
                                        <button onClick={() => editor.chain().focus().unsetLink().run()} style={s.linkRemoveBtn}>Remove</button>
                                    </div>
                                )}
                            </div>

                            <button onClick={insertImage} style={s.toolBtn}>🖼 Image</button>
                            <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} style={s.toolBtn}>⊞ Table</button>

                            <div style={s.toolSep} />

                            <button onClick={() => editor.chain().focus().undo().run()} style={s.toolBtn}>↩ Undo</button>
                            <button onClick={() => editor.chain().focus().redo().run()} style={s.toolBtn}>↪ Redo</button>
                        </div>
                    )}

                    <div style={{ ...s.editorWrap, opacity: locked ? 0.6 : 1 }}>
                        <EditorContent editor={editor} style={s.editor} />
                    </div>
                    <div style={s.wordCount}>{wordCount} words</div>

                    {/* Excerpt */}
                    <div style={s.excerptSection}>
                        <h3 style={s.sectionTitle}>Excerpt</h3>
                        <textarea
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            placeholder="Short description shown in post listings and search results…"
                            style={s.excerptTextarea}
                            disabled={locked}
                            rows={3}
                        />
                        <div style={{ fontSize: '11px', color: '#7A909E', marginTop: '4px' }}>
                            Leave blank to auto-generate from content.
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div style={s.faqSection}>
                        <div style={s.faqHeader}>
                            <div>
                                <h3 style={s.faqTitle}>FAQ Schema</h3>
                                <p style={s.faqSub}>FAQs added here will appear as rich results in Google search.</p>
                            </div>
                            <button onClick={addFaq} disabled={locked} style={s.addFaqBtn}>+ Add FAQ</button>
                        </div>

                        {faqs.length === 0 && (
                            <div style={s.faqEmpty}>No FAQs yet. Click "Add FAQ" to add questions.</div>
                        )}

                        {faqs.map((faq, i) => (
                            <div key={i} style={s.faqItem}>
                                <div style={s.faqItemHeader}>
                                    <span style={s.faqNum}>FAQ {i + 1}</span>
                                    <div style={s.faqItemActions}>
                                        <button onClick={() => moveFaq(i, 'up')}   disabled={i === 0}             style={s.faqMoveBtn}>↑</button>
                                        <button onClick={() => moveFaq(i, 'down')} disabled={i === faqs.length-1} style={s.faqMoveBtn}>↓</button>
                                        <button onClick={() => removeFaq(i)} style={s.faqRemoveBtn}>✕ Remove</button>
                                    </div>
                                </div>
                                <div style={s.faqFields}>
                                    <div style={s.faqField}>
                                        <label style={s.faqLabel}>Question</label>
                                        <input
                                            value={faq.question}
                                            onChange={e => updateFaq(i, 'question', e.target.value)}
                                            placeholder="e.g. How do I book a flight?"
                                            style={s.faqInput}
                                            disabled={locked}
                                        />
                                    </div>
                                    <div style={s.faqField}>
                                        <label style={s.faqLabel}>Answer</label>
                                        <textarea
                                            value={faq.answer}
                                            onChange={e => updateFaq(i, 'answer', e.target.value)}
                                            placeholder="Provide a clear, concise answer…"
                                            style={s.faqTextarea}
                                            disabled={locked}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <aside style={s.sidebar}>

                    {/* Categories */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Categories</div>

                        <div style={s.catList}>
                            {allCategories.length === 0 && (
                                <div style={{ fontSize: '12px', color: '#7A909E' }}>No categories yet.</div>
                            )}
                            {allCategories.map(cat => (
                                <label key={cat.id} style={s.catRow}>
                                    <input
                                        type="checkbox"
                                        checked={selectedCatIds.includes(cat.id)}
                                        onChange={() => toggleCategory(cat.id)}
                                        disabled={locked}
                                        style={{ marginRight: 8 }}
                                    />
                                    <span style={s.catName}>{cat.name}</span>
                                </label>
                            ))}
                        </div>

                        <div style={s.addCatSection}>
                            <div style={s.addCatLabel}>Add New Category</div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder="Category name"
                                    style={{ ...s.sideInput, flex: 1 }}
                                    onKeyDown={e => e.key === 'Enter' && addNewCategory()}
                                    disabled={locked || addingCat}
                                />
                                <button
                                    onClick={addNewCategory}
                                    disabled={!newCatName.trim() || locked || addingCat}
                                    style={s.addCatBtn}
                                >
                                    {addingCat ? '…' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Tags</div>
                        <div style={s.tagWrap}>
                            {tagNames.map(tag => (
                                <span key={tag} style={s.tagChip}>
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        style={s.tagRemove}
                                        disabled={locked}
                                    >×</button>
                                </span>
                            ))}
                            <input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
                                placeholder={tagNames.length === 0 ? 'Add tags…' : ''}
                                style={s.tagInput}
                                disabled={locked}
                            />
                        </div>
                        <div style={{ fontSize: '11px', color: '#7A909E', marginTop: '6px' }}>
                            Separate tags with Enter or comma.
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div style={s.sideCard}>
                        <div style={s.sideCardTitle}>Featured Image</div>

                        {featuredImage ? (
                            <div>
                                <img
                                    src={featuredImage}
                                    alt=""
                                    style={{ width: '100%', borderRadius: 6, display: 'block', maxHeight: 160, objectFit: 'cover', marginBottom: 8 }}
                                />
                                <button onClick={() => setFeaturedImage('')} style={s.removeImgBtn}>✕ Remove Image</button>
                            </div>
                        ) : (
                            <div
                                style={s.uploadZone}
                                onClick={() => !locked && document.getElementById('post-feat-img')?.click()}
                                onDragOver={e => e.preventDefault()}
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

                        <input
                            id="post-feat-img"
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

                        {uploadError && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>{uploadError}</div>}

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
                        <div style={s.seoPreview}>
                            <div style={s.seoPreviewTitle}>{metaTitle || title || 'Post Title'}</div>
                            <div style={s.seoPreviewUrl}>airlinesofficemap.com{buildPostUrl(slug, permalinkBase)}</div>
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
    viewBtn:       { padding: '8px 14px', background: '#F0F7FF', border: '1px solid #C2DFF5', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#1B6CA8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
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
    excerptSection:{ marginTop: '20px', background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', padding: '20px' },
    sectionTitle:  { fontSize: '15px', fontWeight: 700, color: '#0A1628', margin: '0 0 10px' },
    excerptTextarea:{ width: '100%', padding: '10px 12px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 },
    faqSection:    { marginTop: '20px', background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', padding: '20px' },
    faqHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    faqTitle:      { fontSize: '15px', fontWeight: 700, color: '#0A1628', margin: '0 0 4px' },
    faqSub:        { fontSize: '12px', color: '#7A909E', margin: 0 },
    addFaqBtn:     { background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '7px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
    faqEmpty:      { textAlign: 'center', padding: '24px', color: '#7A909E', fontSize: '13px', background: '#F8FAFC', borderRadius: '7px', border: '1px dashed #E2EAF0' },
    faqItem:       { border: '1px solid #E2EAF0', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#F8FAFC' },
    faqItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    faqNum:        { fontSize: '12px', fontWeight: 700, color: '#1B6CA8', textTransform: 'uppercase', letterSpacing: '0.06em' },
    faqItemActions:{ display: 'flex', gap: '6px', alignItems: 'center' },
    faqMoveBtn:    { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '5px', padding: '3px 8px', fontSize: '12px', cursor: 'pointer', color: '#4A6070' },
    faqRemoveBtn:  { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 },
    faqFields:     { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
    faqField:      { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
    faqLabel:      { fontSize: '12px', fontWeight: 600, color: '#4A6070' },
    faqInput:      { padding: '8px 12px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', background: '#fff', width: '100%', boxSizing: 'border-box' as const },
    faqTextarea:   { padding: '8px 12px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', background: '#fff', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const, fontFamily: 'inherit', minHeight: '80px' },
    sidebar:       { display: 'flex', flexDirection: 'column', gap: '14px' },
    sideCard:      { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', padding: '16px' },
    sideCardTitle: { fontSize: '12px', fontWeight: 700, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' },
    sideRow:       { marginBottom: '10px' },
    sideLabel:     { display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A6070', marginBottom: '5px' },
    sideSelect:    { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', background: '#fff' },
    sideInput:     { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' },
    sideTextarea:  { width: '100%', padding: '8px 10px', border: '1px solid #E2EAF0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
    charCount:     { fontSize: '11px', color: '#7A909E', textAlign: 'right', marginTop: '3px' },
    catList:       { maxHeight: '200px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
    catRow:        { display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 0' },
    catName:       { fontSize: '13px', color: '#1A2B3C' },
    addCatSection: { borderTop: '1px solid #E2EAF0', paddingTop: '12px', marginTop: '4px' },
    addCatLabel:   { fontSize: '11px', fontWeight: 700, color: '#7A909E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' },
    addCatBtn:     { padding: '8px 12px', background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
    tagWrap:       { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid #E2EAF0', borderRadius: '6px', background: '#fff', minHeight: '40px', cursor: 'text' },
    tagChip:       { display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#E8F4FD', color: '#1B6CA8', borderRadius: '99px', padding: '3px 10px', fontSize: '12px', fontWeight: 600 },
    tagRemove:     { background: 'none', border: 'none', cursor: 'pointer', color: '#1B6CA8', padding: '0 0 0 2px', fontSize: '14px', lineHeight: 1, display: 'flex', alignItems: 'center' },
    tagInput:      { border: 'none', outline: 'none', fontSize: '13px', color: '#1A2B3C', minWidth: '80px', flex: 1, padding: '2px 0' },
    removeImgBtn:  { marginTop: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', width: '100%' },
    uploadZone:    { border: '2px dashed #C2DFF5', borderRadius: '8px', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: '#F0F7FF' },
    uploadIcon:    { fontSize: '28px', marginBottom: '8px' },
    uploadText:    { fontSize: '13px', fontWeight: 600, color: '#1B6CA8', marginBottom: '4px' },
    uploadSub:     { fontSize: '11px', color: '#7A909E' },
    uploadingText: { fontSize: '13px', color: '#7A909E', fontStyle: 'italic' },
    seoPreview:    { marginTop: '14px', padding: '12px', background: '#F8FAFC', borderRadius: '7px', border: '1px solid #E2EAF0' },
    seoPreviewTitle:{ fontSize: '14px', color: '#1a0dab', fontWeight: 600, marginBottom: '2px' },
    seoPreviewUrl: { fontSize: '12px', color: '#006621', marginBottom: '4px' },
    seoPreviewDesc:{ fontSize: '12px', color: '#545454', lineHeight: 1.5 },
};

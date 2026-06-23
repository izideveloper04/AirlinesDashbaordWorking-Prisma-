// app/admin/dashboard/page.tsx
import { prisma } from '@/lib/pages';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    const [
        totalPages,
        publishedPages,
        draftPages,
        trashedPages,
        totalPosts,
        publishedPosts,
        draftPosts,
        totalMedia,
        totalUsers,
        recentPages,
        recentPosts,
    ] = await Promise.all([
        prisma.page.count(),
        prisma.page.count({ where: { status: 'published' } }),
        prisma.page.count({ where: { status: 'draft'     } }),
        prisma.page.count({ where: { status: 'trash'     } }),
        prisma.post.count(),
        prisma.post.count({ where: { status: 'published' } }),
        prisma.post.count({ where: { status: 'draft'     } }),
        prisma.media.count(),
        prisma.user.count(),
        prisma.page.findMany({
            orderBy: { updatedAt: 'desc' },
            take:    8,
            select:  { id: true, title: true, status: true, updatedAt: true, fullPath: true },
        }),
        prisma.post.findMany({
            orderBy: { updatedAt: 'desc' },
            take:    5,
            select:  { id: true, title: true, status: true, updatedAt: true },
        }),
    ]);

    const stats = [
        { label: 'Total Pages',     value: totalPages,     icon: '📄', color: '#1B6CA8', href: '/admin/pages'                    },
        { label: 'Published Pages', value: publishedPages, icon: '✅', color: '#16a34a', href: '/admin/pages?status=published'   },
        { label: 'Draft Pages',     value: draftPages,     icon: '📝', color: '#d97706', href: '/admin/pages?status=draft'       },
        { label: 'Total Posts',     value: totalPosts,     icon: '✏️', color: '#7c3aed', href: '/admin/posts'                    },
        { label: 'Published Posts', value: publishedPosts, icon: '🚀', color: '#0891b2', href: '/admin/posts?status=published'   },
        { label: 'Draft Posts',     value: draftPosts,     icon: '🗒',  color: '#dc2626', href: '/admin/posts?status=draft'       },
        { label: 'Media Files',     value: totalMedia,     icon: '🖼',  color: '#059669', href: '/admin/media'                   },
        { label: 'Users',           value: totalUsers,     icon: '👥', color: '#0A1628', href: '/admin/users'                   },
    ];

    const statusColors: Record<string, string> = {
        published: '#16a34a',
        draft:     '#d97706',
        trash:     '#dc2626',
    };

    return (
        <div>
            <div style={s.welcomeBar}>
                <div>
                    <h1 style={s.heading}>Welcome back, {session?.user.name} 👋</h1>
                    <p style={s.sub}>Here's what's happening with your site today.</p>
                </div>
                <div style={s.quickBtns}>
                    <Link href="/admin/pages/new" style={s.btnPrimary}>+ New Page</Link>
                    <Link href="/admin/posts/new" style={s.btnSecondary}>+ New Post</Link>
                </div>
            </div>

            {/* Stats grid */}
            <div style={s.statsGrid}>
                {stats.map(stat => (
                    <Link key={stat.label} href={stat.href} style={s.statCard}>
                        <div style={{ ...s.statIcon, background: stat.color + '18', color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div style={s.statValue}>{stat.value.toLocaleString()}</div>
                        <div style={s.statLabel}>{stat.label}</div>
                    </Link>
                ))}
            </div>

            {/* Recent activity */}
            <div style={s.twoCol}>

                {/* Recent pages */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <span style={s.cardTitle}>Recent Pages</span>
                        <Link href="/admin/pages" style={s.cardLink}>View all →</Link>
                    </div>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>Title</th>
                                <th style={s.th}>Status</th>
                                <th style={s.th}>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPages.map(page => (
                                <tr key={page.id}>
                                    <td style={s.td}>
                                        <Link href={`/admin/pages/${page.id}/edit`} style={s.tableLink}>
                                            {page.title}
                                        </Link>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ ...s.badge, background: statusColors[page.status] + '18', color: statusColors[page.status] }}>
                                            {page.status}
                                        </span>
                                    </td>
                                    <td style={{ ...s.td, color: '#7A909E', fontSize: '12px' }}>
                                        {new Date(page.updatedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Recent posts */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <span style={s.cardTitle}>Recent Posts</span>
                        <Link href="/admin/posts" style={s.cardLink}>View all →</Link>
                    </div>
                    {recentPosts.length === 0 ? (
                        <div style={s.empty}>
                            <p>No posts yet.</p>
                            <Link href="/admin/posts/new" style={s.btnPrimary}>Create your first post</Link>
                        </div>
                    ) : (
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Title</th>
                                    <th style={s.th}>Status</th>
                                    <th style={s.th}>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPosts.map(post => (
                                    <tr key={post.id}>
                                        <td style={s.td}>
                                            <Link href={`/admin/posts/${post.id}/edit`} style={s.tableLink}>
                                                {post.title}
                                            </Link>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ ...s.badge, background: statusColors[post.status] + '18', color: statusColors[post.status] }}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td style={{ ...s.td, color: '#7A909E', fontSize: '12px' }}>
                                            {new Date(post.updatedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    welcomeBar: {
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '28px',
        flexWrap:       'wrap',
        gap:            '16px',
    },
    heading:  { fontSize: '22px', fontWeight: 800, color: '#0A1628', margin: 0 },
    sub:      { fontSize: '14px', color: '#7A909E', margin: '4px 0 0' },
    quickBtns:{ display: 'flex', gap: '10px' },
    btnPrimary: {
        background: '#1B6CA8', color: '#fff', padding: '9px 18px',
        borderRadius: '7px', fontSize: '13px', fontWeight: 700,
        textDecoration: 'none', display: 'inline-block',
    },
    btnSecondary: {
        background: '#fff', color: '#1B6CA8', padding: '9px 18px',
        borderRadius: '7px', fontSize: '13px', fontWeight: 700,
        textDecoration: 'none', border: '1px solid #1B6CA8', display: 'inline-block',
    },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px', marginBottom: '28px',
    },
    statCard: {
        background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px',
        padding: '20px', textDecoration: 'none', display: 'block',
        transition: 'box-shadow 0.2s',
    },
    statIcon: {
        width: '40px', height: '40px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', marginBottom: '12px',
    },
    statValue: { fontSize: '28px', fontWeight: 800, color: '#0A1628', lineHeight: 1 },
    statLabel: { fontSize: '12px', color: '#7A909E', marginTop: '4px' },
    twoCol:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    card:     { background: '#fff', border: '1px solid #E2EAF0', borderRadius: '10px', overflow: 'hidden' },
    cardHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: '1px solid #E2EAF0',
    },
    cardTitle: { fontWeight: 700, fontSize: '14px', color: '#0A1628' },
    cardLink:  { fontSize: '12px', color: '#1B6CA8', textDecoration: 'none' },
    table:    { width: '100%', borderCollapse: 'collapse' },
    th:       { padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#7A909E', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8FAFC', borderBottom: '1px solid #E2EAF0' },
    td:       { padding: '11px 16px', fontSize: '13.5px', color: '#1A2B3C', borderBottom: '1px solid #F0F4F8' },
    tableLink:{ color: '#1A2B3C', textDecoration: 'none', fontWeight: 500 },
    badge:    { display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' },
    empty:    { padding: '32px', textAlign: 'center', color: '#7A909E' },
};
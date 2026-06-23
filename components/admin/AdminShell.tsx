'use client';
// components/admin/AdminShell.tsx
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

type Props = {
    children: React.ReactNode;
    session:  Session;
};

const NAV = [
    {
        section: 'Content',
        items: [
            { href: '/admin/dashboard', icon: '⊞', label: 'Dashboard' },
            { href: '/admin/pages',     icon: '📄', label: 'Pages'     },
            { href: '/admin/posts',     icon: '✏️',  label: 'Posts'     },
            { href: '/admin/media',     icon: '🖼',  label: 'Media'     },
        ],
    },
    {
        section: 'Manage',
        items: [
            { href: '/admin/categories', icon: '🏷',  label: 'Categories' },
            { href: '/admin/tags',       icon: '🔖',  label: 'Tags'       },
        ],
    },
    {
        section: 'Admin',
        items: [
            { href: '/admin/users',    icon: '👥', label: 'Users'    },
            { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
        ],
        adminOnly: true,
    },
];

export default function AdminShell({ children, session }: Props) {
    const pathname    = usePathname();
    const [open, setOpen] = useState(true);
    const isAdmin = session.user.role === 'admin';

    function isActive(href: string) {
        if (href === '/admin/dashboard') return pathname === href;
        return pathname.startsWith(href);
    }

    return (
        <div style={s.root}>

            {/* ── Sidebar ── */}
            <aside style={{ ...s.sidebar, width: open ? 240 : 64 }}>

                {/* Logo */}
                <div style={s.sidebarLogo}>
                    <div style={s.logoIcon}>✈</div>
                    {open && <span style={s.logoText}>AOM Admin</span>}
                </div>

                {/* Nav */}
                <nav style={s.nav}>
                    {NAV.map(group => {
                        if (group.adminOnly && !isAdmin) return null;
                        return (
                            <div key={group.section} style={s.navGroup}>
                                {open && (
                                    <div style={s.navSection}>{group.section}</div>
                                )}
                                {group.items.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        style={{
                                            ...s.navItem,
                                            ...(isActive(item.href) ? s.navItemActive : {}),
                                            justifyContent: open ? 'flex-start' : 'center',
                                        }}
                                        title={!open ? item.label : ''}
                                    >
                                        <span style={s.navIcon}>{item.icon}</span>
                                        {open && <span>{item.label}</span>}
                                    </Link>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setOpen(o => !o)}
                    style={s.collapseBtn}
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {open ? '◀' : '▶'}
                </button>
            </aside>

            {/* ── Main area ── */}
            <div style={s.main}>

                {/* Top bar */}
                <header style={s.topbar}>
                    <div style={s.topbarLeft}>
                        <span style={s.pageTitle}>
                            {NAV.flatMap(g => g.items).find(i => isActive(i.href))?.label ?? 'Admin'}
                        </span>
                    </div>
                    <div style={s.topbarRight}>
                        {/* Quick create */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <QuickCreate />
                        </div>

                        {/* User menu */}
                        <div style={s.userChip}>
                            <div style={s.userAvatar}>
                                {session.user.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={s.userName}>{session.user.name}</div>
                                <div style={s.userRole}>{session.user.role}</div>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                                style={s.logoutBtn}
                                title="Sign out"
                            >
                                ⏻
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div style={s.content}>
                    {children}
                </div>

            </div>
        </div>
    );
}

// Quick create dropdown
function QuickCreate() {
    const [show, setShow] = useState(false);

    return (
        <>
            <button
                onClick={() => setShow(s => !s)}
                style={s.newBtn}
            >
                + New
            </button>
            {show && (
                <div style={s.dropdown}>
                    <Link href="/admin/pages/new"  style={s.dropItem} onClick={() => setShow(false)}>📄 New Page</Link>
                    <Link href="/admin/posts/new"  style={s.dropItem} onClick={() => setShow(false)}>✏️ New Post</Link>
                    <Link href="/admin/media"      style={s.dropItem} onClick={() => setShow(false)}>🖼 Upload Media</Link>
                </div>
            )}
        </>
    );
}

// ── Styles ──
const s: Record<string, React.CSSProperties> = {
    root: {
        display:   'flex',
        minHeight: '100vh',
        background:'#F8FAFC',
    },
    sidebar: {
        background:    '#0A1628',
        color:         '#fff',
        display:       'flex',
        flexDirection: 'column',
        flexShrink:    0,
        transition:    'width 0.2s',
        overflow:      'hidden',
        position:      'sticky',
        top:           0,
        height:        '100vh',
    },
    sidebarLogo: {
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        padding:    '20px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
    },
    logoIcon: {
        width:          '32px',
        height:         '32px',
        background:     '#1B6CA8',
        borderRadius:   '8px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '16px',
        flexShrink:     0,
    },
    logoText: {
        fontWeight:  700,
        fontSize:    '14px',
        whiteSpace:  'nowrap',
    },
    nav: {
        flex:      1,
        overflowY: 'auto',
        padding:   '12px 0',
    },
    navGroup: {
        marginBottom: '8px',
    },
    navSection: {
        fontSize:      '10px',
        fontWeight:    700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color:         'rgba(255,255,255,0.35)',
        padding:       '8px 16px 4px',
    },
    navItem: {
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        '9px 16px',
        color:          'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        fontSize:       '13.5px',
        borderLeft:     '3px solid transparent',
        transition:     'all 0.15s',
        whiteSpace:     'nowrap',
    },
    navItemActive: {
        color:       '#fff',
        background:  'rgba(255,255,255,0.08)',
        borderLeft:  '3px solid #1B6CA8',
    },
    navIcon: {
        fontSize:   '16px',
        flexShrink: 0,
        width:      '20px',
        textAlign:  'center',
    },
    collapseBtn: {
        background:  'rgba(255,255,255,0.06)',
        border:      'none',
        color:       'rgba(255,255,255,0.5)',
        padding:     '12px',
        cursor:      'pointer',
        width:       '100%',
        fontSize:    '12px',
        flexShrink:  0,
        borderTop:   '1px solid rgba(255,255,255,0.08)',
    },
    main: {
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minWidth:      0,
    },
    topbar: {
        height:         '60px',
        background:     '#fff',
        borderBottom:   '1px solid #E2EAF0',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 24px',
        position:       'sticky',
        top:            0,
        zIndex:         50,
        flexShrink:     0,
    },
    topbarLeft: {},
    topbarRight: {
        display:    'flex',
        alignItems: 'center',
        gap:        '16px',
    },
    pageTitle: {
        fontWeight: 700,
        fontSize:   '16px',
        color:      '#0A1628',
    },
    newBtn: {
        background:   '#1B6CA8',
        color:        '#fff',
        border:       'none',
        borderRadius: '6px',
        padding:      '7px 16px',
        fontSize:     '13px',
        fontWeight:   700,
        cursor:       'pointer',
    },
    dropdown: {
        position:     'absolute',
        top:          '110%',
        right:        0,
        background:   '#fff',
        border:       '1px solid #E2EAF0',
        borderRadius: '8px',
        boxShadow:    '0 8px 24px rgba(0,0,0,0.12)',
        minWidth:     '160px',
        zIndex:       100,
        overflow:     'hidden',
    },
    dropItem: {
        display:        'block',
        padding:        '11px 16px',
        fontSize:       '13.5px',
        color:          '#1A2B3C',
        textDecoration: 'none',
        transition:     'background 0.15s',
    },
    userChip: {
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        background: '#F8FAFC',
        border:     '1px solid #E2EAF0',
        borderRadius:'8px',
        padding:    '6px 12px 6px 8px',
    },
    userAvatar: {
        width:          '30px',
        height:         '30px',
        background:     '#1B6CA8',
        color:          '#fff',
        borderRadius:   '50%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '13px',
        fontWeight:     700,
        flexShrink:     0,
    },
    userName: {
        fontSize:   '13px',
        fontWeight: 600,
        color:      '#0A1628',
        lineHeight: 1.2,
    },
    userRole: {
        fontSize:      '11px',
        color:         '#7A909E',
        textTransform: 'capitalize',
    },
    logoutBtn: {
        background: 'none',
        border:     'none',
        cursor:     'pointer',
        fontSize:   '16px',
        color:      '#7A909E',
        padding:    '0 0 0 4px',
        lineHeight: 1,
    },
    content: {
        flex:    1,
        padding: '28px 32px',
    },
};
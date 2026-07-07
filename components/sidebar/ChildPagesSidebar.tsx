// components/sidebar/ChildPagesSidebar.tsx
import Link from 'next/link';
import { WPPage } from '@/lib/pages';

type Props = {
    siblings:      WPPage[];
    parent:        WPPage | undefined;
    currentPageId: number;
};

export default function ChildPagesSidebar({ siblings, parent, currentPageId }: Props) {
    return (
        <nav className="child-sidebar">

            {/* Back to parent */}
            {parent && (
                <div className="sidebar-parent-link">
                    <Link href={`/${parent.fullPath}`}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
                            <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {parent.title}
                    </Link>
                </div>
            )}

            {/* Sibling pages list */}
            <ul className="sidebar-list">
                {siblings.map(sibling => (
                    <li
                        key={sibling.id}
                        className={`sidebar-item ${sibling.id === currentPageId ? 'active' : ''}`}
                    >
                        <Link href={`/${sibling.fullPath}`}>
                            {sibling.title}
                        </Link>
                    </li>
                ))}
            </ul>

        </nav>
    );
}
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
                        ← {parent.title}
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
// components/templates/HomeTemplate.tsx
import { WPPage } from '@/lib/pages';
import { cleanWordPressContent } from '@/lib/cleanContent';

type Props = { page: WPPage };

export default function HomeTemplate({ page }: Props) {
    const content = cleanWordPressContent(page.content);

    return (
        <main className="home-page">
            <h1 className="home-title">{page.title}</h1>
        </main>
    );
}
// Redirect stub — the real editor lives at /admin/posts/[id]/edit
import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function PostPageRedirect({ params }: Props) {
    const { id } = await params;
    redirect(`/admin/posts/${id}/edit`);
}

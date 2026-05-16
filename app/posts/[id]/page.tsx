import { getPostWithDetails } from "@/lib/posts/service";
import { getSignedUrl } from "@/lib/minio/client";
import { PostDetailContent } from "@/components/post-detail-content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postRow = await getPostWithDetails(id);

  if (!postRow) {
    notFound();
  }

  // Resolve media URLs to public URLs
  const mediaWithUrls = await Promise.all(
    postRow.media.map(async (m) => ({
      ...m,
      publicUrl: await getSignedUrl(m.url),
    }))
  );

  const post = {
    ...postRow,
    media: mediaWithUrls,
  };

  return <PostDetailContent post={post as any} id={id} />;
}

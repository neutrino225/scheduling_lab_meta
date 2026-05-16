import { listPostsWithDetails } from "@/lib/posts/service";
import { PostsContent } from "@/components/posts-content";
import type { PostWithDetails } from "@/lib/client/types";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const postsRows = await listPostsWithDetails({ limit: 100, sort: "createdAt_desc" });
  const initialPosts = postsRows as unknown as PostWithDetails[];

  return <PostsContent initialPosts={initialPosts} />;
}

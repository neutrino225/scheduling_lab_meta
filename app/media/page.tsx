import { listMedia } from "@/lib/media/service";
import { MediaContent } from "@/components/media-content";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const mediaItems = await listMedia();
  return <MediaContent initialMedia={mediaItems} />;
}

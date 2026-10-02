import { notFound } from "next/navigation";
import { PageHeader } from "@/components/marketing/PageHeader";
import { pageMetadata } from "@/lib/seo";
import { appEnv } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Workspace",
  description: "The Knowvia workspace is not available on this site yet.",
  path: "/workspace",
  noindex: true,
});

// Placeholder for the future product entry. Disabled in production until the product has its own
// authentication and deployment controls. It never loads the product or calls its API.
export default function WorkspacePage() {
  if (appEnv === "production" && process.env.WORKSPACE_ENABLED !== "true") notFound();
  return (
    <PageHeader
      title="Workspace"
      lede="The Knowvia workspace runs as a separate application and is not connected to this website. Early-access members will receive a link when their place opens."
      path="/workspace"
    />
  );
}

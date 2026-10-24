import { redirect } from "next/navigation";

import { panelPath } from "@/core/panel-routes";

export default async function PanelHomePage({ params }: PageProps<"/[slug]/panel">) {
  const { slug } = await params;
  redirect(panelPath(slug, "agenda") as never);
}

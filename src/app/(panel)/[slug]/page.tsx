import { redirect } from "next/navigation";

export default async function TenantHomePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  redirect(`/${slug}/agenda` as never);
}

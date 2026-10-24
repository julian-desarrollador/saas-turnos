import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { OpenTrialScreen } from "@/modules/billing/components/open-trial-screen";

export default async function OpenTrialPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in" as never);
  }
  return <OpenTrialScreen />;
}

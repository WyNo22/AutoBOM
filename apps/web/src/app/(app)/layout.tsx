import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MeshBackground } from "@/components/mesh-background";
import { AiStateProvider } from "@/components/ai-state-context";
import { OnboardingModal } from "@/components/onboarding-modal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AiStateProvider>
      <MeshBackground />
      <OnboardingModal />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar userEmail={session.user.email} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AiStateProvider>
  );
}

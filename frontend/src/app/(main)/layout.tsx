import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B13] text-zinc-100">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="pt-16 min-h-[calc(100vh-4rem)]">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

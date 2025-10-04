import BackHome from "@/components/common/BackHome";

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <BackHome />
      {children}
    </main>
  );
}

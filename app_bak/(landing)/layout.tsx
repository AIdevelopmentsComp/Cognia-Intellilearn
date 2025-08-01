import { HeaderComponent } from "@/components/common/header";
import { FooterComponet } from "@/components/common/footer";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <HeaderComponent />
      {children}
      <FooterComponet />
    </>
  );
} 
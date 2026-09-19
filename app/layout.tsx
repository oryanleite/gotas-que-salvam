import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
export const metadata: Metadata = { title: "Gotas que Salvam | Encontre onde doar sangue perto de você", description: "Encontre hemocentros, bancos de sangue e hospitais que recebem doações na Grande São Paulo.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }, openGraph: { title: "Gotas que Salvam", description: "Encontre locais verificados para doar sangue na Grande São Paulo.", type: "website", locale: "pt_BR" }, robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}<Toaster position="bottom-center" richColors/></body></html>; }

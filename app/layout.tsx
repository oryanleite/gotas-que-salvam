import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

// Reposições para navegadores de celular mais antigos (iPhones em iOS 14, por
// exemplo). Sem elas, bibliotecas usadas pela página chamam funções que não
// existem nesses navegadores e a página inteira deixa de responder. Vai inline
// no <head> para executar antes de qualquer outro script.
const legacySafariPolyfill = [
  'if(!Object.hasOwn){Object.hasOwn=function(o,k){return Object.prototype.hasOwnProperty.call(Object(o),k)}}',
  'if(!Array.prototype.at){Object.defineProperty(Array.prototype,"at",{configurable:true,writable:true,value:function(n){n=Math.trunc(n)||0;if(n<0)n+=this.length;return (n<0||n>=this.length)?undefined:this[n]}})}',
  'if(!String.prototype.at){Object.defineProperty(String.prototype,"at",{configurable:true,writable:true,value:function(n){n=Math.trunc(n)||0;if(n<0)n+=this.length;return (n<0||n>=this.length)?undefined:this[n]}})}',
].join("");

export const metadata: Metadata = { title: "Gotas que Salvam | Encontre onde doar sangue perto de você", description: "Encontre hemocentros, bancos de sangue e hospitais que recebem doações na Grande São Paulo.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }, openGraph: { title: "Gotas que Salvam", description: "Encontre locais verificados para doar sangue na Grande São Paulo.", type: "website", locale: "pt_BR" }, robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><head><script dangerouslySetInnerHTML={{ __html: legacySafariPolyfill }}/></head><body>{children}<Toaster position="bottom-center" richColors/><Analytics/></body></html>; }

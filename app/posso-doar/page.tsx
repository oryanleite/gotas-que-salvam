import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EligibilityQuiz from "@/components/eligibility-quiz";

export const metadata = {
  title: "Posso doar sangue? Faça o teste | Gotas que Salvam",
  description:
    "Descubra em 2 minutos, só clicando nas opções, se você pode doar sangue agora, se precisa esperar ou o que confirmar com o hemocentro. Baseado na norma federal.",
};

export default function PossoDoarPage() {
  return (
    <main className="legal-page quiz-page">
      <div className="quiz-shell">
        <Link href="/" className="back-link"><ArrowLeft />Voltar ao início</Link>
        <EligibilityQuiz />
      </div>
    </main>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import { Droplet, HeartHandshake, MessageCircleHeart, ShieldCheck, Sparkles, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONFIRMED_DONATIONS, DONATION_GOAL, SITE_WHATSAPP_NUMBER } from "@/lib/donation-counter";

function buildDonationMessage(): string {
  return [
    "Oi! Quero contar que também fiz uma doação de sangue 🩸",
    "Segue a mensagem ou o print do comprovante (anexe a foto aqui antes de enviar):",
  ].join("\n");
}

export default function HeroDonationCounter({ featured = false }: { featured?: boolean }) {
  const goal = Math.max(1, DONATION_GOAL);
  const confirmed = Math.max(0, Math.min(CONFIRMED_DONATIONS, goal));
  const percent = Math.round((confirmed / goal) * 100);
  const reached = confirmed >= goal;

  const [bounce, setBounce] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const whatsappUrl = `https://wa.me/${SITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildDonationMessage())}`;

  // O número, a gota e a barra são renderizados já no servidor, sem depender de
  // JavaScript: se o script falhar no navegador do visitante (celulares antigos,
  // bloqueadores), o contador continua mostrando o valor certo. A animação de
  // enchimento é feita só com CSS, a partir da variável --fill.
  //
  // Com pelo menos uma doação, a gota recebe um mínimo visível de 8% — abaixo
  // disso o preenchimento cairia na ponta estreita da base e ficaria invisível.
  // O número e a barra de progresso continuam exibindo o valor exato.
  const fillPercent = confirmed > 0 ? Math.max(percent, 8) : 0;

  const replayBounce = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 500);
  };

  return (
    <div className={`donation-counter${featured ? " featured" : ""}`}>
      <button
        type="button"
        className={`donation-drop${reached ? " filled" : ""}${bounce ? " bounce" : ""}`}
        onClick={replayBounce}
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="donation-drop-shape">
          <span className="donation-drop-fill" style={{ "--fill": `${fillPercent}%` } as CSSProperties} />
        </span>
        <span className="donation-drop-icon">
          <Droplet fill="currentColor" />
        </span>
      </button>

      <div className="donation-stats">
        <span className="eyebrow">
          <HeartHandshake />
          Mutirão da comunidade
        </span>
        <p className="donation-count" aria-live="polite">
          <strong>{confirmed}</strong>
          <span>de {goal} doações confirmadas</span>
        </p>
        <div className="donation-progress-track">
          <div className="donation-progress-fill" style={{ "--fill": `${percent}%` } as CSSProperties} />
        </div>
        <p className={`donation-goal-note${reached ? " reached" : ""}`}>
          {reached ? (
            <>
              <Sparkles />
              Meta batida! Muito obrigado a quem já doou 🎉
            </>
          ) : (
            <>
              <Target />
              Faltam {goal - confirmed} doações para batermos a meta.
            </>
          )}
        </p>
      </div>

      <div className="donation-cta">
        <button type="button" onClick={() => setConsentOpen(true)}>
          <MessageCircleHeart />
          Contar minha doação
        </button>
        <small>Confirmação manual pelo WhatsApp — assim o contador fica sempre verdadeiro.</small>
      </div>

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent className="donation-consent">
          <DialogHeader>
            <DialogTitle>Antes de continuar</DialogTitle>
            <DialogDescription>
              Vamos te levar para o WhatsApp para confirmar sua doação.
            </DialogDescription>
          </DialogHeader>
          <p>
            Conte pra gente que você doou — pode mandar uma mensagem ou o print do
            comprovante da doação.
          </p>
          <div className="retention-note">
            <ShieldCheck />
            <span>
              Esses dados (mensagem ou print) ficam guardados na conversa apenas
              durante o andamento do projeto Gotas que Salvam, só para conferência
              e para contabilizar o contador do site. Depois, são apagados. Veja
              mais na <a href="/privacidade">Política de Privacidade</a>.
            </span>
          </div>
          <div className="details-actions">
            <button type="button" className="secondary" onClick={() => setConsentOpen(false)}>
              Cancelar
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setConsentOpen(false)}
            >
              Continuar para o WhatsApp
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
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

  const [displayedCount, setDisplayedCount] = useState(0);
  const [fillPercent, setFillPercent] = useState(0);
  const [bounce, setBounce] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const startedRef = useRef(false);
  const whatsappUrl = `https://wa.me/${SITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildDonationMessage())}`;

  // Anima a contagem e o preenchimento da gota uma única vez, quando a seção
  // aparece — a hero já está visível no primeiro carregamento da página.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const fillTimeout = setTimeout(() => setFillPercent(percent), 250);
    const duration = 1200;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedCount(Math.round(eased * confirmed));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      clearTimeout(fillTimeout);
      cancelAnimationFrame(frame);
    };
  }, [confirmed, percent]);

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
          <span className="donation-drop-fill" style={{ height: `${fillPercent}%` }} />
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
          <strong>{displayedCount}</strong>
          <span>de {goal} doações confirmadas</span>
        </p>
        <div className="donation-progress-track">
          <div className="donation-progress-fill" style={{ width: `${fillPercent}%` }} />
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

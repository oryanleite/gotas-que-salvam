"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  HeartHandshake,
  Info,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  NONE_OPTION,
  QUIZ_SOURCES,
  evaluate,
  pruneAnswers,
  visibleQuestions,
  type QuizAnswers,
  type QuizReason,
  type QuizVerdict,
} from "@/lib/eligibility-quiz.mjs";

type Stage = "intro" | "questions" | "result";

const VERDICT_COPY: Record<QuizVerdict, { title: string; text: string }> = {
  pode: {
    title: "Tudo indica que você pode doar!",
    text: "Pelas suas respostas, você atende aos critérios gerais. A confirmação final é feita na triagem do hemocentro, no dia da doação.",
  },
  avaliar: {
    title: "Você provavelmente pode doar, mas confirme alguns pontos",
    text: "Algumas respostas dependem de avaliação individual. Vale ligar para o hemocentro antes ou explicar na triagem.",
  },
  aguardar: {
    title: "Por enquanto, é preciso esperar um pouco",
    text: "Você tem um ou mais impedimentos temporários. Passado o prazo, é só voltar e doar.",
  },
  nao: {
    title: "Pelos critérios gerais, você não pode doar sangue",
    text: "Mas você ainda pode ajudar muito: compartilhe o Gotas que Salvam e incentive quem pode doar.",
  },
};

const LEVEL_LABEL: Record<QuizReason["level"], string> = {
  nao: "Impede a doação",
  aguardar: "Espera temporária",
  avaliar: "Confirmar no hemocentro",
};

export default function EligibilityQuiz() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const question = questions[Math.min(index, questions.length - 1)];
  const result = useMemo(() => (stage === "result" ? evaluate(answers) : null), [stage, answers]);

  // Leva o foco (e o scroll) para o título a cada troca de tela — ajuda
  // quem usa leitor de tela e evita que o celular fique no meio da página.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage, index]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const goNext = (next: QuizAnswers) => {
    const visible = visibleQuestions(next);
    const position = visible.findIndex((q) => q.id === question.id);
    if (position >= visible.length - 1) setStage("result");
    else setIndex(position + 1);
  };

  const chooseSingle = (optionId: string) => {
    const next = pruneAnswers({ ...answers, [question.id]: optionId });
    setAnswers(next);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => goNext(next), 220);
  };

  const toggleMulti = (optionId: string, exclusive?: boolean) => {
    const current = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : [];
    let next: string[];
    if (exclusive) next = current.includes(optionId) ? [] : [optionId];
    else {
      const withoutNone = current.filter((o) => o !== NONE_OPTION);
      next = withoutNone.includes(optionId) ? withoutNone.filter((o) => o !== optionId) : [...withoutNone, optionId];
    }
    setAnswers({ ...answers, [question.id]: next });
  };

  const back = () => {
    if (index === 0) setStage("intro");
    else setIndex(index - 1);
  };

  const restart = () => {
    setAnswers({});
    setIndex(0);
    setStage("intro");
  };

  if (stage === "intro") {
    return (
      <div className="quiz-card quiz-intro">
        <span className="quiz-icon"><Stethoscope /></span>
        <p className="eyebrow">Teste rápido · cerca de 2 minutos</p>
        <h1 ref={headingRef} tabIndex={-1}>Posso doar sangue?</h1>
        <p>
          Responda algumas perguntas simples, só clicando nas opções. No final, você descobre se
          pode doar agora, se precisa esperar ou o que confirmar com o hemocentro.
        </p>
        <ul className="quiz-promises">
          <li><Check />Nada para digitar</li>
          <li><ShieldCheck />Suas respostas não saem do seu aparelho</li>
          <li><Info />Baseado na norma federal de doação de sangue</li>
        </ul>
        <button type="button" className="quiz-primary" onClick={() => { setIndex(0); setStage("questions"); }}>
          Começar <ArrowRight />
        </button>
        <p className="quiz-disclaimer">
          É uma orientação, não um diagnóstico. Quem decide se você pode doar é a triagem clínica do
          hemocentro, feita no dia da doação.
        </p>
      </div>
    );
  }

  if (stage === "result" && result) {
    const copy = VERDICT_COPY[result.verdict];
    const VerdictIcon = result.verdict === "pode" ? CheckCircle2 : result.verdict === "nao" ? CircleAlert : result.verdict === "aguardar" ? Clock3 : Info;
    return (
      <div className="quiz-result">
        <div className={`quiz-card quiz-verdict ${result.verdict}`}>
          <span className="quiz-icon"><VerdictIcon /></span>
          <p className="eyebrow">Seu resultado</p>
          <h1 ref={headingRef} tabIndex={-1}>{copy.title}</h1>
          <p>{copy.text}</p>
          <div className="quiz-actions">
            {result.verdict !== "nao" ? (
              <Link className="quiz-primary" href="/#busca"><MapPin />Encontrar onde doar</Link>
            ) : (
              <Link className="quiz-primary" href="/#inicio"><HeartHandshake />Conhecer o Gotas que Salvam</Link>
            )}
            <button type="button" className="quiz-secondary" onClick={restart}><RotateCcw />Refazer o teste</button>
          </div>
        </div>

        {result.reasons.length > 0 && (
          <section className="quiz-card quiz-reasons" aria-labelledby="quiz-reasons-title">
            <h2 id="quiz-reasons-title">Por que esse resultado</h2>
            <ul>
              {result.reasons.map((reason) => (
                <li key={reason.text} className={reason.level}>
                  <span className="quiz-tag">{LEVEL_LABEL[reason.level]}</span>
                  <p>{reason.text}</p>
                  {reason.wait && <p className="quiz-wait"><Clock3 />Prazo: {reason.wait}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.verdict !== "nao" && (
          <section className="quiz-card quiz-checklist" aria-labelledby="quiz-checklist-title">
            <h2 id="quiz-checklist-title">No dia da doação</h2>
            <ul>
              <li><Check />Leve documento oficial com foto.</li>
              <li><Check />Vá alimentado: não é preciso jejum. Só evite refeição gordurosa nas 3 horas antes.</li>
              <li><Check />Não beba álcool nas 12 horas antes da doação.</li>
              <li><Check />Durma bem na noite anterior: os hemocentros recomendam pelo menos 6 horas de sono.</li>
              <li><Check />Confira o horário da unidade e se precisa agendar.</li>
              {result.notes.map((note) => <li key={note}><Info />{note}</li>)}
            </ul>
          </section>
        )}

        <section className="quiz-card quiz-sources" aria-labelledby="quiz-sources-title">
          <h2 id="quiz-sources-title">De onde vêm essas regras</h2>
          <p>
            Critérios da Portaria GM/MS nº 11.685/2026, que atualizou o regulamento técnico de doação de
            sangue e vale a partir de outubro de 2026. Até lá, e em casos específicos, o hemocentro pode
            aplicar prazos diferentes. Em caso de dúvida, sempre vale o que a equipe do hemocentro orientar.
          </p>
          <ul>
            {QUIZ_SOURCES.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<ExternalLink /></a></li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const selected = answers[question.id];
  const total = questions.length;
  const position = Math.min(index, total - 1) + 1;
  const multiValue = Array.isArray(selected) ? selected : [];

  return (
    <div className="quiz-card quiz-question">
      <div className="quiz-progress" aria-hidden="true">
        <div style={{ width: `${Math.round(((position - 1) / total) * 100)}%` }} />
      </div>
      <div className="quiz-topline">
        <button type="button" className="quiz-back" onClick={back}><ArrowLeft />Voltar</button>
        <span>Pergunta {position} de {total}</span>
      </div>
      <h1 ref={headingRef} tabIndex={-1}>{question.title}</h1>
      {question.list && (
        <ul className="quiz-list">
          {question.list.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {question.help && <p className="quiz-help">{question.help}</p>}
      <div className="quiz-options" role={question.type === "single" ? "radiogroup" : "group"} aria-label={question.title}>
        {question.options.map((option) => {
          const isSelected = question.type === "single" ? selected === option.id : multiValue.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role={question.type === "single" ? "radio" : "checkbox"}
              aria-checked={isSelected}
              className={`quiz-option${isSelected ? " selected" : ""}${option.exclusive ? " exclusive" : ""}`}
              onClick={() => (question.type === "single" ? chooseSingle(option.id) : toggleMulti(option.id, option.exclusive))}
            >
              <span className={`quiz-mark ${question.type}`}>{isSelected && <Check />}</span>
              {option.label}
            </button>
          );
        })}
      </div>
      {question.type === "multi" && (
        <button type="button" className="quiz-primary" disabled={multiValue.length === 0} onClick={() => goNext(answers)}>
          {position === total ? "Ver resultado" : "Continuar"} <ArrowRight />
        </button>
      )}
    </div>
  );
}

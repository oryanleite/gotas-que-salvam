import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, evaluate, pruneAnswers, visibleQuestions } from "../lib/eligibility-quiz.mjs";

// Respostas de alguém sem nenhum impedimento.
const ok = {
  idade: "18a60", peso: "sim", ultimaDoacao: "nunca", gripe: "nao", antibiotico: "nao",
  gestacao: ["nenhuma"], estetica: ["nenhuma"], piercingOral: "nao", procedimentos: ["nenhuma"],
  recentes: ["nenhuma"], malaria: ["nenhuma"], risco4m: "nao", risco12m: "nao", definitivo: "nao",
};

test("sem impedimentos → pode doar", () => {
  const r = evaluate(ok);
  assert.equal(r.verdict, "pode");
  assert.equal(r.reasons.length, 0);
});

test("toda opção de toda pergunta tem id único dentro da pergunta", () => {
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  for (const q of QUESTIONS) assert.equal(new Set(q.options.map((o) => o.id)).size, q.options.length, q.id);
});

test("idade: pergunta de primeira doação só aparece a partir dos 61", () => {
  assert.ok(!visibleQuestions({ idade: "18a60" }).some((q) => q.id === "jaDoou"));
  assert.ok(visibleQuestions({ idade: "61a69" }).some((q) => q.id === "jaDoou"));
  assert.ok(!visibleQuestions({ idade: "61a69", jaDoou: "nao" }).some((q) => q.id === "ultimaDoacao"));
});

test("idade: primeira doação após os 60 → não pode; 70+ doador de repetição → avaliar", () => {
  assert.equal(evaluate({ ...ok, idade: "61a69", jaDoou: "nao" }).verdict, "nao");
  assert.equal(evaluate({ ...ok, idade: "61a69", jaDoou: "sim" }).verdict, "pode");
  assert.equal(evaluate({ ...ok, idade: "70mais", jaDoou: "sim" }).verdict, "avaliar");
  assert.equal(evaluate({ ...ok, idade: "menos16" }).verdict, "nao");
});

test("16–17 anos pode, com aviso de consentimento", () => {
  const r = evaluate({ ...ok, idade: "16a17" });
  assert.equal(r.verdict, "pode");
  assert.ok(r.notes.some((n) => n.includes("consentimento")));
});

test("mudar a idade apaga resposta que deixou de fazer sentido", () => {
  assert.equal(pruneAnswers({ idade: "18a60", jaDoou: "nao" }).jaDoou, undefined);
});

test("intervalo: 2–3 meses depende do sexo", () => {
  assert.equal(evaluate({ ...ok, ultimaDoacao: "2a3m", intervaloSexo: "masc" }).verdict, "pode");
  assert.equal(evaluate({ ...ok, ultimaDoacao: "2a3m", intervaloSexo: "fem" }).verdict, "aguardar");
  assert.equal(evaluate({ ...ok, ultimaDoacao: "menos2m" }).verdict, "aguardar");
});

test("temporários com prazo", () => {
  for (const extra of [
    { gripe: "febre" }, { gripe: "resfriadoRecente" }, { antibiotico: "sim" }, { gestacao: ["gravida"] },
    { piercingOral: "usa" }, { procedimentos: ["endoscopia"] }, { malaria: ["mata"] }, { risco4m: "sim" }, { risco12m: "sim" },
  ]) {
    const r = evaluate({ ...ok, ...extra });
    assert.equal(r.verdict, "aguardar", JSON.stringify(extra));
    assert.ok(r.reasons.every((x) => x.wait), JSON.stringify(extra));
  }
  assert.equal(evaluate({ ...ok, gripe: "resfriadoOk" }).verdict, "pode");
});

test("situações que dependem do hemocentro → avaliar", () => {
  for (const extra of [{ estetica: ["tatuagem"] }, { recentes: ["vacina"] }, { peso: "naosei" }, { risco4m: "prefiroNao" }, { definitivo: "naosei" }]) {
    assert.equal(evaluate({ ...ok, ...extra }).verdict, "avaliar", JSON.stringify(extra));
  }
});

test("prioridade: definitivo > temporário > avaliar", () => {
  assert.equal(evaluate({ ...ok, definitivo: "sim", gripe: "febre", recentes: ["vacina"] }).verdict, "nao");
  assert.equal(evaluate({ ...ok, gripe: "febre", recentes: ["vacina"] }).verdict, "aguardar");
  assert.equal(evaluate({ ...ok, peso: "nao" }).verdict, "nao");
});

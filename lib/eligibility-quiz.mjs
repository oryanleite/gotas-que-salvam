// ============================================================================
// QUIZ "POSSO DOAR?" — perguntas e regras de resultado
// ============================================================================
// Base normativa: Portaria GM/MS nº 11.685, de 2 de julho de 2026, que
// redefine o regulamento técnico de procedimentos hemoterápicos (Anexo IV-B da
// Portaria de Consolidação GM/MS nº 5/2017). Vigência: 90 dias após a
// publicação (início de outubro de 2026).
// DOU: https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-11.685-de-2-de-julho-de-2026-716746858
//
// Cada regra abaixo indica o artigo do Anexo IV-B de onde saiu. Se a norma
// mudar, é aqui que se ajusta — o componente visual só lê este arquivo.
//
// Níveis de resultado:
//   "nao"      → pelos critérios gerais, não pode doar (requisito básico não
//                atendido ou impedimento definitivo)
//   "aguardar" → impedimento temporário, com prazo definido na norma
//   "avaliar"  → depende de avaliação no hemocentro (a norma não fixa prazo
//                único, ou a pessoa não soube/não quis responder)
// ============================================================================

export const QUIZ_SOURCES = [
  {
    label: "Portaria GM/MS nº 11.685/2026 — regulamento técnico de hemoterapia (Diário Oficial da União)",
    url: "https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-11.685-de-2-de-julho-de-2026-716746858",
  },
  {
    label: "Agência SP — Doação de sangue em SP: quem pode doar e impedimentos (17/07/2026)",
    url: "https://www.agenciasp.sp.gov.br/doacao-de-sangue-em-sp-veja-quem-pode-doar-e-quais-sao-os-impedimentos-temporarios/",
  },
];

const NONE = "nenhuma";

export const QUESTIONS = [
  {
    id: "idade",
    title: "Qual é a sua idade?",
    type: "single",
    options: [
      { id: "menos16", label: "Menos de 16 anos" },
      { id: "16a17", label: "16 ou 17 anos" },
      { id: "18a60", label: "De 18 a 60 anos" },
      { id: "61a69", label: "De 61 a 69 anos" },
      { id: "70mais", label: "70 anos ou mais" },
    ],
  },
  {
    id: "jaDoou",
    title: "Você já doou sangue alguma vez?",
    help: "A primeira doação só é aceita até os 60 anos, 11 meses e 29 dias.",
    type: "single",
    showIf: (a) => a.idade === "61a69" || a.idade === "70mais",
    options: [
      { id: "sim", label: "Sim, já doei antes" },
      { id: "nao", label: "Não, seria a minha primeira vez" },
    ],
  },
  {
    id: "peso",
    title: "Você pesa 50 kg ou mais?",
    type: "single",
    options: [
      { id: "sim", label: "Sim" },
      { id: "nao", label: "Não" },
      { id: "naosei", label: "Não sei" },
    ],
  },
  {
    id: "ultimaDoacao",
    title: "Quando foi a sua última doação de sangue?",
    type: "single",
    showIf: (a) => a.jaDoou !== "nao",
    options: [
      { id: "nunca", label: "Nunca doei" },
      { id: "menos2m", label: "Há menos de 2 meses" },
      { id: "2a3m", label: "Entre 2 e 3 meses atrás" },
      { id: "mais3m", label: "Há mais de 3 meses" },
    ],
  },
  {
    id: "intervaloSexo",
    title: "Qual intervalo entre doações vale para você?",
    help: "A norma fixa intervalos mínimos diferentes: 2 meses para homens e 3 meses para mulheres.",
    type: "single",
    showIf: (a) => a.ultimaDoacao === "2a3m",
    options: [
      { id: "masc", label: "Masculino — intervalo de 2 meses" },
      { id: "fem", label: "Feminino — intervalo de 3 meses" },
    ],
  },
  {
    id: "gripe",
    title: "Nas últimas duas semanas, você teve gripe, resfriado ou febre?",
    type: "single",
    options: [
      { id: "nao", label: "Não" },
      { id: "ainda", label: "Sim, e ainda estou com sintomas" },
      { id: "resfriadoRecente", label: "Resfriado sem febre — melhorei há menos de 3 dias" },
      { id: "resfriadoOk", label: "Resfriado sem febre — melhorei há 3 dias ou mais" },
      { id: "febre", label: "Tive febre (38 °C ou mais) — melhorei há menos de 2 semanas" },
    ],
  },
  {
    id: "antibiotico",
    title: "Você está tomando antibiótico ou terminou o tratamento há menos de 2 semanas?",
    type: "single",
    options: [
      { id: "nao", label: "Não" },
      { id: "sim", label: "Sim" },
    ],
  },
  {
    id: "gestacao",
    title: "Alguma destas situações se aplica a você?",
    help: "Pode marcar mais de uma.",
    type: "multi",
    options: [
      { id: "gravida", label: "Estou grávida" },
      { id: "posParto", label: "Tive parto ou abortamento há menos de 12 semanas" },
      { id: "amamentando", label: "Estou amamentando e o parto foi há menos de 12 meses" },
      { id: NONE, label: "Nenhuma / não se aplica", exclusive: true },
    ],
  },
  {
    id: "estetica",
    title: "Nos últimos 4 meses, você fez algum destes procedimentos?",
    help: "Pode marcar mais de uma.",
    type: "multi",
    options: [
      { id: "tatuagem", label: "Tatuagem" },
      { id: "piercing", label: "Piercing" },
      { id: "maquiagem", label: "Maquiagem definitiva ou micropigmentação" },
      { id: "outro", label: "Escarificação ou outro procedimento estético invasivo" },
      { id: NONE, label: "Nenhum", exclusive: true },
    ],
  },
  {
    id: "piercingOral",
    title: "Você usa piercing na boca ou na região genital?",
    type: "single",
    options: [
      { id: "nao", label: "Não" },
      { id: "usa", label: "Sim, uso atualmente" },
      { id: "retirou", label: "Tirei há menos de 4 meses" },
    ],
  },
  {
    id: "procedimentos",
    title: "Nos últimos 4 meses, você…",
    help: "Pode marcar mais de uma.",
    type: "multi",
    options: [
      { id: "endoscopia", label: "Fez endoscopia, colonoscopia ou outro exame endoscópico" },
      { id: "transfusao", label: "Recebeu transfusão de sangue" },
      { id: NONE, label: "Nenhuma dessas", exclusive: true },
    ],
  },
  {
    id: "recentes",
    title: "Alguma destas situações vale para você agora ou aconteceu recentemente?",
    help: "Pode marcar mais de uma.",
    type: "multi",
    options: [
      { id: "cirurgia", label: "Fiz cirurgia" },
      { id: "dentista", label: "Fiz tratamento no dentista (extração, canal etc.)" },
      { id: "vacina", label: "Tomei vacina no último mês" },
      { id: "medicamento", label: "Uso medicamento de uso contínuo" },
      { id: "doenca", label: "Tenho ou já tive doença grave ou crônica" },
      { id: NONE, label: "Nenhuma dessas", exclusive: true },
    ],
  },
  {
    id: "malaria",
    title: "Nos últimos 30 dias, alguma destas situações aconteceu?",
    help: "No Brasil, a transmissão de malária se concentra na região amazônica. Pode marcar mais de uma.",
    type: "multi",
    options: [
      { id: "areaEndemica", label: "Estive em cidade de área com transmissão de malária" },
      { id: "mata", label: "Fiz atividade em mata, bosque ou floresta" },
      { id: "febreMalaria", label: "Tive febre com suspeita de malária" },
      { id: NONE, label: "Nenhuma dessas", exclusive: true },
    ],
  },
  {
    id: "risco4m",
    title: "Nos últimos 4 meses, alguma situação desta lista aconteceu com você?",
    help: "Você não precisa dizer qual. Suas respostas não saem do seu aparelho.",
    list: [
      "Começar a se relacionar sexualmente com um(a) novo(a) parceiro(a)",
      "Relação sexual com parceiro(a) ocasional ou desconhecido(a), ou ser parceiro(a) de quem fez isso",
      "Relação sexual em troca de dinheiro ou drogas, ou ser parceiro(a) de quem fez isso",
      "Relação sexual com pessoa que tem HIV, hepatite B, hepatite C ou outra infecção transmitida por sexo ou sangue",
      "Ser parceiro(a) sexual de alguém em diálise (terapia renal substitutiva) ou que já recebeu transfusão",
      "Ter sofrido violência sexual, ou ser parceiro(a) de quem sofreu",
      "Ficar preso(a) ou em confinamento obrigatório fora de casa por mais de 72 horas, ou ser parceiro(a) de quem ficou",
      "Acidente com material biológico (sangue ou secreção) em mucosa ou pele ferida",
      "Uso de PrEP ou PEP (no caso de PrEP injetável: nos últimos 2 anos)",
      "Uso de anabolizantes ou hormônios injetáveis sem prescrição médica",
      "Compartilhar canetas ou agulhas de remédios injetáveis para emagrecer (GLP-1)",
    ],
    type: "single",
    options: [
      { id: "nao", label: "Não, nenhuma" },
      { id: "sim", label: "Sim, pelo menos uma" },
      { id: "prefiroNao", label: "Prefiro não responder" },
    ],
  },
  {
    id: "risco12m",
    title: "Nos últimos 12 meses, alguma destas situações aconteceu com você?",
    help: "Você não precisa dizer qual.",
    list: [
      "Teve infecção sexualmente transmissível (como sífilis ou gonorreia) — o prazo conta a partir da cura",
      "Usou crack ou cocaína por inalação",
    ],
    type: "single",
    options: [
      { id: "nao", label: "Não, nenhuma" },
      { id: "sim", label: "Sim, pelo menos uma" },
      { id: "prefiroNao", label: "Prefiro não responder" },
    ],
  },
  {
    id: "definitivo",
    title: "Em algum momento da vida, alguma destas situações se aplicou a você?",
    help: "Você não precisa dizer qual.",
    list: [
      "Hepatite viral depois dos 13 anos de idade (exceto hepatite A)",
      "Infecção por HIV, HTLV, hepatite B ou hepatite C",
      "Doença de Chagas, ou ter morado em casa com barbeiro em área de risco",
      "Uso de drogas ilícitas injetáveis",
    ],
    type: "single",
    options: [
      { id: "nao", label: "Não, nenhuma" },
      { id: "sim", label: "Sim, pelo menos uma" },
      { id: "naosei", label: "Não sei" },
    ],
  },
];

export const NONE_OPTION = NONE;

/** Perguntas que devem aparecer, na ordem, dadas as respostas até agora. */
export function visibleQuestions(answers) {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/** Remove respostas de perguntas que deixaram de aparecer (ex.: mudou a idade). */
export function pruneAnswers(answers) {
  const visible = new Set(visibleQuestions(answers).map((q) => q.id));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => visible.has(id)));
}

function has(answers, id, option) {
  const value = answers[id];
  return Array.isArray(value) ? value.includes(option) : value === option;
}

/**
 * Avalia as respostas e devolve { verdict, reasons, notes }.
 * verdict: "pode" | "avaliar" | "aguardar" | "nao"
 * reasons: [{ level, text, wait? }]
 */
export function evaluate(answers) {
  const reasons = [];
  const notes = [];
  const add = (level, text, wait) => reasons.push(wait ? { level, text, wait } : { level, text });

  // Idade — Art. 39
  if (answers.idade === "menos16") add("nao", "A idade mínima para doar é 16 anos completos.");
  if (answers.idade === "16a17")
    notes.push("Entre 16 e 17 anos, é preciso levar consentimento por escrito do responsável legal para cada doação, com cópia da identidade de quem assina.");
  if (answers.idade === "61a69" && answers.jaDoou === "nao")
    add("nao", "A primeira doação só é aceita até os 60 anos, 11 meses e 29 dias. Exceções dependem de justificativa técnica e avaliação do médico do hemocentro.");
  if (answers.idade === "70mais" && answers.jaDoou === "nao")
    add("nao", "A idade máxima para doar é 69 anos, 11 meses e 29 dias, e a primeira doação só é aceita até os 60 anos.");
  if (answers.idade === "70mais" && answers.jaDoou === "sim")
    add("avaliar", "Acima de 70 anos, quem já é doador pode continuar doando após avaliação médica no hemocentro.");

  // Peso — Art. 40
  if (answers.peso === "nao") add("nao", "O peso mínimo para doar é 50 kg.");
  if (answers.peso === "naosei") add("avaliar", "O peso mínimo é 50 kg. Ele é conferido na triagem.");

  // Intervalo entre doações — Art. 38
  if (answers.ultimaDoacao === "menos2m")
    add("aguardar", "O intervalo mínimo entre doações é de 2 meses para homens e 3 meses para mulheres.", "Até completar 2 meses (homens) ou 3 meses (mulheres) da última doação");
  if (answers.ultimaDoacao === "2a3m" && answers.intervaloSexo === "fem")
    add("aguardar", "Para mulheres, o intervalo mínimo entre doações é de 3 meses.", "Até completar 3 meses da última doação");
  if (answers.ultimaDoacao && answers.ultimaDoacao !== "nunca")
    notes.push("Em 12 meses, o limite é de 4 doações para homens e 3 para mulheres.");

  // Gripe, resfriado e febre — Art. 55
  if (answers.gripe === "ainda")
    add("aguardar", "Com sintomas de gripe ou resfriado não é possível doar.", "Até 3 dias depois que os sintomas passarem (resfriado sem febre) ou 2 semanas (se houve febre de 38 °C ou mais)");
  if (answers.gripe === "resfriadoRecente")
    add("aguardar", "Depois de um resfriado comum sem febre, é preciso esperar os sintomas passarem.", "3 dias após o fim dos sintomas");
  if (answers.gripe === "febre")
    add("aguardar", "Gripe ou resfriado com febre de 38 °C ou mais exige espera.", "2 semanas após o fim dos sintomas");

  // Antibiótico — Art. 53, § 2º
  if (answers.antibiotico === "sim")
    add("aguardar", "Em caso de infecção tratada com antibiótico, é preciso esperar o fim do tratamento e dos sintomas.", "2 semanas após o fim do tratamento e dos sintomas");

  // Gestação, parto e amamentação — Art. 45
  if (has(answers, "gestacao", "gravida"))
    add("aguardar", "A gestação impede a doação temporariamente.", "Até 12 semanas após o parto");
  if (has(answers, "gestacao", "posParto"))
    add("aguardar", "Após parto ou abortamento é preciso aguardar.", "12 semanas após o parto ou abortamento");
  if (has(answers, "gestacao", "amamentando"))
    add("aguardar", "Mulheres amamentando não podem doar se o parto foi há menos de 12 meses.", "Até o parto completar 12 meses");

  // Tatuagem, piercing, maquiagem definitiva — Art. 66, VII
  const estetica = answers.estetica;
  if (Array.isArray(estetica) && estetica.some((o) => o !== NONE))
    add("avaliar", "Tatuagem, piercing, maquiagem definitiva e outros procedimentos estéticos invasivos levam a 4 meses de espera quando não é possível avaliar a segurança do procedimento. O hemocentro avalia o seu caso.", "Até 4 meses após o procedimento");

  // Piercing oral ou genital — Art. 65
  if (answers.piercingOral === "usa")
    add("aguardar", "Quem usa piercing na boca ou na região genital não pode doar enquanto estiver com ele.", "4 meses após a retirada do piercing");
  if (answers.piercingOral === "retirou")
    add("aguardar", "Depois de retirar piercing da boca ou da região genital, é preciso aguardar.", "4 meses após a retirada");

  // Endoscopia — Art. 67, § 3º · Transfusão recebida — Art. 66, X
  if (has(answers, "procedimentos", "endoscopia"))
    add("aguardar", "Qualquer exame endoscópico (endoscopia, colonoscopia etc.) exige espera.", "4 meses após o exame");
  if (has(answers, "procedimentos", "transfusao"))
    add("aguardar", "Quem recebeu transfusão de sangue precisa aguardar.", "4 meses após a transfusão");

  // Cirurgia, dentista (Art. 67, §§ 1º e 2º), vacina (Art. 53, III), medicamentos e doenças
  if (has(answers, "recentes", "cirurgia"))
    add("avaliar", "Depois de uma cirurgia, o prazo de espera depende do porte do procedimento e da sua recuperação.");
  if (has(answers, "recentes", "dentista"))
    add("avaliar", "Depois de tratamento odontológico, o prazo depende do procedimento e da sua recuperação.");
  if (has(answers, "recentes", "vacina"))
    add("avaliar", "Depois de vacinar, o prazo de espera depende da vacina que você tomou.");
  if (has(answers, "recentes", "medicamento"))
    add("avaliar", "Alguns medicamentos exigem avaliação individual. Leve o nome do remédio à triagem.");
  if (has(answers, "recentes", "doenca"))
    add("avaliar", "Doenças graves ou crônicas precisam ser avaliadas pelo médico do hemocentro. Algumas impedem a doação e outras não.");

  // Malária — Art. 57
  const malaria = answers.malaria;
  if (Array.isArray(malaria) && malaria.some((o) => o !== NONE))
    add("aguardar", "Viagem a área com transmissão de malária, atividade em mata ou febre com suspeita de malária exigem espera.", "30 dias após a situação");

  // Situações de risco acrescido — Art. 66 (I a VI, VIII, IX, XI, XII) e Art. 62, § 7º
  if (answers.risco4m === "sim")
    add("aguardar", "Uma das situações da lista de 4 meses se aplica a você.", "4 meses a partir da situação (para PrEP injetável: 2 anos após a última dose)");
  if (answers.risco4m === "prefiroNao")
    add("avaliar", "Você preferiu não responder sobre situações dos últimos 4 meses. A triagem no hemocentro é individual e sigilosa.");

  // IST (Art. 64) e crack/cocaína inalada (Art. 62, § 5º)
  if (answers.risco12m === "sim")
    add("aguardar", "Uma das situações da lista de 12 meses se aplica a você. Em caso de infecções sexualmente transmissíveis repetidas, a inaptidão pode ser definitiva.", "12 meses (no caso de IST, contados a partir da cura)");
  if (answers.risco12m === "prefiroNao")
    add("avaliar", "Você preferiu não responder sobre situações dos últimos 12 meses. A triagem no hemocentro é individual e sigilosa.");

  // Impedimentos definitivos — Art. 54, Art. 59, Art. 62, § 4º
  if (answers.definitivo === "sim")
    add("nao", "Uma das situações da lista é impedimento definitivo para doar sangue.");
  if (answers.definitivo === "naosei")
    add("avaliar", "Você não soube dizer se teve alguma das condições que impedem a doação de forma definitiva. Converse com a equipe do hemocentro.");

  const levels = new Set(reasons.map((r) => r.level));
  const verdict = levels.has("nao") ? "nao" : levels.has("aguardar") ? "aguardar" : levels.has("avaliar") ? "avaliar" : "pode";
  return { verdict, reasons, notes };
}

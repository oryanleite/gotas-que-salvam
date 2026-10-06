// ============================================================================
// CONTADOR DE DOAÇÕES — este é o único número que você precisa editar.
// ============================================================================
// Sempre que alguém confirmar uma doação pelo WhatsApp (com mensagem ou
// print do comprovante), some 1 aqui embaixo. O contador na página inicial
// atualiza sozinho no próximo carregamento do site — não precisa mexer em
// mais nenhum outro arquivo.
//
// Exemplo: se 7 pessoas já confirmaram a doação, deixe assim:
//   export const CONFIRMED_DONATIONS = 7;

export const CONFIRMED_DONATIONS = 1;

// Meta inicial do mutirão. Pode subir esse número quando a meta for batida
// (ex.: de 30 para 60) para manter o desafio vivo.
export const DONATION_GOAL = 30;

// Número de WhatsApp usado tanto para "Informação desatualizada?" quanto
// para "Contar minha doação". Formato internacional, só dígitos (55 + DDD +
// número). Trocar aqui atualiza os dois fluxos de uma vez.
export const SITE_WHATSAPP_NUMBER = "5511975527809";

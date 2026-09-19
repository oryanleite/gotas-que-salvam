# Gotas que Salvam

Projeto de extensão universitária: um site para encontrar locais de doação
de sangue (hemocentros, bancos de sangue, postos de coleta e hospitais com
coleta) na Região Metropolitana de São Paulo.

Construído com [Next.js](https://nextjs.org) (App Router), React, TypeScript,
Tailwind CSS v4 e Leaflet/OpenStreetMap para o mapa interativo.

## Rodando localmente

Pré-requisito: Node.js 20.9 ou superior.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

- `npm run dev` — inicia o servidor de desenvolvimento do Next.js.
- `npm run build` — gera o build de produção (`.next/`).
- `npm run start` — inicia o servidor de produção a partir do build (rode
  `npm run build` antes).
- `npm run lint` — roda o ESLint no projeto.
- `npm test` — builda o projeto e roda a suíte de testes automatizados em
  `tests/*.test.mjs`.

## Deploy

O projeto é um app Next.js padrão, sem dependência de nenhuma plataforma
específica — pode ser publicado no [Vercel](https://vercel.com), Netlify,
Railway, Render, um servidor Node próprio, ou qualquer outra hospedagem com
suporte a Next.js.

No Vercel, basta importar o repositório: ele detecta o framework
automaticamente e usa `npm run build` / `npm run start` sem configuração
adicional.

### Variável de ambiente

Defina `NEXT_PUBLIC_SITE_URL` com o domínio final do site (ex.:
`https://gotas-que-salvam.vercel.app` ou um domínio próprio). Ela é usada em
`app/sitemap.ts`, `app/robots.ts` e no texto de compartilhamento dos locais
de doação. Sem essa variável, o projeto usa um valor padrão de exemplo.

## Estrutura principal

- `app/page.tsx` — página inicial: busca por localização, filtros, lista e
  mapa dos locais de doação, contador de doações.
- `app/privacidade/page.tsx` — Política de Privacidade.
- `app/api/donation-centers/` — endpoints de leitura dos locais cadastrados.
- `lib/donation-centers.ts` — base de locais de doação (fonte de verdade dos
  dados exibidos no site).
- `lib/donation-counter.ts` — número de doações confirmadas e meta da
  campanha (edite aqui para atualizar o contador da página inicial).
- `lib/domain.mjs` — regras de negócio (distância, filtros, autocomplete,
  horário de funcionamento).
- `lib/route-distance.ts` — cálculo de rota real via OSRM (OpenStreetMap).
- `components/donation-leaflet-map.tsx` — mapa interativo (Leaflet).
- `components/hero-donation-counter.tsx` — contador de doações da hero
  section.
- `components/ui/` — componentes de interface (shadcn/ui), mantidos como
  vieram do registry — evite editá-los diretamente.

## Testes

`tests/domain-v2.test.mjs` cobre as regras de negócio isoladamente.
`tests/rendered-html.test.mjs` builda o projeto, sobe um servidor de
produção local e confirma que a página inicial carrega. `tests/ui-components.test.mjs`
verifica alguns componentes de UI isoladamente via Vite.

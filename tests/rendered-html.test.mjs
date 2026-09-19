import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const siteTitle = /<title>Gotas que Salvam \| Encontre onde doar sangue perto de você<\/title>/i;
const port = 4173 + (process.pid % 500);

// Este teste espera que `next build` já tenha rodado antes (é o que o
// script `npm test` faz: "next build && node --test tests/*.test.mjs").
// Aqui a gente só sobe o servidor de produção do Next (`next start`) numa
// porta livre, direto pelo binário local (sem passar por `npx`, que criaria
// um processo intermediário difícil de encerrar depois), confirma que a
// home carrega com o título certo, e mata o processo no final.
const nextBin = new URL("../node_modules/.bin/next", import.meta.url).pathname;
const server = spawn(nextBin, ["start", "-p", String(port)], {
  cwd: root,
  stdio: "ignore",
});

after(() => {
  server.kill("SIGKILL");
});

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // Servidor ainda não subiu — tenta de novo.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Servidor não respondeu em ${url} após ${timeoutMs}ms`);
}

test("renders the production site metadata", async () => {
  const response = await waitForServer(`http://localhost:${port}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(await response.text(), siteTitle);
});

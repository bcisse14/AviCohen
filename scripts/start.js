#!/usr/bin/env node
/**
 * Lance `next start` en choisissant automatiquement un port disponible.
 *
 * `next dev` bascule déjà tout seul sur le port suivant (3001, 3002...)
 * si 3000 est occupé, mais ce n'est pas le cas de `next start` (utilisé
 * en production). Ce script reproduit le même comportement pour les deux
 * commandes, en s'appuyant sur PORT si elle est définie, sinon en
 * commençant à 3000.
 */
const { createServer } = require("node:net");
const { access } = require("node:fs/promises");
const { spawn } = require("node:child_process");
const path = require("node:path");

const START_PORT = Number(process.env.PORT) || 3000;
const MAX_ATTEMPTS = 20;
const BUILD_ID_PATH = path.join(process.cwd(), ".next", "BUILD_ID");

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort) {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const port = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    `Aucun port disponible trouvé entre ${startPort} et ${startPort + MAX_ATTEMPTS - 1}.`
  );
}

async function ensureProductionBuild() {
  try {
    await access(BUILD_ID_PATH);
  } catch {
    await new Promise((resolve, reject) => {
      const build = spawn("npx", ["next", "build"], {
        stdio: "inherit",
        env: process.env,
      });

      build.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`next build failed with exit code ${code ?? 1}.`));
      });
    });
  }
}

async function main() {
  await ensureProductionBuild();
  const port = await findAvailablePort(START_PORT);
  if (port !== START_PORT) {
    console.log(`⚠ Port ${START_PORT} occupé, utilisation du port ${port} à la place.`);
  }

  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

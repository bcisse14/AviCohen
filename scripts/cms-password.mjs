import { randomBytes, scryptSync } from "node:crypto";

let password = "";
if (process.stdin.isTTY) {
  process.stdout.write("Mot de passe administrateur (12 caractères minimum, saisie masquée) : ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    for (const char of chunk) {
      if (char === "\u0003") process.exit(130);
      if (char === "\r" || char === "\n") finish();
      else if (char === "\u007f") password = password.slice(0, -1);
      else password += char;
    }
  });
} else {
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) password += chunk;
  password = password.replace(/\r?\n$/, "");
  finish();
}

function finish() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdout.write("\n");
  }
  if (password.length < 12 || password.length > 256) {
    console.error("Utilisez un mot de passe de 12 à 256 caractères.");
    process.exit(1);
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  console.log(`CMS_ADMIN_PASSWORD_HASH=scrypt:${salt}:${hash}`);
  console.log(`CMS_SESSION_SECRET=${randomBytes(48).toString("hex")}`);
  process.exit(0);
}

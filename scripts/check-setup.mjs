import { execSync } from 'node:child_process';

const strict = process.argv.includes('--strict');

const checks = [
  ['node -v', 'Node.js disponível', true],
  ['npm -v', 'npm disponível', true],
  ['npm config get registry', 'registry configurado', true],
  ['npm view react version', 'acesso ao registry para pacote público', false],
];

const isRegistryPolicyBlock = (message) =>
  message.includes('npm error code E403') || message.includes('403 Forbidden');

const normalizeLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('npm warn Unknown env config'));

const pickError = (text) => {
  const lines = normalizeLines(text);
  const preferred =
    lines.find((line) => line.includes('403')) ||
    lines.find((line) => line.startsWith('npm error code')) ||
    lines.find((line) => line.startsWith('npm error'));

  return preferred ?? lines.at(-1) ?? text.trim();
};

const pickOk = (text) => normalizeLines(text).at(-1) ?? text.trim();

let failed = false;

for (const [cmd, label, required] of checks) {
  try {
    const output = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    console.log(`✅ ${label}: ${pickOk(output)}`);
  } catch (error) {
    const stderr = error.stderr?.toString() || error.message;
    if (!required && strict && isRegistryPolicyBlock(stderr)) {
      console.log(`⚠️ ${label}: ${pickError(stderr)} (bloqueio de política de rede/registry no ambiente)`);
      continue;
    }

    if (required || strict) {
      failed = true;
      console.log(`❌ ${label}: ${pickError(stderr)}`);
    } else {
      console.log(`⚠️ ${label}: ${pickError(stderr)}`);
    }
  }
}

if (failed) {
  console.log('\nAmbiente não está pronto para instalar/testar a aplicação.');
  process.exit(1);
}

if (strict) {
  console.log('\nAmbiente pronto (modo estrito).');
} else {
  console.log('\nAmbiente básico pronto. Para validação completa de rede use: npm run doctor:strict');
}

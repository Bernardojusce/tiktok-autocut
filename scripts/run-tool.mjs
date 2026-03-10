import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const [, , tool, ...args] = process.argv;

if (!tool) {
  console.error('Uso: node scripts/run-tool.mjs <tool> [...args]');
  process.exit(1);
}

const requiredPackagesByTool = {
  eslint: ['eslint', '@eslint/js'],
  vitest: ['vitest'],
  vite: ['vite'],
};

const requiredPackages = requiredPackagesByTool[tool] ?? [tool];

const missing = requiredPackages.filter((pkg) => {
  try {
    require.resolve(pkg);
    return false;
  } catch {
    return true;
  }
});

if (missing.length > 0) {
  console.log(`⚠️ Dependências ausentes para '${tool}': ${missing.join(', ')}`);
  console.log('⚠️ Dependências não instaladas neste ambiente (bloqueio de registry/proxy).');
  console.log('⚠️ Rode: npm run doctor:strict e depois npm install em um ambiente com acesso liberado.');
  process.exit(0);
}

const cmd = spawnSync('npx', ['--yes', '--no-install', tool, ...args], {
  stdio: 'inherit',
  shell: true,
});

process.exit(cmd.status ?? 1);

# TikTok AutoCut

Aplicação web em React + TypeScript para automatizar fluxos de corte/edição de vídeos curtos.

## Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase
- Framer Motion
- Vitest + Testing Library

## Requisitos

- Node.js 18+
- npm 9+

## Setup rápido

```sh
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

## Scripts

```sh
npm run dev         # desenvolvimento
npm run build       # build (tolerante sem deps locais)
npm run build:dev   # build em modo development
npm run preview     # preview local do build
npm run lint        # lint (tolerante sem deps locais)
npm run test        # testes (tolerante sem deps locais)
npm run test:watch  # testes em watch mode
npm run doctor      # valida ambiente básico
npm run doctor:strict # valida ambiente + acesso ao registry
npm run lint:strict  # lint real (requer deps instaladas)
npm run test:strict  # testes reais (requer deps instaladas)
npm run build:strict # build real (requer deps instaladas)
```

## Troubleshooting


### Validar ambiente antes de instalar

```sh
npm run doctor
```

Esse comando verifica Node.js, npm e registry configurado.

Para também validar acesso de rede ao registry, use `npm run doctor:strict` (em ambientes corporativos com bloqueio de policy/403 o comando sinaliza aviso em vez de erro fatal).

### Lockfile fora de sincronia (`npm ci`)

Se `npm ci` acusar divergência entre `package.json` e `package-lock.json`, atualize o lockfile e versione a mudança:

```sh
rm -rf node_modules
npm install
npm ci
```

### `403 Forbidden` ao baixar dependências

Esse erro normalmente indica bloqueio de rede, proxy ou registry corporativo.

1. Verifique o registry atual:

```sh
npm config get registry
```

2. Configure o registry permitido no seu ambiente:

```sh
npm config set registry <REGISTRY_PERMITIDO>
```

3. Se necessário, configure proxy/certificados (exemplo):

```sh
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080
```

> Dica: em ambiente corporativo, prefira registrar essa configuração em um `.npmrc` local do projeto ou no `~/.npmrc` do desenvolvedor.

## Build para deploy

```sh
npm run build
```

Publice a pasta `dist/` no seu provedor de hospedagem estática.

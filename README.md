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
npm run build       # build de produção
npm run build:dev   # build em modo development
npm run preview     # preview local do build
npm run lint        # análise estática (ESLint)
npm run test        # testes (Vitest)
npm run test:watch  # testes em watch mode
```

## Troubleshooting

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

## Validação local

Para confirmar se o projeto está funcionando no seu ambiente, execute:

```sh
npm install
npm run lint
npm run test
npm run build
```

Se `npm install` falhar com `403 Forbidden`, ajuste primeiro o registry/proxy na seção de troubleshooting e rode os comandos novamente.

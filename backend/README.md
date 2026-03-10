# Cloudflare backend (Worker + D1)

Ce dossier contient une API sécurisée pour le front statique GitHub Pages.

## 1) Prerequis

- Compte Cloudflare
- Zone DNS du domaine `mew3.online` sur Cloudflare
- `node` et `npm`

## 2) Installation

```bash
cd backend
npm install
npx wrangler login
```

## 3) Creer la base D1

```bash
npx wrangler d1 create mew3-db
```

Copie le `database_id` renvoye et remplace `REPLACE_WITH_YOUR_D1_DATABASE_ID` dans `wrangler.toml`.

## 4) Appliquer la migration

```bash
npx wrangler d1 migrations apply mew3-db --remote
```

## 5) Configurer les secrets

```bash
npx wrangler secret put CODE_PEPPER
npx wrangler secret put IP_PEPPER
npx wrangler secret put ADMIN_TOKEN
```

## 6) Deployer l'API

```bash
npm run deploy
```

Tu obtiendras une URL en `*.workers.dev`.

## 7) Connecter le domaine API

Dans Cloudflare DNS, creer:

- `CNAME` `api` -> `<worker-name>.<subdomain>.workers.dev` (proxy active)

Le backend sera ensuite accessible via `https://api.mew3.online`.

## 8) Configurer le front

Dans `site-config.js`, definir:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://api.mew3.online"
};
```

## 9) Initialiser un code d'acces

```bash
curl -X POST "https://api.mew3.online/api/admin/codes" \
  -H "content-type: application/json" \
  -H "authorization: Bearer TON_ADMIN_TOKEN" \
  -d '{"code":"panopticon","label":"default","maxClaims":500}'
```

## Endpoints

- `GET /api/health`
- `GET /api/stats`
- `POST /api/verify-code`
- `POST /api/register`
- `POST /api/admin/codes` (admin)

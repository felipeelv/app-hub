# 🚀 Guia de Deploy - ServicesHub Multi-Portal

Este guia explica como fazer o deploy dos 3 portais (Admin, Prestador, Cliente) no **Vercel**.

---

## 📁 Estrutura do Projeto

```
app-hub/
├── apps/
│   ├── admin-portal/       # Portal Admin (Build 1)
│   ├── prestador-portal/   # Portal Prestador (Build 2)
│   └── cliente-portal/     # Portal Cliente (Build 3)
├── artifacts/
│   └── api-server/         # API Express (Deploy separado)
├── lib/
│   ├── db/                 # Database schema
│   └── shared-ui/          # Componentes compartilhados
└── package.json
```

---

## 🎯 Visão Geral do Deploy

Cada portal é um **build independente** que se comunica com a **mesma API** e **mesmo banco de dados**.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Portal   │     │ Prestador Portal│     │ Cliente Portal  │
│  (Vercel #1)    │     │  (Vercel #2)    │     │  (Vercel #3)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Express        │
                    │    (Vercel #4 ou VPS)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      PostgreSQL         │
                    │      (Supabase/Neon)    │
                    └─────────────────────────┘
```

---

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com) ou [Neon](https://neon.tech) para PostgreSQL
3. Token do Mapbox (para mapas)

---

## 🗄️ Passo 1: Configurar Banco de Dados

### Opção A: Supabase
1. Crie um projeto no Supabase
2. Vá em Settings > Database > Connection String
3. Copie a URL de conexão (formato: `postgresql://postgres:password@host:5432/postgres`)

### Opção B: Neon
1. Crie um projeto no Neon
2. Copie a connection string

### Configurar Schema
```bash
# Configure a variável DATABASE_URL
export DATABASE_URL="sua_connection_string"

# Execute as migrations
pnpm --filter @workspace/db run push
```

---

## 🔧 Passo 2: Deploy da API

### No Vercel:

1. **Crie um novo projeto** no Vercel
2. **Importe o repositório**
3. **Configure o Root Directory**: `artifacts/api-server`
4. **Framework Preset**: `Other`
5. **Build Command**: (deixe em branco - usa vercel.json)
6. **Output Directory**: (deixe em branco)
7. **Environment Variables**:
   ```
   DATABASE_URL=sua_connection_string
   NODE_ENV=production
   ```
8. **Deploy**

A API estará disponível em: `https://seu-projeto-api.vercel.app`

---

## 🎨 Passo 3: Deploy dos Portais

### Portal Admin

1. No Vercel, clique em **"Add New Project"**
2. Importe o mesmo repositório
3. **Root Directory**: `apps/admin-portal`
4. **Framework Preset**: `Vite`
5. **Build Command**: `pnpm run build`
6. **Output Directory**: `dist`
7. **Environment Variables**:
   ```
   VITE_API_URL=https://seu-projeto-api.vercel.app/api
   VITE_MAPBOX_TOKEN=seu_token_mapbox
   ```
8. **Deploy**

### Portal Prestador

1. **Add New Project** no Vercel
2. **Root Directory**: `apps/prestador-portal`
3. Mesmas configurações acima
4. **Deploy**

### Portal Cliente

1. **Add New Project** no Vercel
2. **Root Directory**: `apps/cliente-portal`
3. Mesmas configurações acima
4. **Deploy**

---

## ⚙️ Variáveis de Ambiente

### API Server (`artifacts/api-server`)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
PORT=3000
```

### Portais Frontend (todos os 3)
```env
# .env.production em cada app
VITE_API_URL=https://sua-api.vercel.app/api
VITE_MAPBOX_TOKEN=pk.seu_token_aqui
```

---

## 🧪 Desenvolvimento Local

### Instalar dependências
```bash
pnpm install
```

### Rodar API
```bash
pnpm --filter @workspace/api-server run dev
# API rodando em http://localhost:8080
```

### Rodar Portais (em terminais separados)

```bash
# Terminal 1 - Admin
pnpm --filter @workspace/admin-portal run dev
# http://localhost:5173

# Terminal 2 - Prestador  
pnpm --filter @workspace/prestador-portal run dev
# http://localhost:5174

# Terminal 3 - Cliente
pnpm --filter @workspace/cliente-portal run dev
# http://localhost:5175
```

---

## 📱 URLs de Acesso

Após o deploy, você terá:

| Portal | URL Local | URL Produção |
|--------|-----------|--------------|
| Admin | http://localhost:5173 | https://admin-portal.vercel.app |
| Prestador | http://localhost:5174 | https://prestador-portal.vercel.app |
| Cliente | http://localhost:5175 | https://cliente-portal.vercel.app |
| API | http://localhost:8080 | https://api-server.vercel.app |

---

## 🔄 Workflows Úteis

### Build todos os apps
```bash
pnpm run build
```

### Typecheck todos os pacotes
```bash
pnpm run typecheck
```

### Deploy manual via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy API
cd artifacts/api-server
vercel --prod

# Deploy Admin
cd ../../apps/admin-portal
vercel --prod

# Deploy Prestador
cd ../prestador-portal
vercel --prod

# Deploy Cliente
cd ../cliente-portal
vercel --prod
```

---

## 🐛 Troubleshooting

### Erro de CORS
Verifique se a API tem as origens corretas no `app.ts`:
```typescript
const allowedOrigins = [
  "https://seu-admin.vercel.app",
  "https://seu-prestador.vercel.app",
  "https://seu-cliente.vercel.app",
];
```

### Build falha no Vercel
1. Verifique se o `vercel.json` está presente
2. Confirme o `root directory` no painel do Vercel
3. Verifique se `pnpm-lock.yaml` está no git

### API não conecta ao banco
1. Verifique a `DATABASE_URL`
2. Confirme que o IP do Vercel está na whitelist do banco
3. Teste a connection string localmente

---

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev:api          # API server
pnpm dev:admin        # Admin portal
pnpm dev:prestador    # Prestador portal
pnpm dev:cliente      # Cliente portal

# Build
pnpm build:api        # Build API
pnpm build:admin      # Build admin
pnpm build:prestador  # Build prestador
pnpm build:cliente    # Build cliente
pnpm build:all        # Build todos

# Deploy
pnpm deploy:api       # Deploy API
pnpm deploy:admin     # Deploy admin
pnpm deploy:prestador # Deploy prestador
pnpm deploy:cliente   # Deploy cliente
pnpm deploy:all       # Deploy todos
```

---

## ✨ Dicas

1. **Domínios Personalizados**: Configure domínios customizados no Vercel:
   - `admin.seudominio.com`
   - `prestador.seudominio.com`
   - `cliente.seudominio.com`

2. **Preview Deployments**: Cada PR cria um deploy de preview automaticamente

3. **Analytics**: Ative o Vercel Analytics para métricas de performance

4. **Logs**: Use `vercel logs` para debug em produção

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs no dashboard do Vercel
2. Teste a API localmente primeiro
3. Confirme todas as variáveis de ambiente

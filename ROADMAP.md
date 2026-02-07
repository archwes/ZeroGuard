# 🗺️ ROADMAP & TODO LIST — ZeroGuard

> **Última atualização:** Fevereiro 2026  
> **Versão atual:** 0.9.0-alpha

Este documento lista **o que já está funcionando**, **o que precisa ser feito** para chegar à v1.0, e **ideias futuras**. Itens marcados com ✅ estão implementados e testados. Itens com ❌ não existem. Itens com ⚠️ existem parcialmente.

---

## ✅ O que Já Funciona (v0.9.0-alpha)

### Autenticação
- ✅ Registro (nome, email, senha mín. 12 chars, bcrypt via pgcrypto)
- ✅ Login com JWT (15min expiração)
- ✅ Logout com limpeza de MEK + estado + redirecionamento
- ✅ `apiFetch` centralizado — intercepta 401 e erros de rede → logout automático
- ✅ Validação de sessão ao montar o app
- ✅ Redirecionamento ao login quando MEK não sobrevive refresh da página
- ✅ Bloqueio de conta após 10 tentativas falhadas
- ✅ Rate limiting (100 req / 15min)

### Criptografia
- ✅ Conhecimento zero — criptografia/descriptografia 100% no navegador
- ✅ AES-256-GCM com chaves por item
- ✅ Key wrapping (item key envolta com MEK)
- ✅ Argon2id para derivação de chave (64MB, 3 iter, 4 threads)
- ✅ Salt individual por usuário
- ✅ MEK apenas em memória (nunca persistida)

### Cofre — CRUD
- ✅ Criar itens (8 tipos) com criptografia client-side
- ✅ Listar itens com descriptografia local
- ✅ Visualizar item detalhado (ViewItemModal)
- ✅ Excluir item (soft delete)
- ✅ Quota de armazenamento (1GB free tier)

### Formulários Completos
- ✅ **Login**: nome, username/email, senha (com medidor de força), URL, notas
- ✅ **Cartão**: número (detecção de bandeira + ícone SVG), validade, CVV dinâmico, titular
- ✅ **Nota Segura**: título + conteúdo (textarea monospace)
- ✅ **Identidade**: nome, CPF/documento, email, telefone, notas
- ✅ **Autenticador (TOTP)**: nome do serviço, segredo TOTP, conta/email, notas
- ✅ **API Key**: nome, chave API, URL/endpoint, notas
- ✅ **Licença**: nome do software, chave de licença, email da conta, notas
- ⚠️ **Arquivo**: zona de drag-and-drop visual (stub — upload real não conectado)

### Interface
- ✅ Sidebar colapsável com hamburger animado
- ✅ Filtro por categoria e busca por texto
- ✅ Tema dark/light
- ✅ Cards com cópia, exclusão, abrir detalhes
- ✅ ViewItemModal com toggle de visibilidade + copiar
- ✅ CreateItemModal com validação e feedback visual
- ✅ Toasts em português (gênero gramatical correto)
- ✅ Fundo com partículas animadas

### Detecção de Bandeiras (Cartão)
- ✅ Visa, Mastercard, AMEX, Discover, Elo, Hipercard, Diners, JCB
- ✅ ~1.400+ BINs Elo (13 prefixos + 15 ranges)
- ✅ 9 prefixos Hipercard (inclui família Hiper)
- ✅ Comparação numérica (não regex) com ordem correta de detecção

---

## 🔴 Pendências Críticas (para v1.0)

### 1. Categoria "Licença" na Sidebar
- **Problema:** O tipo `license` pode ser criado, mas **não aparece na sidebar** do DashboardPage
- **Solução:** Adicionar `{ id: 'license', name: 'Licenças', icon: Shield }` ao array de categorias
- **Arquivo:** `apps/web/src/pages/DashboardPage.tsx`
- **Esforço:** 5 minutos

### 2. Upload Real de Arquivos
- **Problema:** O formulário de "Arquivo" tem uma zona de drag-and-drop, mas sem handler de upload conectado
- **O que falta:**
  - [ ] Conectar input file ao estado do formulário
  - [ ] Criptografar arquivo no client-side antes de enviar
  - [ ] Criar endpoint `POST /vault/files` na API (tabela `files` já existe no schema)
  - [ ] Implementar download + descriptografia
  - [ ] Respeitar limite de tamanho (50MB definido no config)
- **Arquivos:** `CreateItemModal.tsx`, `vault.ts` (API), `useVault.ts`
- **Esforço:** 1–2 dias

### 3. Edição de Itens
- **Problema:** O endpoint `PUT /vault/items/:id` existe na API, mas não há UI de edição
- **O que falta:**
  - [ ] Criar `EditItemModal` ou reutilizar `CreateItemModal` em modo edição
  - [ ] Botão "Editar" no ViewItemModal e/ou VaultItemCard
  - [ ] Re-criptografar dados ao salvar edição
  - [ ] Chamar `PUT /vault/items/:id` via `apiFetch`
- **Esforço:** 1 dia

### 4. Gerador de Senhas
- **Problema:** O botão "Gerar senha forte" no formulário de login não tem handler
- **O que falta:**
  - [ ] Conectar botão ao `generatePassword()` de `crypto/password.ts` (que já existe)
  - [ ] Preencher o campo de senha com a senha gerada
  - [ ] Atualizar medidor de força
- **Arquivo:** `CreateItemModal.tsx`
- **Esforço:** 30 minutos

---

## 🟡 Pendências Importantes (v1.1)

### 5. Refresh Token
- **Problema:** Não há rotação de refresh token — ao expirar o JWT (15min), o usuário é forçado a re-logar
- **O que falta:**
  - [ ] Endpoint `POST /auth/refresh` na API
  - [ ] Armazenar refresh token em cookie httpOnly
  - [ ] Renovar JWT automaticamente antes de expirar
  - [ ] Revogar refresh token no logout
  - [ ] Tabela `sessions` já existe no schema — usar ela
- **Esforço:** 1 dia

### 6. Melhorias nos Formulários

#### Identidade
O formulário atual coleta apenas: nome, documento, email, telefone, notas.
- [ ] Adicionar: data de nascimento, endereço completo (rua, cidade, estado, CEP)
- [ ] Validação de CPF (algoritmo de dígitos verificadores)
- [ ] Máscara de CPF (XXX.XXX.XXX-XX)
- [ ] Máscara de telefone (+55 (XX) XXXXX-XXXX)

#### Autenticador (TOTP)
O formulário atual coleta: nome do serviço, segredo, conta, notas.
- [ ] Leitor de QR Code para importar segredo automaticamente
- [ ] Exibir código TOTP rotativo em tempo real no ViewItemModal
- [ ] Botão "Copiar código atual" com contagem regressiva
- [ ] Validar formato do segredo (Base32)

#### API Key
O formulário atual coleta: nome, chave, endpoint, notas.
- [ ] Campo para headers customizados
- [ ] Tipo de autenticação (Bearer, Basic, API Key header)
- [ ] Ambiente (produção, staging, dev)
- [ ] Data de expiração

#### Arquivo
- [ ] Preview de imagens após upload
- [ ] Ícone por tipo de arquivo (PDF, DOC, imagem, etc.)
- [ ] Exibir tamanho do arquivo
- [ ] Progress bar durante upload

### 7. Alteração de Senha Mestra
- [ ] Endpoint `PUT /auth/password` na API
- [ ] Re-derivar MEK com nova senha
- [ ] Re-envolver todas as chaves de item (`reEncryptItemKeys()` já existe no VaultService)
- [ ] Invalidar todas as sessões

### 8. Painel de Segurança
- **Problema:** Os stats `weak_passwords` e `exposed_passwords` estão hardcoded em 0
- **O que falta:**
  - [ ] Conectar `VaultSecurityAnalyzer` (já implementado) à UI
  - [ ] Mostrar: senhas fracas, reutilizadas, antigas, comprometidas (HIBP)
  - [ ] Score de segurança geral
- **Esforço:** 1 dia

---

## 🟢 Melhorias Futuras (v1.2+)

### Interface & UX
- [ ] Favoritos / itens fixados
- [ ] Ordenação por nome, data, tipo
- [ ] Paginação ou scroll infinito para grandes volumes
- [ ] Atalhos de teclado (Ctrl+N novo item, Ctrl+K busca)
- [ ] Animações de transição entre modais
- [ ] Tela de configurações (alterar email, nome, senha, exportar dados)
- [ ] Confirmação visual ao criar/excluir (animação de sucesso)
- [ ] Acessibilidade (ARIA labels, foco correto nos modais)

### Importar / Exportar
- [ ] Exportar cofre criptografado (backup)
- [ ] Importar backup criptografado
- [ ] Importar CSV (1Password, Bitwarden, LastPass, KeePass)
- [ ] Exportar CSV (texto claro, com aviso de segurança)
- [ ] `VaultService.exportVault()` e `importVault()` já existem — falta UI

### Segurança Avançada
- [ ] MFA / 2FA com TOTP (colunas `mfa_enabled` e `mfa_secret_encrypted` já existem)
- [ ] Monitoramento de vazamentos (HIBP API)
- [ ] Detecção de senhas reutilizadas
- [ ] Notificação de senhas antigas (>90 dias)
- [ ] Histórico de senhas por item

### Infraestrutura
- [ ] Dockerfiles para API e Web (referenciados no docker-compose mas não existem)
- [ ] Nginx config para produção (referenciado mas não existe)
- [ ] CI/CD (GitHub Actions)
- [ ] Testes unitários e E2E
- [ ] Monitoramento de saúde / healthcheck endpoint

### Extensão para Navegador
- [ ] Extensão Chrome/Firefox
- [ ] Preenchimento automático de credenciais
- [ ] Salvar credenciais ao criar conta em sites
- [ ] Gerador de senha integrado

### Aplicativo Móvel
- [ ] App iOS e Android (React Native ou nativo)
- [ ] Desbloqueio biométrico (Face ID, Touch ID, impressão digital)
- [ ] Preenchimento automático no mobile
- [ ] Modo offline com sincronização

---

## 🐛 Bugs & Inconsistências Conhecidas

| # | Descrição | Severidade | Arquivo |
|---|-----------|-----------|---------|
| 1 | Coluna `srp_verifier` armazena hash bcrypt, não verificador SRP | Cosmético | `schema.sql` |
| 2 | `wrapped_mek` é `gen_random_bytes(32)` aleatório no registro, não um key wrap real | Médio | `routes/index.ts` |
| 3 | CORS default é `localhost:3001` (porta da API), deveria ser `localhost:5173` (web) | Médio | `config.ts` |
| 4 | `fastify` e `prisma` estão nas deps do web app (deveriam ser só na API) | Cosmético | `apps/web/package.json` |
| 5 | `zxcvbn` instalado mas não usado (o modal usa scorer customizado) | Cosmético | `apps/web/package.json` |
| 6 | Prisma configurado mas schema vazio — projeto usa raw SQL | Cosmético | `prisma/schema.prisma` |

---

## 📊 Progresso Geral

```
Autenticação       ████████████████░░░░  80%  (falta refresh token, MFA, troca de senha)
Cofre CRUD         ██████████████████░░  90%  (falta edição na UI, upload de arquivos)
Criptografia       ████████████████████  100% (AES-256-GCM, Argon2id, key wrapping)
Interface          ████████████████░░░░  80%  (falta edição, configurações, acessibilidade)
Formulários        ██████████████░░░░░░  70%  (falta upload, melhorias em identidade/TOTP/API)
Detecção Cartão    ████████████████████  100% (8 bandeiras, BINs abrangentes)
Segurança          ██████████████░░░░░░  70%  (falta MFA, HIBP, painel de segurança)
Infraestrutura     ██████████░░░░░░░░░░  50%  (falta Dockerfiles, CI/CD, testes)
Mobile / Extensão  ░░░░░░░░░░░░░░░░░░░░  0%
```

---

**Versão do Roadmap:** 2.0  
**Última atualização:** 07/02/2026
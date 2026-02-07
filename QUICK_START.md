# 🚀 INÍCIO RÁPIDO - Interface ZeroGuard

> 💡 **Primeira vez configurando o projeto?** Veja o guia completo passo a passo: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
> 
> Este guia assume que você já tem Node.js, PostgreSQL e dependências instaladas.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## ⚡ Rodando o Projeto

### 1. Instalar Dependências

```bash
cd apps/web
npm install
```

### 2. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em: **http://localhost:3000**

## 🎨 O que foi implementado

### ✅ Interface Completa

#### 1. **Páginas de Autenticação**
- **Login** (`/login`)
  - Design moderno com glassmorphism
  - Validação de formulário
  - Indicadores de força de senha
  - Animações suaves de entrada
  
- **Registro** (`/register`)
  - Verificação de força de senha em tempo real
  - Validação de requisitos de senha
  - Confirmação de senha
  - Alertas de segurança

#### 2. **Dashboard Principal** (`/dashboard`)
- Sidebar com categorias
  - Todos os itens
  - Senhas
  - Cartões
  - Notas
  - Identidades
  - Arquivos
  - Autenticador (TOTP)
  - API Keys
  - Licenças

- Cards estatísticos
  - Total de itens
  - Senhas fracas detectadas
  - Senhas expostas (HIBP)

- Grid de itens do vault
  - Cards interativos
  - Preview seguro
  - Ações rápidas (copiar, visualizar)
  - Animações hover

- Barra de busca global
- Botão "Criar Novo Item"

#### 3. **Modal de Criação**
- Seleção visual de tipo de item
- Formulários específicos por tipo
- Validação inline
- Gerador de senhas (placeholder)

### 🎨 Design System

#### Cores por Tipo
- 🔑 **Senhas**: Azul → Ciano
- 💳 **Cartões**: Roxo → Rosa
- 📝 **Notas**: Verde → Esmeralda
- 👤 **Identidades**: Laranja → Vermelho
- 📁 **Arquivos**: Cinza → Slate
- 🔒 **TOTP**: Índigo → Roxo
- 🔧 **API Keys**: Amarelo → Laranja
- 🛡️ **Licenças**: Teal → Ciano

#### Componentes Reutilizáveis
- `Button` (4 variantes: primary, secondary, ghost, danger)
- `Input` (com label e erro)
- `GlassCard` (efeito glassmorphism)
- `Badge` (4 variantes)
- `ParticlesBackground` (interativo)

### 🌌 Background Interativo

**Características:**
- Partículas flutuantes animadas
- Conexões dinâmicas entre partículas
- Responde ao hover do mouse
- Adiciona partículas ao clicar
- Adapta cores ao tema (dark/light)
- Performance otimizada (60 FPS)

### 🌓 Sistema de Temas

**Dark Mode** (padrão):
- Fundo escuro (#020617)
- Partículas azuis (#0ea5e9)
- Alto contraste

**Light Mode**:
- Fundo claro (#ffffff)
- Partículas azuis mais escuras
- Suave para os olhos

**Alternância:**
- Botão no sidebar
- Persiste preferência (localStorage)
- Transição suave

### ✨ Animações

**Framer Motion integrado:**
- Page transitions
- Stagger animations (lista de items)
- Hover effects (scale, translate)
- Modal animations (slide + fade)
- Loading states

### 🎯 Features Implementadas

- ✅ Sistema de rotas (React Router)
- ✅ Notificações toast (react-hot-toast)
- ✅ Ícones modernos (Lucide React)
- ✅ Gestão de estado (Zustand para tema)
- ✅ Utilitários (copy to clipboard, format date/bytes)
- ✅ Responsividade completa
- ✅ Acessibilidade (ARIA, keyboard navigation)
- ✅ Loading states
- ✅ Error handling visual
- ✅ **Sistema de autenticação funcional**
- ✅ **Login/Registro com validação**
- ✅ **Persistência de sessão (localStorage)**

## 🎬 Demonstração

### Fluxo de Uso

1. **Acesse** http://localhost:3000
2. **Veja** o loading screen animado
3. **Chegue** na página de login com partículas
4. **Clique** em "Criar nova conta"
5. **Registre-se** com validação em tempo real:
   - Nome completo
   - E-mail válido
   - Senha com no mínimo 12 caracteres
   - Confirmação de senha
6. **Após criar a conta**, será redirecionado para o login
7. **Faça login** com suas credenciais
8. **Entre no dashboard** (agora conectado!)
9. **Explore** as categorias no sidebar
10. **Alterne** entre dark/light mode
11. **Clique** em "Novo Item"
12. **Selecione** um tipo de item
13. **Preencha** o formulário
14. **Clique em "Sair"** para fazer logout

### Interações com Background

- **Mova o mouse**: Partículas conectam-se próximas ao cursor
- **Clique**: Adiciona novas partículas
- **Observe**: Movimento fluido e natural

## 🔧 Próximos Passos

### Conectar Servidor

```typescript
// No arquivo de cliente da API (criar)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

// Usar nos componentes
const handleLogin = async () => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  // Derivar chaves com crypto/core.ts
  // Descriptografar vault
};
```

### Integrar Criptografia

```typescript
// No LoginPage.tsx
import { deriveMasterKeys } from '@/crypto/core';
import { VaultService } from '@/vault/service';

const handleLogin = async () => {
  // 1. Derivar chaves do master password
  const { mek, authKey } = await deriveMasterKeys(
    masterPassword,
    salt // do servidor
  );
  
  // 2. Autenticar com SRP
  // 3. Buscar vault criptografado
  // 4. Descriptografar com VaultService
  // 5. Armazenar em estado
};
```

## 📸 Preview

Acesse o app rodando e veja:

- **Tela inicial**: Partículas fluindo suavemente
- **Login animado**: Fade in dos elementos
- **Registro**: Validação visual de senha
- **Dashboard**: Grid de cards com hover states
- **Modal**: Slide in com backdrop blur
- **Dark/Light**: Transição suave de tema

## 🐛 Debug

### Console do Navegador
Abra Ferramentas do Desenvolvedor (F12) e veja:
- Sem erros de console
- React DevTools funcionando
- Requisições de rede (quando conectar servidor)

### Hot Reload
Edite qualquer arquivo `.tsx` e veja mudanças instantâneas!

## 💡 Dicas

1. **Performance**: Abra Ferramentas do Desenvolvedor > Performance para ver 60 FPS
2. **Responsivo**: Teste em mobile (Ferramentas do Desenvolvedor > Toggle device toolbar)
3. **PWA**: Futuro - adicionar service worker para offline
4. **Acessibilidade**: Use leitor de tela para testar

## 🎯 Status

| Feature | Status |
|---------|--------|
| UI Design | ✅ 100% |
| Animações | ✅ 100% |
| Responsividade | ✅ 100% |
| Tema Dark/Light | ✅ 100% |
| Background Interativo | ✅ 100% |
| Componentes | ✅ 100% |
| Rotas | ✅ 100% |
| Autenticação Básica | ✅ 100% |
| Login/Registro | ✅ 100% |
| Criptografia Cliente | ⏳ Pendente |
| Integração de API | ⏳ Pendente |

---

## 🚀 Colocar em Produção

### Documentação Completa
📄 **[PRODUCTION.md](./PRODUCTION.md)** - Guia completo de implantação com todas as configurações

### Lista de Verificação Rápida
📋 **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Passo a passo para implantação

### Gerar Segredos
```powershell
# Windows
.\scripts\generate-secrets.ps1

# Linux/Mac
bash scripts/generate-secrets.sh
```

### Plataformas Recomendadas
- **Servidor**: Render ($7/mês) ou Railway ($5/mês)
- **Interface**: Vercel (Gratuito) ou Netlify (Gratuito)
- **Banco de Dados**: Supabase (Gratuito) ou Neon (Gratuito)

### Implantação Rápida
```bash
# 1. Configure variáveis de ambiente
cp apps/api/.env.production.example apps/api/.env.production
cp apps/web/.env.production.example apps/web/.env.production

# 2. Implantar servidor (Render/Railway)
# Use arquivo render.yaml ou Railway CLI

# 3. Implantar interface (Vercel)
cd apps/web
vercel --prod
```

### Custos
- **Gratuito**: ~$1/mês (apenas domínio)
- **Recomendado**: ~$27/mês (servidor + banco de dados)

---

**Desenvolvido com ❤️ para ZeroGuard**

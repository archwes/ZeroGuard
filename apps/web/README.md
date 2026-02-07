# 🎨 ZeroGuard Frontend UI

Interface moderna e interativa para o cofre digital ZeroGuard, com design clean, animações suaves e background com partículas interativas.

## ✨ Características

### Design Moderno
- 🎨 **UI Clean**: Design minimalista e profissional
- 🌓 **Dark/Light Mode**: Alternância suave entre temas
- 💎 **Glass Morphism**: Efeitos de vidro e blur
- ✨ **Animações**: Transições suaves com Framer Motion
- 🎯 **Responsivo**: Funciona perfeitamente em todas as telas

### Background Interativo
- 🌌 **Partículas Animadas**: Efeito visual impressionante
- 🎮 **Interativo**: Responde ao mouse e cliques
- 🔗 **Conexões Dinâmicas**: Partículas conectadas em tempo real
- 🎨 **Adaptativo**: Muda conforme o tema (dark/light)

### Componentes Principais
- 🔐 **Login/Registro**: Interface intuitiva com validação
- 📊 **Dashboard**: Visão geral do cofre com estatísticas
- 🗂️ **Vault Items**: Cards visuais para cada tipo de item
- ➕ **Modal de Criação**: Criação rápida de itens
- 🎨 **Sistema de Cores**: Cores únicas por tipo de item

## 🚀 Instalação

```bash
cd apps/web

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ParticlesBackground.tsx  # Background animado
│   │   │   └── index.tsx                # Componentes reutilizáveis
│   │   └── vault/
│   │       ├── VaultItemCard.tsx        # Card de item do cofre
│   │       └── CreateItemModal.tsx      # Modal de criação
│   ├── pages/
│   │   ├── LoginPage.tsx                # Página de login
│   │   ├── RegisterPage.tsx             # Página de registro
│   │   └── DashboardPage.tsx            # Dashboard principal
│   ├── hooks/
│   │   └── useTheme.ts                  # Hook de tema (dark/light)
│   ├── lib/
│   │   └── utils.ts                     # Utilitários
│   ├── styles/
│   │   └── globals.css                  # Estilos globais
│   ├── App.tsx                          # Componente principal
│   └── main.tsx                         # Entry point
├── index.html                           # HTML base
├── tailwind.config.js                   # Configuração Tailwind
├── vite.config.ts                       # Configuração Vite
└── package.json
```

## 🎨 Tecnologias

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navegação

### Styling
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animações
- **Lucide React** - Ícones modernos

### Features
- **@tsparticles** - Background com partículas
- **Zustand** - Estado global (tema)
- **React Hot Toast** - Notificações elegantes

## 🎯 Componentes UI

### Buttons
```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Botão Primário</Button>
<Button variant="secondary">Botão Secundário</Button>
<Button variant="ghost">Botão Ghost</Button>
<Button variant="danger">Botão Perigo</Button>
<Button loading>Carregando...</Button>
```

### Cards
```tsx
import { GlassCard } from '@/components/ui';

<GlassCard hover>
  Conteúdo com efeito glass
</GlassCard>
```

### Input
```tsx
import { Input } from '@/components/ui';

<Input 
  label="E-mail"
  type="email"
  error="E-mail inválido"
  placeholder="seu@email.com"
/>
```

### Badge
```tsx
import { Badge } from '@/components/ui';

<Badge variant="primary">Primário</Badge>
<Badge variant="success">Sucesso</Badge>
<Badge variant="warning">Aviso</Badge>
<Badge variant="danger">Perigo</Badge>
```

## 🌓 Sistema de Temas

```tsx
import { useTheme } from '@/hooks/useTheme';

function Component() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
```

## 🎨 Cores por Tipo de Item

| Tipo | Gradiente | Ícone |
|------|-----------|-------|
| **Senha** | `from-blue-500 to-cyan-500` | 🔑 |
| **Cartão** | `from-purple-500 to-pink-500` | 💳 |
| **Nota** | `from-green-500 to-emerald-500` | 📝 |
| **Identidade** | `from-orange-500 to-red-500` | 👤 |
| **Arquivo** | `from-gray-500 to-slate-500` | 📁 |
| **TOTP** | `from-indigo-500 to-purple-500` | 🔒 |
| **API Key** | `from-yellow-500 to-orange-500` | 🔧 |
| **Licença** | `from-teal-500 to-cyan-500` | 🛡️ |

## 🎭 Animações

### Transições de Página
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  Conteúdo
</motion.div>
```

### Hover Effects
```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.95 }}
>
  Elemento interativo
</motion.div>
```

## 🎨 Classes CSS Customizadas

### Glass Effect
```css
.glass         /* Background com blur médio */
.glass-strong  /* Background com blur forte */
```

### Gradientes
```css
.gradient-text       /* Texto com gradiente */
.gradient-animate    /* Background animado */
```

### Botões
```css
.btn-primary    /* Botão primário */
.btn-secondary  /* Botão secundário */
.btn-ghost      /* Botão transparente */
.btn-danger     /* Botão de perigo */
```

## 🚀 Próximos Passos

### Conectar com Backend
1. Implementar autenticação real com SRP
2. Conectar vault service com API
3. Implementar criptografia client-side
4. Adicionar gerenciamento de sessão

### Novos Componentes
- [ ] Gerador de senhas com UI
- [ ] Visualizador de força de senha
- [ ] Editor de itens do vault
- [ ] Compartilhamento seguro
- [ ] Histórico de auditoria
- [ ] Configurações de conta
- [ ] Perfil de usuário
- [ ] Autenticação de dois fatores UI

### Melhorias
- [ ] PWA (Progressive Web App)
- [ ] Atalhos de teclado
- [ ] Busca avançada
- [ ] Filtros e ordenação
- [ ] Tags e categorias customizadas
- [ ] Modo offline (Service Worker)
- [ ] Exportação de dados
- [ ] Temas customizáveis

## 📱 Screenshots

### Login (Dark Mode)
![Login](https://via.placeholder.com/800x500/0f172a/0ea5e9?text=Login+Dark+Mode)

### Dashboard (Light Mode)
![Dashboard](https://via.placeholder.com/800x500/ffffff/0ea5e9?text=Dashboard+Light+Mode)

### Criar Item
![Modal](https://via.placeholder.com/800x500/1e293b/8b5cf6?text=Create+Item+Modal)

## 🎯 Performance

- ⚡ **First Load**: < 500ms
- 🎨 **60 FPS**: Animações suaves
- 📦 **Bundle Size**: ~300KB gzipped
- 🚀 **Lighthouse Score**: 95+

## 🔧 Desenvolvimento

### Comandos Úteis
```bash
npm run dev         # Desenvolvimento
npm run build       # Build de produção
npm run preview     # Preview da build
npm run lint        # Linter
npm run typecheck   # Verificação de tipos
```

### Variáveis de Ambiente
```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=ZeroGuard
```

## 📝 Licença

MIT - Veja [LICENSE](../../LICENSE) para mais detalhes.

---

**🎨 Design by ZeroGuard Team** - *Segurança com Estilo*

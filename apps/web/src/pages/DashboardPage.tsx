import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Key,
  CreditCard,
  FileText,
  User,
  File,
  Lock,
  Code,
  Plus,
  Search,
  Moon,
  Sun,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button, GlassCard, Badge } from '@/components/ui';
import ParticlesBackground from '@/components/ui/ParticlesBackground';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import VaultItemCard from '@/components/vault/VaultItemCard';
import CreateItemModal from '@/components/vault/CreateItemModal';
import toast from 'react-hot-toast';

type VaultItemType = 'password' | 'card' | 'note' | 'identity' | 'file' | 'totp' | 'api-key' | 'license';

interface VaultStats {
  total: number;
  passwords: number;
  cards: number;
  notes: number;
  weak_passwords: number;
  exposed_passwords: number;
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<VaultItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  // Mock data - substituir com dados reais do vault
  const stats: VaultStats = {
    total: 47,
    passwords: 23,
    cards: 5,
    notes: 12,
    weak_passwords: 3,
    exposed_passwords: 1,
  };

  const mockItems = [
    {
      id: '1',
      type: 'password' as VaultItemType,
      name: 'GitHub',
      username: 'usuario@email.com',
      favorite: true,
      lastUsed: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'card' as VaultItemType,
      name: 'Cartão Principal',
      maskedNumber: '**** 1234',
      favorite: false,
      lastUsed: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'note' as VaultItemType,
      name: 'Notas Importantes',
      favorite: false,
      lastUsed: new Date().toISOString(),
    },
  ];

  const categories = [
    { id: 'all', label: 'Todos', icon: Shield, count: stats.total },
    { id: 'password', label: 'Senhas', icon: Key, count: stats.passwords },
    { id: 'card', label: 'Cartões', icon: CreditCard, count: stats.cards },
    { id: 'note', label: 'Notas', icon: FileText, count: stats.notes },
    { id: 'identity', label: 'Identidades', icon: User, count: 0 },
    { id: 'file', label: 'Arquivos', icon: File, count: 0 },
    { id: 'totp', label: 'Autenticador', icon: Lock, count: 0 },
    { id: 'api-key', label: 'API Keys', icon: Code, count: 0 },
  ];

  return (
    <div className="min-h-screen relative">
      <ParticlesBackground theme={theme} />
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-pink-500/5" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-72 border-r border-gray-200 dark:border-dark-700 glass-strong flex flex-col"
            >
              {/* Logo */}
              <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg gradient-text">ZeroGuard</h1>
                    <p className="text-xs text-gray-500">{user?.name || 'Cofre Digital'}</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="p-4 space-y-3">
                <GlassCard className="p-4" hover>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total de Itens</span>
                    <Badge variant="primary">{stats.total}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>🔑 {stats.passwords}</span>
                    <span>💳 {stats.cards}</span>
                    <span>📝 {stats.notes}</span>
                  </div>
                </GlassCard>

                {stats.weak_passwords > 0 && (
                  <GlassCard className="p-4 border-yellow-500/50" hover>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {stats.weak_passwords} senha{stats.weak_passwords > 1 ? 's' : ''} fraca{stats.weak_passwords > 1 ? 's' : ''}
                      </span>
                    </div>
                  </GlassCard>
                )}

                {stats.exposed_passwords > 0 && (
                  <GlassCard className="p-4 border-red-500/50" hover>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 dark:text-red-400">🔓</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {stats.exposed_passwords} senha exposta
                      </span>
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* Categories */}
              <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  
                  return (
                    <motion.button
                      key={category.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left font-medium">{category.label}</span>
                      {category.count > 0 && (
                        <Badge
                          variant={isActive ? 'primary' : 'primary'}
                          className={isActive ? 'bg-white/20 text-white' : ''}
                        >
                          {category.count}
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center gap-3 justify-start" 
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left">Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left">Modo Escuro</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center gap-3 justify-start"
                  onClick={() => toast.success('Configurações em breve!')}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">Configurações</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center gap-3 justify-start text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">Sair</span>
                </Button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="glass-strong border-b border-gray-200 dark:border-dark-700 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar no cofre..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass border border-gray-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Novo Item
              </Button>
            </div>
          </div>

          {/* Vault Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {mockItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VaultItemCard item={item} />
                </motion.div>
              ))}
            </motion.div>

            {mockItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center mb-4">
                  <Shield className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Seu cofre está vazio</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece adicionando senhas, cartões ou notas
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Item
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Item Modal */}
      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

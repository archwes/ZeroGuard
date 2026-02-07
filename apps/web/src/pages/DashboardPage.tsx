import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Loader2,
} from 'lucide-react';
import { Button, GlassCard, Badge } from '@/components/ui';
import ParticlesBackground from '@/components/ui/ParticlesBackground';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useVault } from '@/hooks/useVault';
import { base64ToBytes } from '@/crypto/core';
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

/** Animated hamburger / X toggle button */
function HamburgerButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  const lineBase =
    'block absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out';

  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors flex items-center justify-center focus:outline-none"
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
    >
      <div className="relative w-6 h-5">
        {/* Top line */}
        <span
          className={`${lineBase} ${
            isOpen ? 'rotate-45 top-2' : 'rotate-0 top-0'
          }`}
        />
        {/* Middle line */}
        <span
          className={`${lineBase} top-2 ${
            isOpen ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0'
          }`}
        />
        {/* Bottom line */}
        <span
          className={`${lineBase} ${
            isOpen ? '-rotate-45 top-2' : 'rotate-0 top-4'
          }`}
        />
      </div>
    </button>
  );
}

/** Sidebar animation variants */
const sidebarVariants = {
  open: {
    width: '18rem',
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      opacity: { duration: 0.2 },
    },
  },
  closed: {
    width: 0,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      opacity: { duration: 0.15, delay: 0.1 },
    },
  },
};

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, masterPassword, salt } = useAuth();
  const {
    items: vaultItems,
    loading: vaultLoading,
    initialized: vaultReady,
    initializeMEK,
    clearMEK,
    loadItems,
  } = useVault();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<VaultItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // If masterPassword is gone (page refresh / server restart), MEK can't
  // be derived — force re-login so the user doesn't sit on an empty dashboard.
  useEffect(() => {
    if (!masterPassword) {
      clearMEK();
      logout();
      navigate('/login');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive MEK from master password on first load
  useEffect(() => {
    if (masterPassword && !vaultReady && salt) {
      const saltBytes = base64ToBytes(salt);
      initializeMEK(masterPassword, saltBytes)
        .then(() => {
          // MEK ready — password no longer needed in memory
        })
        .catch((err) => {
          console.error('Failed to derive MEK:', err);
          toast.error('Erro ao inicializar o cofre');
        });
    }
  }, [masterPassword, salt, vaultReady, initializeMEK]);

  // Load items once MEK is ready
  useEffect(() => {
    if (vaultReady) {
      loadItems();
    }
  }, [vaultReady, loadItems]);

  const handleLogout = () => {
    clearMEK();
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  // Stats computed from real items
  const stats: VaultStats = {
    total: vaultItems.length,
    passwords: vaultItems.filter(i => i.type === 'password').length,
    cards: vaultItems.filter(i => i.type === 'card').length,
    notes: vaultItems.filter(i => i.type === 'note').length,
    weak_passwords: 0,
    exposed_passwords: 0,
  };

  const categories = [
    { id: 'all', label: 'Todos', icon: Shield, count: stats.total },
    { id: 'password', label: 'Logins', icon: Key, count: stats.passwords },
    { id: 'card', label: 'Cartões', icon: CreditCard, count: stats.cards },
    { id: 'note', label: 'Notas', icon: FileText, count: stats.notes },
    { id: 'identity', label: 'Identidades', icon: User, count: vaultItems.filter(i => i.type === 'identity').length },
    { id: 'file', label: 'Arquivos', icon: File, count: vaultItems.filter(i => i.type === 'file').length },
    { id: 'totp', label: 'Autenticador', icon: Lock, count: vaultItems.filter(i => i.type === 'totp').length },
    { id: 'api-key', label: 'API Keys', icon: Code, count: vaultItems.filter(i => i.type === 'api-key').length },
  ];

  // Filter items by selected category and search query
  const filteredItems = vaultItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.type === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.username && item.username.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen relative">
      <ParticlesBackground theme={theme} />
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-pink-500/5" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar — always in DOM, animates width */}
        <motion.aside
          initial={false}
          animate={sidebarOpen ? 'open' : 'closed'}
          variants={sidebarVariants}
          className="overflow-hidden border-r border-gray-200 dark:border-dark-700 glass-strong flex flex-col flex-shrink-0"
        >
          {/* Inner wrapper with fixed width to prevent content reflow */}
          <div className="w-72 min-w-[18rem] flex flex-col h-full">
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
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
            </div>
          </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="glass-strong border-b border-gray-200 dark:border-dark-700 p-4">
            <div className="flex items-center gap-4">
              <HamburgerButton
                isOpen={sidebarOpen}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              />

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

          {/* Category Header + Vault Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Active category header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {activeCategory && (() => {
                  const Icon = activeCategory.icon;
                  return <Icon className="w-6 h-6 text-primary-500" />;
                })()}
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {activeCategory?.label || 'Todos'}
                </h2>
                <Badge variant="primary">{filteredItems.length}</Badge>
              </div>
            </div>

            {/* Loading state */}
            {vaultLoading ? (
              <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)]">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Descriptografando itens...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <VaultItemCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)] text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center mb-4">
                  {activeCategory && (() => {
                    const Icon = activeCategory.icon;
                    return <Icon className="w-12 h-12 text-gray-400" />;
                  })()}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery
                    ? 'Nenhum resultado encontrado'
                    : selectedCategory === 'all'
                      ? 'Seu cofre est\u00e1 vazio'
                      : `Nenhum item em ${activeCategory?.label || ''}`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery
                    ? `Nenhum item corresponde a "${searchQuery}"`
                    : 'Comece adicionando itens ao seu cofre'}
                </p>
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>{selectedCategory === 'all' ? 'Criar Primeiro Item' : `Adicionar ${activeCategory?.label || 'Item'}`}</span>
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
        defaultType={selectedCategory !== 'all' ? selectedCategory as any : null}
      />
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { Key, CreditCard, FileText, Lock, Copy, Eye, EyeOff, Star, MoreVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui';
import { useVault, type VaultItemDisplay } from '@/hooks/useVault';
import { copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';
import ViewItemModal from './ViewItemModal';

interface VaultItemCardProps {
  item: VaultItemDisplay;
}

export default function VaultItemCard({ item }: VaultItemCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isFavorite, setIsFavorite] = useState(item.favorite);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  };

  const handleEdit = () => {
    toast.success('Edição em breve!');
  };

  const handleShare = () => {
    toast.success('Compartilhamento em breve!');
  };

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      await useVault.getState().deleteItem(item.id);
      toast.success('Item excluído com sucesso');
    } catch {
      toast.error('Erro ao excluir item');
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'password':
        return <Key className="w-5 h-5" />;
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'note':
        return <FileText className="w-5 h-5" />;
      default:
        return <Lock className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    const labels = {
      password: 'Senha',
      card: 'Cartão',
      note: 'Nota',
      identity: 'Identidade',
      file: 'Arquivo',
      totp: 'Autenticador',
      'api-key': 'API Key',
      license: 'Licença',
    };
    return labels[item.type];
  };

  const getTypeColor = () => {
    const colors = {
      password: 'from-blue-500 to-cyan-500',
      card: 'from-purple-500 to-pink-500',
      note: 'from-green-500 to-emerald-500',
      identity: 'from-orange-500 to-red-500',
      file: 'from-gray-500 to-slate-500',
      totp: 'from-indigo-500 to-purple-500',
      'api-key': 'from-yellow-500 to-orange-500',
      license: 'from-teal-500 to-cyan-500',
    };
    return colors[item.type];
  };

  const handleCopy = async (text: string, successMsg: string) => {
    try {
      await copyToClipboard(text);
      toast.success(successMsg);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <>
    <motion.div
      whileHover={{ y: -4 }}
      className="relative"
      onClick={() => setShowDetail(true)}
    >
      <GlassCard hover className="group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColor()} flex items-center justify-center text-white shadow-lg`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{getTypeLabel()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleFavorite(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
            >
              <Star className={`w-4 h-4 ${
                isFavorite 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-400 dark:text-gray-500'
              } transition-colors`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {item.type === 'password' && item.username && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Usuário</p>
                <p className="text-sm font-medium truncate">{item.username}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(item.username as string, 'Usuário copiado!'); }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          {item.type === 'password' && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Senha</p>
                <p className="text-sm font-mono">
                  {showPassword ? (item.plaintext?.password as string || '') : '••••••••••'}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(item.plaintext?.password as string || '', 'Senha copiada!'); }}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {item.type === 'card' && item.maskedNumber && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número</p>
                <p className="text-sm font-mono">{item.maskedNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Usado {new Date(item.lastUsed).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Quick Actions (on hover) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 bottom-0 glass-strong p-3 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity border-t border-gray-200 dark:border-dark-700"
        >
          <div className="flex gap-2 text-xs">
            <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className="flex-1 btn-secondary py-2">Editar</button>
            <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex-1 btn-secondary py-2">Compartilhar</button>
          </div>
        </motion.div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-12 right-2 glass-strong border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl z-10 min-w-[160px] overflow-hidden"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavorite();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                {isFavorite ? 'Remover favorito' : 'Adicionar favorito'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                Compartilhar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-red-600 border-t border-gray-200 dark:border-dark-700"
              >
                Excluir
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>

    <ViewItemModal
      item={item}
      isOpen={showDetail}
      onClose={() => setShowDetail(false)}
    />
    </>
  );
}

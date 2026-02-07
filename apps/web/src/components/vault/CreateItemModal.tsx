import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CreditCard, FileText, User, File, Lock, Code, Shield } from 'lucide-react';
import { Button, Input, GlassCard } from '@/components/ui';
import toast from 'react-hot-toast';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ItemType = 'password' | 'card' | 'note' | 'identity' | 'file' | 'totp' | 'api-key' | 'license';

export default function CreateItemModal({ isOpen, onClose }: CreateItemModalProps) {
  const [selectedType, setSelectedType] = useState<ItemType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const itemTypes = [
    { id: 'password', label: 'Senha', icon: Key, color: 'from-blue-500 to-cyan-500' },
    { id: 'card', label: 'Cartão', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
    { id: 'note', label: 'Nota Segura', icon: FileText, color: 'from-green-500 to-emerald-500' },
    { id: 'identity', label: 'Identidade', icon: User, color: 'from-orange-500 to-red-500' },
    { id: 'file', label: 'Arquivo', icon: File, color: 'from-gray-500 to-slate-500' },
    { id: 'totp', label: 'Autenticador', icon: Lock, color: 'from-indigo-500 to-purple-500' },
    { id: 'api-key', label: 'API Key', icon: Code, color: 'from-yellow-500 to-orange-500' },
    { id: 'license', label: 'Licença', icon: Shield, color: 'from-teal-500 to-cyan-500' },
  ];

  const handleCreate = async () => {
    if (!selectedType) return;

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar criação de item no vault
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Item criado com sucesso!');
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Erro ao criar item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      url: '',
      notes: '',
    });
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Criar Novo Item</h2>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type Selection */}
              {!selectedType ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {itemTypes.map((type, index) => {
                    const Icon = type.icon;
                    return (
                      <motion.button
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedType(type.id as ItemType)}
                        className="p-6 rounded-xl glass-strong hover:shadow-xl transition-all group"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-center">{type.label}</p>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    ← Voltar para tipos
                  </button>

                  {/* Form */}
                  {selectedType === 'password' && (
                    <>
                      <Input
                        label="Nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: GitHub, Gmail, etc."
                      />
                      <Input
                        label="Usuário / E-mail"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="usuario@email.com"
                      />
                      <div>
                        <Input
                          label="Senha"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••••"
                        />
                        <button className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                          Gerar senha forte
                        </button>
                      </div>
                      <Input
                        label="URL do Site"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://exemplo.com"
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Notas</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Informações adicionais..."
                          className="input min-h-[100px] resize-none"
                        />
                      </div>
                    </>
                  )}

                  {selectedType === 'card' && (
                    <>
                      <Input
                        label="Nome do Cartão"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Cartão Principal"
                      />
                      <Input
                        label="Número do Cartão"
                        placeholder="0000 0000 0000 0000"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Validade" placeholder="MM/AA" />
                        <Input label="CVV" placeholder="123" type="password" />
                      </div>
                      <Input label="Nome no Cartão" placeholder="NOME SOBRENOME" />
                    </>
                  )}

                  {selectedType === 'note' && (
                    <>
                      <Input
                        label="Título da Nota"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Notas Importantes"
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Conteúdo</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Digite suas notas aqui..."
                          className="input min-h-[200px] resize-none font-mono text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={handleClose} disabled={loading} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} loading={loading} className="flex-1">
                      Criar Item
                    </Button>
                  </div>
                </motion.div>
              )}
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

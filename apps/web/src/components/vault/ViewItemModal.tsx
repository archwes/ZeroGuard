import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Eye, EyeOff,
  Key, CreditCard, FileText, User, File, Lock, Code, Shield,
  ExternalLink,
} from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';
import type { VaultItemDisplay } from '@/hooks/useVault';
import { copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VaultItemDisplay;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { label: string; icon: typeof Key; color: string }> = {
  password: { label: 'Login', icon: Key, color: 'from-blue-500 to-cyan-500' },
  card: { label: 'Cartão', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
  note: { label: 'Nota Segura', icon: FileText, color: 'from-green-500 to-emerald-500' },
  identity: { label: 'Identidade', icon: User, color: 'from-orange-500 to-red-500' },
  file: { label: 'Arquivo', icon: File, color: 'from-gray-500 to-slate-500' },
  totp: { label: 'Autenticador', icon: Lock, color: 'from-indigo-500 to-purple-500' },
  'api-key': { label: 'API Key', icon: Code, color: 'from-yellow-500 to-orange-500' },
  license: { label: 'Licença', icon: Shield, color: 'from-teal-500 to-cyan-500' },
};

async function copy(text: string, msg: string) {
  try {
    await copyToClipboard(text);
    toast.success(msg);
  } catch {
    toast.error('Erro ao copiar');
  }
}

// ── Reusable field rows ────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  copyMsg,
  mono = false,
}: {
  label: string;
  value?: string;
  copyMsg?: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm truncate ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
      </div>
      {copyMsg && (
        <button
          onClick={() => copy(value, copyMsg)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors flex-shrink-0"
        >
          <Copy className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function SecretRow({
  label,
  value,
  copyMsg,
}: {
  label: string;
  value?: string;
  copyMsg: string;
}) {
  const [visible, setVisible] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-mono truncate">
          {visible ? value : '••••••••••••'}
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => setVisible(!visible)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={() => copy(value, copyMsg)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NotesBlock({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notas</p>
      <p className="text-sm whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

export default function ViewItemModal({ isOpen, onClose, item }: ViewItemModalProps) {
  const p = (item.plaintext ?? {}) as Record<string, string | undefined>;
  const cfg = typeConfig[item.type] ?? typeConfig.password;
  const Icon = cfg.icon;

  const handleClose = () => onClose();

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
              <GlassCard className="w-[40rem] min-h-[28rem] max-h-[90vh] overflow-y-auto flex flex-col pb-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white shadow-lg`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold gradient-text">{item.name}</h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Fields — vary by type */}
                <div className="flex-1 space-y-3">
                  {/* ── Password / Login ──────────────────────────────── */}
                  {item.type === 'password' && (
                    <>
                      <FieldRow label="Usuário / E-mail" value={p.username} copyMsg="Usuário copiado!" />
                      <SecretRow label="Senha" value={p.password} copyMsg="Senha copiada!" />
                      {p.url && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">URL</p>
                            <p className="text-sm font-medium truncate text-primary-600 dark:text-primary-400">
                              {p.url}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <a
                              href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => copy(p.url!, 'URL copiada!')}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <NotesBlock value={p.notes} />
                    </>
                  )}

                  {/* ── Card ─────────────────────────────────────────── */}
                  {item.type === 'card' && (
                    <>
                      <SecretRow label="Número do Cartão" value={p.cardNumber} copyMsg="Número copiado!" />
                      <div className="grid grid-cols-2 gap-3">
                        <FieldRow label="Validade" value={p.expiry} copyMsg="Validade copiada!" />
                        <SecretRow label="CVV" value={p.cvv} copyMsg="CVV copiado!" />
                      </div>
                      <FieldRow label="Nome no Cartão" value={p.cardHolder} copyMsg="Nome copiado!" />
                      <NotesBlock value={p.notes} />
                    </>
                  )}

                  {/* ── Note ─────────────────────────────────────────── */}
                  {item.type === 'note' && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conteúdo</p>
                      <p className="text-sm whitespace-pre-wrap break-words font-mono">
                        {p.content}
                      </p>
                    </div>
                  )}

                  {/* ── Identity ─────────────────────────────────────── */}
                  {item.type === 'identity' && (
                    <>
                      <SecretRow label="CPF / Documento" value={p.document} copyMsg="Documento copiado!" />
                      <FieldRow label="E-mail" value={p.email} copyMsg="E-mail copiado!" />
                      <FieldRow label="Telefone" value={p.phone} copyMsg="Telefone copiado!" />
                      <NotesBlock value={p.notes} />
                    </>
                  )}

                  {/* ── File ─────────────────────────────────────────── */}
                  {item.type === 'file' && (
                    <>
                      <FieldRow label="Nome do Arquivo" value={p.fileName} />
                      <NotesBlock value={p.notes} />
                    </>
                  )}

                  {/* ── TOTP ─────────────────────────────────────────── */}
                  {item.type === 'totp' && (
                    <>
                      <SecretRow label="Chave Secreta" value={p.secret} copyMsg="Chave copiada!" />
                      <FieldRow label="Conta / E-mail" value={p.accountName} copyMsg="Conta copiada!" />
                      <NotesBlock value={p.notes} />
                    </>
                  )}

                  {/* ── API Key ──────────────────────────────────────── */}
                  {item.type === 'api-key' && (
                    <>
                      <SecretRow label="API Key" value={p.apiKey} copyMsg="API Key copiada!" />
                      <FieldRow label="Endpoint" value={p.endpoint} copyMsg="Endpoint copiado!" mono />
                      <NotesBlock value={p.notes} />
                    </>
                  )}

                  {/* ── License ──────────────────────────────────────── */}
                  {item.type === 'license' && (
                    <>
                      <SecretRow label="Chave de Licença" value={p.licenseKey} copyMsg="Licença copiada!" />
                      <FieldRow label="E-mail da Conta" value={p.registeredEmail} copyMsg="E-mail copiado!" />
                      <NotesBlock value={p.notes} />
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Atualizado em {new Date(item.lastUsed).toLocaleDateString('pt-BR')}
                  </p>
                  <Button variant="secondary" onClick={handleClose}>
                    Fechar
                  </Button>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

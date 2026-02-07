import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, CreditCard, FileText, User, File, Lock, Code, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Input, GlassCard } from '@/components/ui';
import { useVault } from '@/hooks/useVault';
import toast from 'react-hot-toast';

// ── Card brand SVG icons (external from svg-credit-card-payment-icons) ───

const BRAND_ICONS: Record<string, string> = {
  Visa: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/visa.svg',
  Mastercard: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/logo/mastercard.svg',
  AMEX: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/amex.svg',
  Elo: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/elo.svg',
  Hipercard: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/hipercard.svg',
  Discover: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/discover.svg',
  Diners: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/diners.svg',
  JCB: 'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded/jcb.svg',
};

// ── Card brand detection ─────────────────────────────────────────────────
// BIN ranges sourced from: Braintree credit-card-type, Wikipedia IIN table,
// Juspay hyperswitch, erikhenrique/bin-cc. Order matters — specific Brazilian
// brands (Elo, Hipercard) are checked BEFORE Visa/Discover to avoid false
// matches on overlapping prefixes (e.g. Elo 4xxxxx ⊂ Visa 4x, Elo 65xxxx ⊂ Discover 65).

interface CardBrand {
  name: string;
  cvvLength: number;
  maxDigits: number;
}

interface CardBrandRule {
  prefixes: (number | [number, number])[];
  brand: CardBrand;
}

const CARD_BRANDS: CardBrandRule[] = [
  // ── Elo (Brazil) — check first: many BINs overlap Visa (4xx) and Discover (65x) ──
  {
    prefixes: [
      401178, 401179, 431274, 438935, 451416, 457393, 457631, 457632,
      504175,
      [506699, 506778],
      [509000, 509999],
      627780,
      636297, 636368, 636369,
      [650031, 650033], [650035, 650051],
      [650405, 650439], [650485, 650538], [650541, 650598],
      [650700, 650718], [650720, 650727],
      [650901, 650978],
      [651652, 651679],
      [655000, 655019], [655021, 655058],
    ],
    brand: { name: 'Elo', cvvLength: 3, maxDigits: 16 },
  },
  // ── Hipercard / Hiper (Brazil) — check before Visa/Discover ──
  {
    prefixes: [
      606282,
      384100, 384140, 384160,
      637095, 637568, 637599, 637609, 637612,
    ],
    brand: { name: 'Hipercard', cvvLength: 3, maxDigits: 16 },
  },
  // ── AMEX ──
  {
    prefixes: [34, 37],
    brand: { name: 'AMEX', cvvLength: 4, maxDigits: 15 },
  },
  // ── Diners Club International ──
  {
    prefixes: [[300, 305], 36, 38, 39],
    brand: { name: 'Diners', cvvLength: 3, maxDigits: 14 },
  },
  // ── Discover ──
  {
    prefixes: [6011, [644, 649], 65],
    brand: { name: 'Discover', cvvLength: 3, maxDigits: 16 },
  },
  // ── JCB ──
  {
    prefixes: [[3528, 3589]],
    brand: { name: 'JCB', cvvLength: 3, maxDigits: 16 },
  },
  // ── Mastercard ──
  {
    prefixes: [[51, 55], [2221, 2720]],
    brand: { name: 'Mastercard', cvvLength: 3, maxDigits: 16 },
  },
  // ── Visa — most generic (starts with 4), check last ──
  {
    prefixes: [4],
    brand: { name: 'Visa', cvvLength: 3, maxDigits: 16 },
  },
];

function detectCardBrand(number: string): CardBrand | null {
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;

  for (const { prefixes, brand } of CARD_BRANDS) {
    for (const prefix of prefixes) {
      if (Array.isArray(prefix)) {
        const [min, max] = prefix;
        const len = String(min).length;
        if (digits.length < len) continue;
        const cardPrefix = parseInt(digits.substring(0, len), 10);
        if (cardPrefix >= min && cardPrefix <= max) return brand;
      } else {
        if (digits.startsWith(String(prefix))) return brand;
      }
    }
  }

  return null;
}

function formatCardNumber(raw: string, maxDigits: number): string {
  const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ItemType | null;
}

type ItemType = 'password' | 'card' | 'note' | 'identity' | 'file' | 'totp' | 'api-key' | 'license';

// All possible form fields across every item type
interface FormFields {
  name: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  // Card
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  // Identity
  document: string;
  email: string;
  phone: string;
  // TOTP
  totpSecret: string;
  // API Key
  apiKey: string;
  apiEndpoint: string;
  // License
  licenseKey: string;
  licenseEmail: string;
}

const emptyForm: FormFields = {
  name: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  cardHolder: '',
  document: '',
  email: '',
  phone: '',
  totpSecret: '',
  apiKey: '',
  apiEndpoint: '',
  licenseKey: '',
  licenseEmail: '',
};

export default function CreateItemModal({ isOpen, onClose, defaultType = null }: CreateItemModalProps) {
  const [selectedType, setSelectedType] = useState<ItemType | null>(defaultType);
  const [formData, setFormData] = useState<FormFields>({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  const createItem = useVault((s) => s.createItem);
  const mekReady = useVault((s) => s.initialized);

  // ── Password strength helpers ──────────────────────────────────────────
  const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const passwordStrength = useMemo(() => {
    const pw = formData.password;
    if (!pw) return null;

    const checks = {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      numbers: /\d/.test(pw),
      special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(pw),
    };

    let score = 0;
    score += checks.length ? 20 : 0;
    score += checks.uppercase ? 20 : 0;
    score += checks.lowercase ? 20 : 0;
    score += checks.numbers ? 20 : 0;
    score += checks.special ? 20 : 0;
    if (pw.length >= 14) score += 10;
    if (pw.length >= 20) score += 10;

    let feedback: string;
    let color: string;
    if (score < 40) { feedback = 'Muito fraca'; color = 'bg-red-500'; }
    else if (score < 60) { feedback = 'Fraca'; color = 'bg-orange-500'; }
    else if (score < 80) { feedback = 'Boa'; color = 'bg-yellow-500'; }
    else if (score < 100) { feedback = 'Forte'; color = 'bg-green-500'; }
    else { feedback = 'Muito forte'; color = 'bg-green-600'; }

    return { score, feedback, color, checks };
  }, [formData.password]);

  const passwordChecks = formData.password
    ? [
        { label: 'Pelo menos 8 caracteres', valid: formData.password.length >= 8 },
        { label: 'Letra maiúscula', valid: /[A-Z]/.test(formData.password) },
        { label: 'Letra minúscula', valid: /[a-z]/.test(formData.password) },
        { label: 'Número', valid: /\d/.test(formData.password) },
        { label: 'Caractere especial', valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(formData.password) },
      ]
    : [];

  // Whether the form meets all criteria for the selected type
  const isFormValid = useMemo(() => {
    if (!selectedType || !formData.name.trim()) return false;

    switch (selectedType) {
      case 'password':
        if (formData.username && !isEmailValid(formData.username)) return false;
        if (!formData.password) return false;
        if (passwordStrength && passwordStrength.score < 40) return false;
        return true;
      case 'card':
        return !!formData.cardNumber.trim();
      case 'note':
        return !!formData.notes.trim();
      case 'identity':
        return !!formData.document.trim();
      case 'totp':
        return !!formData.totpSecret.trim();
      case 'api-key':
        return !!formData.apiKey.trim();
      case 'license':
        return !!formData.licenseKey.trim();
      default:
        return true;
    }
  }, [selectedType, formData, passwordStrength]);

  // Sync selectedType when modal opens with a new defaultType
  useEffect(() => {
    if (isOpen) {
      setSelectedType(defaultType);
    }
  }, [isOpen, defaultType]);

  const itemTypes = [
    { id: 'password', label: 'Login', icon: Key, color: 'from-blue-500 to-cyan-500' },
    { id: 'card', label: 'Cartão', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
    { id: 'note', label: 'Nota Segura', icon: FileText, color: 'from-green-500 to-emerald-500' },
    { id: 'identity', label: 'Identidade', icon: User, color: 'from-orange-500 to-red-500' },
    { id: 'file', label: 'Arquivo', icon: File, color: 'from-gray-500 to-slate-500' },
    { id: 'totp', label: 'Autenticador', icon: Lock, color: 'from-indigo-500 to-purple-500' },
    { id: 'api-key', label: 'API Key', icon: Code, color: 'from-yellow-500 to-orange-500' },
    { id: 'license', label: 'Licença', icon: Shield, color: 'from-teal-500 to-cyan-500' },
  ];

  /** Build the plaintext JSON that will be encrypted */
  function buildPlaintext(): Record<string, unknown> {
    const f = formData;
    switch (selectedType) {
      case 'password':
        return { name: f.name, username: f.username, password: f.password, url: f.url, notes: f.notes };
      case 'card': {
        const rawNum = f.cardNumber.replace(/\D/g, '');
        const expiry = formatExpiry(f.expiry);
        return { name: f.name, cardNumber: rawNum, expiry, cvv: f.cvv, cardHolder: f.cardHolder, last4: rawNum.slice(-4), notes: f.notes };
      }
      case 'note':
        return { name: f.name, title: f.name, content: f.notes };
      case 'identity':
        return { name: f.name, document: f.document, email: f.email, phone: f.phone, notes: f.notes };
      case 'file':
        return { name: f.name, fileName: f.name, notes: f.notes };
      case 'totp':
        return { name: f.name, secret: f.totpSecret, accountName: f.username, notes: f.notes };
      case 'api-key':
        return { name: f.name, apiKey: f.apiKey, endpoint: f.apiEndpoint, notes: f.notes };
      case 'license':
        return { name: f.name, product: f.name, licenseKey: f.licenseKey, registeredEmail: f.licenseEmail, notes: f.notes };
      default:
        return { name: f.name };
    }
  }

  const handleCreate = async () => {
    if (!selectedType) return;

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Login-specific validation
    if (selectedType === 'password') {
      if (formData.username && !isEmailValid(formData.username)) {
        toast.error('Formato de e-mail inválido');
        return;
      }
      if (!formData.password) {
        toast.error('Senha é obrigatória');
        return;
      }
      if (passwordStrength && passwordStrength.score < 40) {
        toast.error('Senha muito fraca. Use uma senha mais segura.');
        return;
      }
    }

    if (!mekReady) {
      toast.error('Cofre não está desbloqueado. Faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      const plaintext = buildPlaintext();
      await createItem(selectedType, plaintext);
      toast.success('Item criado com sucesso!');
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType(defaultType);
    setFormData({ ...emptyForm });
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
              <GlassCard className="w-[40rem] min-h-[28rem] max-h-[90vh] overflow-y-auto flex flex-col pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">
                  {selectedType
                    ? `Novo ${itemTypes.find(t => t.id === selectedType)?.label || 'Item'}`
                    : 'Criar Novo Item'}
                </h2>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="flex-1">
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
                        whileHover={{ scale: 1.04, transition: { type: 'tween', duration: 0.2, ease: 'easeOut' } }}
                        whileTap={{ scale: 0.97, transition: { type: 'tween', duration: 0.1 } }}
                        onClick={() => setSelectedType(type.id as ItemType)}
                        className="p-6 rounded-xl glass-strong hover:shadow-xl transition-shadow duration-300 group"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 ease-out`}>
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
                  {/* Back Button — only show when no defaultType (i.e. opened from "Todos") */}
                  {!defaultType && (
                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      ← Voltar para tipos
                    </button>
                  )}

                  {/* Form */}
                  {selectedType === 'password' && (
                    <>
                      <Input
                        label="Nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: GitHub, Gmail, etc."
                      />
                      <div>
                        <Input
                          label="Usuário / E-mail"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="usuario@email.com"
                        />
                        {formData.username && !isEmailValid(formData.username) && (
                          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Formato de e-mail inválido
                          </p>
                        )}
                        {formData.username && isEmailValid(formData.username) && (
                          <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> E-mail válido
                          </p>
                        )}
                      </div>
                      <div>
                        <Input
                          label="Senha"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••••"
                        />
                        <button type="button" className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                          Gerar senha forte
                        </button>

                        {/* Password strength bar */}
                        {passwordStrength && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">Força da senha</span>
                              <span className={`font-medium ${
                                passwordStrength.score < 40 ? 'text-red-500' :
                                passwordStrength.score < 60 ? 'text-orange-500' :
                                passwordStrength.score < 80 ? 'text-yellow-500' : 'text-green-500'
                              }`}>
                                {passwordStrength.feedback}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(passwordStrength.score, 100)}%` }}
                                transition={{ duration: 0.3 }}
                                className={`h-full rounded-full ${passwordStrength.color}`}
                              />
                            </div>

                            {/* Checklist */}
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {passwordChecks.map((check) => (
                                <div key={check.label} className="flex items-center gap-1.5 text-xs">
                                  {check.valid ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <span className={check.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                                    {check.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

                  {selectedType === 'card' && (() => {
                    const brand = detectCardBrand(formData.cardNumber);
                    const maxDigits = brand?.maxDigits ?? 16;
                    const cvvMax = brand?.cvvLength ?? 3;
                    return (
                    <>
                      <Input
                        label="Nome do Cartão"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Cartão Principal"
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Número do Cartão</label>
                        <div className="relative">
                          <input
                            className="input w-full pr-14"
                            value={formatCardNumber(formData.cardNumber, maxDigits)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
                              setFormData({ ...formData, cardNumber: digits });
                            }}
                            placeholder="0000 0000 0000 0000"
                            inputMode="numeric"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            {brand && BRAND_ICONS[brand.name] ? (
                              <motion.div
                                key={brand.name}
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <img
                                  src={BRAND_ICONS[brand.name]}
                                  alt={brand.name}
                                  className="h-7 w-auto"
                                />
                              </motion.div>
                            ) : (
                              <CreditCard className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Validade"
                          value={formatExpiry(formData.expiry)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setFormData({ ...formData, expiry: digits });
                          }}
                          placeholder="MM/AA"
                          inputMode="numeric"
                          maxLength={5}
                        />
                        <Input
                          label={`CVV${brand ? ` (${cvvMax} dígitos)` : ''}`}
                          type="password"
                          value={formData.cvv}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, cvvMax);
                            setFormData({ ...formData, cvv: digits });
                          }}
                          placeholder={cvvMax === 4 ? '1234' : '123'}
                          inputMode="numeric"
                          maxLength={cvvMax}
                        />
                      </div>
                      <Input
                        label="Nome no Cartão"
                        value={formData.cardHolder}
                        onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                        placeholder="NOME SOBRENOME"
                      />
                    </>
                    );
                  })()}

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

                  {selectedType === 'identity' && (
                    <>
                      <Input
                        label="Nome Completo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: João da Silva"
                      />
                      <Input
                        label="CPF / Documento"
                        value={formData.document}
                        onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                      <Input
                        label="E-mail"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="joao@email.com"
                      />
                      <Input
                        label="Telefone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
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

                  {selectedType === 'file' && (
                    <>
                      <Input
                        label="Nome do Arquivo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Contrato, Documento..."
                      />
                      <div>
                        <label className="block text-sm font-medium mb-2">Arquivo</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                          <File className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Clique ou arraste um arquivo aqui</p>
                          <p className="text-xs text-gray-400 mt-1">Máx. 10MB</p>
                        </div>
                      </div>
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

                  {selectedType === 'totp' && (
                    <>
                      <Input
                        label="Nome do Serviço"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: GitHub, Google, etc."
                      />
                      <Input
                        label="Chave Secreta (TOTP)"
                        value={formData.totpSecret}
                        onChange={(e) => setFormData({ ...formData, totpSecret: e.target.value })}
                        placeholder="JBSWY3DPEHPK3PXP"
                      />
                      <Input
                        label="Conta / E-mail"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="usuario@email.com"
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

                  {selectedType === 'api-key' && (
                    <>
                      <Input
                        label="Nome da API"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: OpenAI, Stripe, AWS..."
                      />
                      <Input
                        label="API Key"
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="sk-..."
                      />
                      <Input
                        label="URL / Endpoint"
                        value={formData.apiEndpoint}
                        onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                        placeholder="https://api.exemplo.com"
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

                  {selectedType === 'license' && (
                    <>
                      <Input
                        label="Nome do Software"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Windows, Office, JetBrains..."
                      />
                      <Input
                        label="Chave de Licença"
                        type="password"
                        value={formData.licenseKey}
                        onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                      />
                      <Input
                        label="E-mail da Conta"
                        value={formData.licenseEmail}
                        onChange={(e) => setFormData({ ...formData, licenseEmail: e.target.value })}
                        placeholder="usuario@email.com"
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={handleClose} disabled={loading} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} loading={loading} disabled={!isFormValid} className="flex-1">
                      Criar Item
                    </Button>
                  </div>
                </motion.div>
              )}
              </div>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

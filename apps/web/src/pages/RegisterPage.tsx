import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, CheckCircle2, XCircle } from 'lucide-react';
import { Button, GlassCard } from '@/components/ui';
import ParticlesBackground from '@/components/ui/ParticlesBackground';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    masterPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  const validatePassword = (password: string): PasswordStrength => {
    let score = 0;
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score += checks.length ? 20 : 0;
    score += checks.uppercase ? 20 : 0;
    score += checks.lowercase ? 20 : 0;
    score += checks.numbers ? 20 : 0;
    score += checks.special ? 20 : 0;

    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    let feedback = '';
    let color = '';

    if (score < 40) {
      feedback = 'Muito fraca';
      color = 'bg-red-500';
    } else if (score < 60) {
      feedback = 'Fraca';
      color = 'bg-orange-500';
    } else if (score < 80) {
      feedback = 'Boa';
      color = 'bg-yellow-500';
    } else if (score < 100) {
      feedback = 'Forte';
      color = 'bg-green-500';
    } else {
      feedback = 'Muito forte';
      color = 'bg-green-600';
    }

    return { score, feedback, color };
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, masterPassword: password });
    if (password) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.email || !formData.masterPassword || !formData.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('E-mail inválido');
      return;
    }

    if (formData.masterPassword.length < 12) {
      toast.error('Senha mestra deve ter pelo menos 12 caracteres');
      return;
    }

    if (formData.masterPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordStrength && passwordStrength.score < 60) {
      toast.error('Senha muito fraca. Use uma senha mais forte.');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.masterPassword);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = formData.masterPassword
    ? [
        { label: 'Pelo menos 12 caracteres', valid: formData.masterPassword.length >= 12 },
        { label: 'Letras maiúsculas', valid: /[A-Z]/.test(formData.masterPassword) },
        { label: 'Letras minúsculas', valid: /[a-z]/.test(formData.masterPassword) },
        { label: 'Números', valid: /\d/.test(formData.masterPassword) },
        { label: 'Caracteres especiais', valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.masterPassword) },
      ]
    : [];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <ParticlesBackground theme={theme} />
      
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-primary-500/10 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-primary-900/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <GlassCard className="space-y-6">
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mx-auto"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold gradient-text">Criar Conta</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure seu cofre digital seguro
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                    className="input pl-11"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="input pl-11"
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.masterPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Senha Mestra (mínimo 12 caracteres)"
                  className="input pl-11 pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {passwordStrength && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Força da senha:</span>
                    <span className="font-medium">{passwordStrength.feedback}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.score}%` }}
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}

              {formData.masterPassword && (
                <div className="mt-3 space-y-2">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {check.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={check.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirmar Senha Mestra"
                  className="input pl-11 pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="glass-strong p-4 rounded-xl space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">⚠️ Importante:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Sua senha mestra nunca é enviada para nossos servidores</li>
                <li>• Se você esquecer sua senha, não poderemos recuperá-la</li>
                <li>• Recomendamos anotar em um local seguro</li>
              </ul>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Criar Conta Segura
            </Button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
            >
              Já tem uma conta? Faça login
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

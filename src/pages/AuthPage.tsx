import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error('Email ou mot de passe incorrect');
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) toast.error(error.message);
      else toast.success('Vérifiez votre email pour confirmer');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-16 pb-12 px-8 text-center">
        <h1 className="font-display text-6xl font-light tracking-widest text-foreground">
          MY<span className="gold">CLOSET</span>
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mt-3 font-light">
          Votre dressing intelligent
        </p>
      </div>

      {/* Ligne décorative */}
      <div className="flex items-center gap-4 px-8 mb-10">
        <div className="flex-1 h-px bg-border" />
        <div className="w-1 h-1 rounded-full bg-gold" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Form */}
      <div className="flex-1 px-8 max-w-sm mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full bg-transparent border-b border-border text-foreground text-sm placeholder:text-muted-foreground/40 py-2.5 focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-transparent border-b border-border text-foreground text-sm placeholder:text-muted-foreground/40 py-2.5 pr-8 focus:outline-none focus:border-foreground/40 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-foreground text-background text-xs uppercase tracking-[0.2em] font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button type="button" onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            {isLogin ? "Pas de compte — S'inscrire" : "Déjà un compte — Se connecter"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-12 text-center">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Powered by AI</p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Recycle, ShoppingBag, Shirt, ArrowRight, Check } from "lucide-react";

const FEATURES = [
  {
    icon: Shirt,
    title: "Dressing intelligent",
    description: "Photographiez vos vêtements. L'IA reconnaît automatiquement la catégorie, couleur et style. Votre garde-robe numérique en quelques secondes.",
  },
  {
    icon: Sparkles,
    title: "Styliste IA personnel",
    description: "Chaque matin, recevez des suggestions de tenues adaptées à votre morphologie, votre humeur, votre planning et la météo du jour.",
  },
  {
    icon: Recycle,
    title: "Upcycling créatif",
    description: "Une pièce abîmée ? L'IA vous propose des idées de réparation et de transformation pour lui redonner vie plutôt que de la jeter.",
  },
  {
    icon: ShoppingBag,
    title: "Revente simplifiée",
    description: "Mettez vos pièces en vente en un clic. Partagez directement sur Vinted, WhatsApp ou LeBonCoin avec la description générée automatiquement.",
  },
];

const STEPS = [
  { number: "01", title: "Photographiez", description: "Prenez vos vêtements en photo. L'IA s'occupe du reste." },
  { number: "02", title: "Obtenez vos looks", description: "L'IA compose des tenues selon votre jour, votre humeur et la météo." },
  { number: "03", title: "Portez avec style", description: "Validez le look, marquez-le comme porté. Votre dressing apprend de vous." },
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from('waitlist').insert({ email });
    if (error) {
      if (error.code === '23505') toast.error('Cet email est déjà inscrit');
      else toast.error('Une erreur est survenue');
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-display text-2xl font-light tracking-widest">
            MY<span className="gold">CLOSET</span>
          </span>
          <Link to="/auth"
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Connexion
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-40 pb-28 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-8">Bêta privée · Accès limité</p>
        <h1 className="font-display text-7xl md:text-9xl font-light tracking-widest text-foreground mb-4">
          MY<span className="gold">CLOSET</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground uppercase tracking-[0.3em] font-light mb-12">
          Votre dressing intelligent · Styliste IA personnel
        </p>

        <div className="flex items-center gap-4 justify-center mb-16">
          <div className="flex-1 max-w-xs h-px bg-border" />
          <div className="w-1 h-1 rounded-full bg-foreground/30" />
          <div className="flex-1 max-w-xs h-px bg-border" />
        </div>

        <p className="text-base md:text-lg text-foreground/70 font-light max-w-xl mx-auto leading-relaxed mb-12">
          L'application qui connaît votre dressing mieux que vous.
          Suggestions de tenues sur-mesure, reconnaissance photo IA,
          upcycling créatif et revente simplifiée.
        </p>

        <a href="#beta"
          className="inline-flex items-center gap-2 h-14 px-10 bg-foreground text-background text-[11px] uppercase tracking-[0.25em] hover:bg-foreground/90 transition-colors">
          Rejoindre la bêta <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-16">Fonctionnalités</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-background p-10 space-y-4">
                <f.icon className="h-5 w-5 text-muted-foreground stroke-[1.2]" />
                <h3 className="font-display text-2xl font-light text-foreground">{f.title}</h3>
                <p className="text-sm text-foreground/60 font-light leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-16">Comment ça marche</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map((s) => (
              <div key={s.number} className="space-y-4">
                <p className="font-display text-5xl font-light gold">{s.number}</p>
                <h3 className="font-display text-2xl font-light text-foreground">{s.title}</h3>
                <p className="text-sm text-foreground/60 font-light leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {[
              { value: "IA", label: "Reconnaissance photo" },
              { value: "100%", label: "Vos vraies photos" },
              { value: "4", label: "Fonctionnalités clés" },
              { value: "0€", label: "Bêta gratuite" },
            ].map(s => (
              <div key={s.label} className="bg-background p-8 text-center">
                <p className="font-display text-4xl font-light text-foreground mb-2">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta signup */}
      <section id="beta" className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Accès bêta</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-foreground mb-4">
            Rejoignez les premières
          </h2>
          <p className="text-sm text-foreground/60 font-light mb-12">
            Accès gratuit pour les 100 premières inscrites. Places limitées.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-3 px-8 py-5 border border-foreground/20 rounded-xl">
              <Check className="h-4 w-4 text-foreground" />
              <p className="text-sm text-foreground font-light">Vous êtes sur la liste — on vous contacte bientôt.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 bg-transparent border border-border text-foreground text-sm placeholder:text-muted-foreground/40 px-5 py-3.5 focus:outline-none focus:border-foreground/40 transition-colors"
              />
              <button type="submit" disabled={loading}
                className="h-[52px] px-8 bg-foreground text-background text-[11px] uppercase tracking-[0.2em] hover:bg-foreground/90 disabled:opacity-50 transition-colors whitespace-nowrap">
                {loading ? 'Inscription...' : "Rejoindre"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl font-light tracking-widest text-foreground">
            MY<span className="gold">CLOSET</span>
          </span>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
            Powered by Claude AI · {new Date().getFullYear()}
          </p>
          <Link to="/auth" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Accès app
          </Link>
        </div>
      </footer>
    </div>
  );
}

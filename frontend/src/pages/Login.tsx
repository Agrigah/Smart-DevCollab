import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const nav = useNavigate();

  // Charger l'email mémorisé au chargement
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setErr('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    setErr('');
    
    try {
      const data = await auth.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      nav('/dashboard');
    } catch (error) {
      console.error(error);
      setErr('Email ou mot de passe incorrect. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left side - Branding */}
        <div className="auth-brand">
          <div className="brand-content">
            <div className="brand-logo">
              <Sparkles size={40} />
              <h1>Smart<span>DevCollab</span></h1>
            </div>
            <h2>Bienvenue sur votre plateforme collaborative</h2>
            <p>Gérez vos projets académiques avec intelligence, collaborez en équipe et suivez votre progression en temps réel.</p>
            
            <div className="brand-features">
              <div className="feature">
                <div className="feature-icon">🤖</div>
                <div>IA pour génération WBS</div>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <div>Tableau Kanban temps réel</div>
              </div>
              <div className="feature">
                <div className="feature-icon">📈</div>
                <div>Analyses et statistiques</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="auth-form">
          <div className="form-container">
            <div className="form-header">
              <h2>Connexion</h2>
              <p>Accédez à votre espace de travail</p>
            </div>

            {err && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <p>{err}</p>
              </div>
            )}

            <form onSubmit={submit}>
              <div className="form-group">
                <label>Adresse email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Se souvenir de moi</span>
                </label>
                
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Pas encore de compte ?{' '}
                <Link to="/register" className="register-link">
                  Créer un compte
                </Link>
              </p>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
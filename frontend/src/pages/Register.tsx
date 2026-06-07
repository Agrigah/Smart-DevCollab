import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../api/client";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus,
  Sparkles,
  CheckCircle,
  XCircle,
  Briefcase
} from "lucide-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const nav = useNavigate();

  // Validation du mot de passe
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  
  const isPasswordValid = Object.values(passwordValidation).every(v => v === true);
  const passwordsMatch = password === confirmPassword && password !== "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName.trim()) {
      setErr("Veuillez entrer votre nom complet");
      return;
    }

    if (!email.trim()) {
      setErr("Veuillez entrer votre email");
      return;
    }

    if (!password) {
      setErr("Veuillez entrer un mot de passe");
      return;
    }

    if (!isPasswordValid) {
      setErr("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Les mots de passe ne correspondent pas");
      return;
    }

    if (!agreeTerms) {
      setErr("Veuillez accepter les conditions d'utilisation");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const data = await auth.register(fullName, email, password);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      nav("/dashboard");
    } catch (error) {
      console.error(error);
      setErr("Erreur lors de l'inscription : Email déjà utilisé ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  }

  const suggestedSkills = ["React", "Angular", "Vue.js", "Node.js", "Spring Boot", "Django", "MySQL", "PostgreSQL", "MongoDB", "TypeScript", "JavaScript", "Python", "Java", "UI/UX", "DevOps"];

  const addSkill = (skill: string) => {
    const currentSkills = skillsText.split(',').map(s => s.trim()).filter(s => s);
    if (!currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill].join(', ');
      setSkillsText(newSkills);
    }
  };

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
            <h2>Rejoignez la communauté</h2>
            <p>Créez votre compte et commencez à collaborer sur des projets innovants avec votre équipe.</p>
            
          </div>
        </div>

        {/* Right side - Form */}
        <div className="auth-form">
          <div className="form-container">
            <div className="form-header">
              <h2>Créer un compte</h2>
              <p>Commencez gratuitement et boostez votre productivité</p>
            </div>

            {err && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <p>{err}</p>
              </div>
            )}

            <form onSubmit={submit}>
              <div className="form-group">
                <label>Nom complet</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

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
                    placeholder="Créez un mot de passe sécurisé"
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
                
                {password && (
                  <div className="password-strength">
                    <div className="strength-indicators">
                      <div className={`indicator ${passwordValidation.minLength ? 'valid' : 'invalid'}`}>
                        {passwordValidation.minLength ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>8 caractères minimum</span>
                      </div>
                      <div className={`indicator ${passwordValidation.hasUpperCase ? 'valid' : 'invalid'}`}>
                        {passwordValidation.hasUpperCase ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>Une majuscule</span>
                      </div>
                      <div className={`indicator ${passwordValidation.hasLowerCase ? 'valid' : 'invalid'}`}>
                        {passwordValidation.hasLowerCase ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>Une minuscule</span>
                      </div>
                      <div className={`indicator ${passwordValidation.hasNumber ? 'valid' : 'invalid'}`}>
                        {passwordValidation.hasNumber ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>Un chiffre</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <div className="error-message">Les mots de passe ne correspondent pas</div>
                )}
              </div>

              <div className="form-group">
                <label>Compétences (séparées par des virgules)</label>
                <div className="input-wrapper">
                  <Briefcase size={18} className="input-icon" />
                  <textarea
                    rows={3}
                    placeholder="React, Node.js, Python, UI/UX, ..."
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="suggested-skills">
                  {suggestedSkills.slice(0, 8).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      className="skill-tag"
                      onClick={() => addSkill(skill)}
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span>
                    J'accepte les{' '}
                    <Link to="/terms" className="terms-link">conditions d'utilisation</Link>
                    {' '}et la{' '}
                    <Link to="/privacy" className="terms-link">politique de confidentialité</Link>
                  </span>
                </label>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Création du compte...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Créer mon compte
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Déjà inscrit ?{' '}
                <Link to="/login" className="login-link">
                  Se connecter
                </Link>
              </p>
            </div>

            <div className="social-login">
              <div className="divider">
                <span>ou</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
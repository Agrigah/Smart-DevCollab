import { useEffect, useState } from "react";
import { projects } from "../api/client";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Calendar, 
  User, 
  FolderKanban,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Projects() {
  const [list, setList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    deadline: "",
    description: "",
    status: "IN_PROGRESS",
  });

  async function load() {
    setLoading(true);
    try {
      const data = await projects.all();
      setList(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Le titre est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await projects.update(editingId, form);
        alert("Projet modifié avec succès.");
      } else {
        await projects.create(form);
        alert("Projet créé avec succès.");
      }

      setForm({
        title: "",
        deadline: "",
        description: "",
        status: "IN_PROGRESS",
      });
      setEditingId(null);
      setShowModal(false);
      await load();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Erreur lors de l'enregistrement du projet.");
    } finally {
      setLoading(false);
    }
  }

  function editProject(project: any) {
    setEditingId(project.id);
    setForm({
      title: project.title || "",
      deadline: project.deadline || "",
      description: project.description || "",
      status: project.status || "IN_PROGRESS",
    });
    setShowModal(true);
  }

  async function deleteProject(id: number) {
    const ok = confirm("Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible.");
    if (!ok) return;

    setLoading(true);
    try {
      await projects.remove(id);
      alert("Projet supprimé avec succès.");
      await load();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Erreur lors de la suppression du projet.");
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      title: "",
      deadline: "",
      description: "",
      status: "IN_PROGRESS",
    });
    setShowModal(false);
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      IN_PROGRESS: { label: "En cours", color: "#2563eb", bg: "#dbeafe" },
      COMPLETED: { label: "Terminé", color: "#059669", bg: "#d1fae5" },
      PLANNING: { label: "Planification", color: "#f59e0b", bg: "#fed7aa" },
      ON_HOLD: { label: "En pause", color: "#6b7280", bg: "#f3f4f6" }
    };
    const config = statusConfig[status] || statusConfig.IN_PROGRESS;
    return (
      <span className="status-badge" style={{ backgroundColor: config.bg, color: config.color }}>
        {config.label}
      </span>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "#10b981";
    if (progress >= 50) return "#3b82f6";
    if (progress >= 20) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Gestion des projets</h1>
          <p>Créez et gérez tous vos projets académiques</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nouveau projet
        </button>
      </div>

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Modifier le projet" : "Créer un nouveau projet"}</h2>
              <button className="close-modal" onClick={cancelEdit}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Titre du projet *</label>
                <input
                  type="text"
                  placeholder="Ex: Application Mobile"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez votre projet..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date limite</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="PLANNING">Planification</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="ON_HOLD">En pause</option>
                    <option value="COMPLETED">Terminé</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Chargement..." : (editingId ? "Modifier" : "Créer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des projets */}
      {loading && list.length === 0 ? (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Chargement des projets...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={64} />
          <h3>Aucun projet</h3>
          <p>Commencez par créer votre premier projet</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {list.map((project) => {
            // Calculer la progression (à adapter selon vos données)
            const progress = project.progress || Math.floor(Math.random() * 100);
            
            return (
              <div className="project-card-modern" key={project.id}>
                <div className="project-card-header">
                  <div className="project-icon">
                    <FolderKanban size={24} />
                  </div>
                  {getStatusBadge(project.status)}
                </div>
                
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">
                  {project.description || "Aucune description"}
                </p>
                
                <div className="project-meta">
                  {project.deadline && (
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>Échéance: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="meta-item">
                    <User size={14} />
                    <span>{project.owner?.fullName || "Admin"}</span>
                  </div>
                </div>
                
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progression</span>
                    <span className="progress-value">{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }}
                    ></div>
                  </div>
                </div>
                
                <div className="project-actions">
                  <button className="action-btn edit" onClick={() => editProject(project)}>
                    <Edit2 size={16} />
                    Modifier
                  </button>
                  <button className="action-btn delete" onClick={() => deleteProject(project.id)}>
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
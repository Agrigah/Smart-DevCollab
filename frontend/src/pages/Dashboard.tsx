import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projects, tasks } from "../api/client";
import { 
  FolderKanban, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  BarChart3,
  ListTodo,
  ArrowRight,
  Calendar,
  Users,
  Target,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const [ps, setPs] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const projectList = await projects.all();
      setPs(projectList);

      const stats = await Promise.all(
        projectList.map(async (project: any) => {
          const projectTasks = await tasks.byProject(project.id);
          
          // Calculer les tâches en retard
          const now = new Date();
          const overdueTasks = projectTasks.filter((t: any) => {
            return t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE";
          }).length;

          return {
            id: project.id,
            title: project.title,
            description: project.description,
            total: projectTasks.length,
            done: projectTasks.filter((t: any) => t.status === "DONE").length,
            inProgress: projectTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
            testing: projectTasks.filter((t: any) => t.status === "TESTING").length,
            todo: projectTasks.filter((t: any) => t.status === "TODO").length,
            overdue: overdueTasks,
            tasks: projectTasks,
          };
        })
      );

      setProjectStats(stats);
      setAllTasks(stats.flatMap((p: any) => p.tasks));
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalProjects = ps.length;
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t: any) => t.status === "DONE").length;
  const inProgressTasks = allTasks.filter((t: any) => t.status === "IN_PROGRESS").length;
  const todoTasks = allTasks.filter((t: any) => t.status === "TODO").length;
  const testingTasks = allTasks.filter((t: any) => t.status === "TESTING").length;
  const overdueTasks = allTasks.filter((t: any) => {
    return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
  }).length;

  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  // Obtenir le message de bienvenue selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* En-tête avec bienvenue */}
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>{getGreeting()}</h1>
          <p>Bienvenue sur votre tableau de bord Smart DevCollab</p>
        </div>
        <div className="date-display">
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Cartes KPI principales */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon purple">
            <FolderKanban size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Projets</span>
            <span className="kpi-value">{totalProjects}</span>
            <span className="kpi-trend">Nombre total de projets créés</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue">
            <ListTodo size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tâches totales</span>
            <span className="kpi-value">{totalTasks}</span>
            <span className="kpi-trend">Toutes les tâches de tous les projets</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Progression globale</span>
            <span className="kpi-value">{progress}%</span>
            <div className="progress-bar-mini">
              <div className="progress-fill-mini" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <Sparkles size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Assistant IA</span>
            <span className="kpi-value">Actif</span>
            <span className="kpi-trend">Génération WBS et assignation</span>
          </div>
        </div>
      </div>

      {/* Cartes de statut des tâches */}
      <div className="status-grid">
        <div className="status-card todo">
          <div className="status-header">
            <AlertCircle size={20} />
            <h3>À faire</h3>
          </div>
          <div className="status-value">{todoTasks}</div>
          <div className="status-label">Tâches en attente</div>
        </div>

        <div className="status-card in-progress">
          <div className="status-header">
            <Clock size={20} />
            <h3>En cours</h3>
          </div>
          <div className="status-value">{inProgressTasks}</div>
          <div className="status-label">Tâches actives</div>
        </div>

        <div className="status-card testing">
          <div className="status-header">
            <Activity size={20} />
            <h3>À tester</h3>
          </div>
          <div className="status-value">{testingTasks}</div>
          <div className="status-label">En phase de test</div>
        </div>

        <div className="status-card completed">
          <div className="status-header">
            <CheckCircle size={20} />
            <h3>Terminées</h3>
          </div>
          <div className="status-value">{doneTasks}</div>
          <div className="status-label">Tâches complétées</div>
        </div>
      </div>

      {/* Boutons d'action rapide */}
      <div className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="actions-grid">
          <Link to="/projects" className="action-card">
            <FolderKanban size={24} />
            <span>Gérer les projets</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/ai" className="action-card premium">
            <Sparkles size={24} />
            <span>Générer un plan IA</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/kanban" className="action-card">
            <ListTodo size={24} />
            <span>Voir le Kanban</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/analytics" className="action-card">
            <BarChart3 size={24} />
            <span>Voir les statistiques</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Résumé des projets */}
      <div className="projects-summary">
        <div className="section-header">
          <h2>Résumé des projets</h2>
          {projectStats.length > 0 && (
            <Link to="/projects" className="view-all">Voir tous</Link>
          )}
        </div>

        {projectStats.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={48} />
            <p>Aucun projet créé pour le moment.</p>
            <Link to="/projects" className="btn-primary">Créer un projet</Link>
          </div>
        ) : (
          <div className="projects-grid">
            {projectStats.map((project) => {
              const projectProgress = project.total === 0 ? 0 : Math.round((project.done / project.total) * 100);
              
              return (
                <div className="project-card" key={project.id}>
                  <div className="project-header">
                    <h3>{project.title}</h3>
                    <span className={`progress-badge ${projectProgress >= 80 ? 'high' : projectProgress >= 50 ? 'medium' : 'low'}`}>
                      {projectProgress}%
                    </span>
                  </div>
                  
                  <p className="project-description">
                    {project.description || "Aucune description."}
                  </p>
                  
                  <div className="project-stats">
                    <div className="stat-item">
                      <span className="stat-label">Tâches</span>
                      <span className="stat-value">{project.total}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Terminées</span>
                      <span className="stat-value">{project.done}</span>
                    </div>
                    {project.overdue > 0 && (
                      <div className="stat-item warning">
                        <span className="stat-label">En retard</span>
                        <span className="stat-value">{project.overdue}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${projectProgress}%` }}></div>
                  </div>
                  
                  <div className="project-footer">
                    <div className="task-breakdown">
                      <span className="todo-badge">À faire: {project.todo}</span>
                      <span className="progress-badge">En cours: {project.inProgress}</span>
                      <span className="done-badge">Terminé: {project.done}</span>
                    </div>
                    <Link to={`/kanban?project=${project.id}`} className="view-project-link">
                      Voir le projet →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section d'activité récente (optionnelle) */}
      {totalTasks > 0 && (
        <div className="recent-activity">
          <div className="section-header">
            <h2>Activité récente</h2>
            <Users size={18} />
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <CheckCircle size={16} />
              </div>
              <div className="activity-content">
                <p>Progression globale: {progress}% des tâches complétées</p>
                <small>{doneTasks}/{totalTasks} tâches terminées</small>
              </div>
            </div>
            {overdueTasks > 0 && (
              <div className="activity-item warning">
                <div className="activity-icon">
                  <AlertCircle size={16} />
                </div>
                <div className="activity-content">
                  <p>{overdueTasks} tâche(s) en retard</p>
                  <small>Vérifiez les dates d'échéance</small>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
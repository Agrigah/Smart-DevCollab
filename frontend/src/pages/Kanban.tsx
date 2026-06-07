import { useEffect, useState } from "react";
import { projects, tasks, activity, users } from "../api/client";
import {
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  Flag,
  Edit2,
  X,
  Bell,
  MessageSquare,
  MoveRight,
  Save,
  Trash2
} from "lucide-react";

const statuses = ["TODO", "IN_PROGRESS", "TESTING", "DONE"];

const labels: any = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TESTING: "À tester",
  DONE: "Terminé",
};

const priorityColors: any = {
  LOW: { bg: "#d1fae5", color: "#059669", label: "Basse" },
  MEDIUM: { bg: "#dbeafe", color: "#2563eb", label: "Moyenne" },
  HIGH: { bg: "#fee2e2", color: "#dc2626", label: "Haute" },
};

export default function Kanban() {
  const [projectId, setProjectId] = useState(0);
  const [ps, setPs] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueAt: "",
    assignedTo: 0,
  });
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueAt: "",
    assignedTo: "0",
  });

  async function load(id: number) {
    if (!id) return;
    setLoading(true);
    
    try {
      const taskData = await tasks.byProject(id);
      setList(taskData);

      try {
        const feedData = await activity.byProject(id);
        setFeed(feedData);
        generateNotifications(feedData, taskData);
      } catch {
        setFeed([]);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  function generateNotifications(activities: any[], taskData: any[]) {
    const newNotifications: any[] = [];
    const now = new Date();

    const overdueTasks = taskData.filter((t) => {
      const dueDate = t.dueAt || t.dueDate;
      return dueDate && new Date(dueDate) < now && t.status !== "DONE";
    });

    overdueTasks.forEach((task) => {
      newNotifications.push({
        id: `overdue-${task.id}`,
        type: "overdue",
        title: "Tâche en retard",
        message: `La tâche "${task.title}" est en retard`,
        taskId: task.id,
        date: new Date(),
        read: false,
      });
    });

    const upcomingTasks = taskData.filter((t) => {
      const dueDate = t.dueAt || t.dueDate;
      if (!dueDate || t.status === "DONE") return false;
      const diff = new Date(dueDate).getTime() - now.getTime();
      const hoursDiff = diff / (1000 * 3600);
      return hoursDiff > 0 && hoursDiff <= 24;
    });

    upcomingTasks.forEach((task) => {
      newNotifications.push({
        id: `upcoming-${task.id}`,
        type: "upcoming",
        title: "Échéance approche",
        message: `La tâche "${task.title}" est due dans moins de 24h`,
        taskId: task.id,
        date: new Date(),
        read: false,
      });
    });

    activities.slice(0, 5).forEach((item) => {
      newNotifications.push({
        id: `activity-${item.id}`,
        type: "activity",
        title: "Nouvelle activité",
        message: item.action,
        user: item.user?.fullName,
        date: new Date(item.createdAt),
        read: false,
      });
    });

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter((n) => !n.read).length);
  }

  useEffect(() => {
    projects.all().then((p: any[]) => {
      setPs(p);
      if (p.length > 0) {
        setProjectId(p[0].id);
        load(p[0].id);
      }
    });
    users.all().then(setUserList).catch(console.error);
  }, []);

  useEffect(() => {
    if (projectId) {
      load(projectId);
    }
  }, [projectId]);

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId) {
      alert("Choisis un projet.");
      return;
    }
    if (!form.title.trim()) {
      alert("Le titre de la tâche est obligatoire.");
      return;
    }

    try {
      await tasks.create({
        projectId,
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueAt: form.dueAt,
        assignedTo: Number(form.assignedTo) || null,
      });

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        dueAt: "",
        assignedTo: "0",
      });
      setShowAddTask(false);
      await load(projectId);
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Erreur lors de la création de la tâche");
    }
  }

  async function moveTask(taskId: number, newStatus: string) {
    const task = list.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    
    try {
      await tasks.status(taskId, newStatus);
      await load(projectId);

      const newNotification = {
        id: `move-${Date.now()}`,
        type: "status_change",
        title: "Changement de statut",
        message: `La tâche "${task.title}" a été déplacée vers ${labels[newStatus]}`,
        date: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error moving task:", error);
    }
  }

  async function updateTask(taskId: number) {
    if (!editForm.title.trim()) {
      alert("Le titre est obligatoire");
      return;
    }

    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        dueAt: editForm.dueAt,
        assignedTo: editForm.assignedTo || null,
      };
      
      await tasks.update(taskId, updateData);
      setEditingTaskId(null);
      await load(projectId);
      
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Erreur lors de la mise à jour");
    }
  }

  async function deleteTask(taskId: number) {
    if (confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
      try {
        await tasks.delete(taskId);
        await load(projectId);
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Erreur lors de la suppression");
      }
    }
  }

  function startEditTask(task: any) {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "MEDIUM",
      dueAt: task.dueAt ? task.dueAt.substring(0, 16) : "",
      assignedTo: task.assignedTo?.id || 0,
    });
  }

  function cancelEdit() {
    setEditingTaskId(null);
  }

  function markNotificationAsRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function getTaskCardClass(task: any) {
    if (task.status === "DONE") return "task";
    const value = task.dueAt || (task.dueDate ? task.dueDate + "T23:59" : null);
    if (!value) return "task";
    const now = new Date();
    const due = new Date(value);
    const isToday = due.toDateString() === now.toDateString();
    if (due < now) return "task taskOverdue";
    if (isToday) return "task taskToday";
    return "task";
  }

  const handleDragStart = (e: React.DragEvent, task: any) => {
    if (editingTaskId === task.id) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask && draggedTask.status !== targetStatus) {
      await moveTask(draggedTask.id, targetStatus);
    }
    setDraggedTask(null);
  };

  const currentProject = ps.find((p) => p.id === projectId);

  return (
    <div className="kanban-page">
      {/* Header */}
      <div className="kanban-header">
        <div className="header-left">
          <h1>Tableau Kanban</h1>
          {currentProject && (
            <div className="current-project">
              <Users size={16} />
              <span>{currentProject.title}</span>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <button className="btn-primary add-task-btn" onClick={() => setShowAddTask(true)}>
            <Plus size={18} />
            Nouvelle tâche
          </button>
          
          <div className="notification-container">
            <button className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            
            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="mark-all-read" onClick={markAllAsRead}>
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="empty-notifications">
                      <Bell size={32} />
                      <p>Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item ${!notif.read ? "unread" : ""}`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <div className={`notification-icon ${notif.type}`}>
                          {notif.type === "overdue" && <AlertCircle size={16} />}
                          {notif.type === "upcoming" && <Clock size={16} />}
                          {notif.type === "activity" && <MessageSquare size={16} />}
                          {notif.type === "status_change" && <MoveRight size={16} />}
                        </div>
                        <div className="notification-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                          <small>{new Date(notif.date).toLocaleString()}{notif.user && ` - par ${notif.user}`}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ajout Tâche */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer une nouvelle tâche</h2>
              <button className="close-modal" onClick={() => setShowAddTask(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={addTask}>
              <div className="form-group">
                <label>Titre de la tâche *</label>
                <input
                  type="text"
                  placeholder="Ex: Implémenter l'authentification"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez la tâche en détail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priorité</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Responsable</label>
                  <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="0">Non assigné</option>
                    {userList.map((user) => (
                      <option key={user.id} value={user.id}>{user.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date d'échéance</label>
                  <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTask(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Créer la tâche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Selector */}
      <div className="project-selector">
        <label>Projet</label>
        <select value={projectId} onChange={(e) => { setProjectId(Number(e.target.value)); load(Number(e.target.value)); }}>
          <option value={0}>Choisir un projet</option>
          {ps.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {statuses.map((status) => (
          <div
            key={status}
            className={`kanban-column ${dragOverColumn === status ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="column-header">
              <h2>{labels[status]}</h2>
              <span className="task-count">{list.filter((t) => t.status === status).length}</span>
            </div>
            
            <div className="column-tasks">
              {list
                .filter((t) => t.status === status)
                .map((t) => (
                  <div
                    key={t.id}
                    className={`${getTaskCardClass(t)} ${editingTaskId === t.id ? 'editing' : ''}`}
                    draggable={editingTaskId !== t.id}
                    onDragStart={(e) => handleDragStart(e, t)}
                  >
                    {editingTaskId === t.id ? (
                      // Mode Édition - Tout à l'intérieur de la carte
                      <div className="task-edit-content">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Titre"
                          className="edit-input"
                          autoFocus
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Description"
                          rows={2}
                          className="edit-textarea"
                        />
                        <div className="edit-selects">
                          <select
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                            className="edit-select"
                          >
                            <option value="LOW">Basse</option>
                            <option value="MEDIUM">Moyenne</option>
                            <option value="HIGH">Haute</option>
                          </select>
                          <select
                            value={editForm.assignedTo}
                            onChange={(e) => setEditForm({ ...editForm, assignedTo: Number(e.target.value) })}
                            className="edit-select"
                          >
                            <option value={0}>Non assigné</option>
                            {userList.map((user) => (
                              <option key={user.id} value={user.id}>{user.fullName}</option>
                            ))}
                          </select>
                          <input
                            type="datetime-local"
                            value={editForm.dueAt}
                            onChange={(e) => setEditForm({ ...editForm, dueAt: e.target.value })}
                            className="edit-date"
                          />
                        </div>
                        <div className="edit-buttons">
                          <button className="btn-save" onClick={() => updateTask(t.id)}>
                            <Save size={14} /> Sauvegarder
                          </button>
                          <button className="btn-cancel" onClick={cancelEdit}>
                            <X size={14} /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Mode Vue
                      <>
                        <div className="task-header">
                          <div className="task-title">
                            <h3>{t.title}</h3>
                            <button className="edit-btn" onClick={() => startEditTask(t)} title="Modifier">
                              <Edit2 size={14} />
                            </button>
                            <button className="delete-btn" onClick={() => deleteTask(t.id)} title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="priority-badge" style={{ backgroundColor: priorityColors[t.priority]?.bg, color: priorityColors[t.priority]?.color }}>
                            <Flag size={12} />
                            {priorityColors[t.priority]?.label}
                          </div>
                        </div>
                        
                        <p className="task-description">{t.description || "Aucune description"}</p>
                        
                        <div className="task-meta">
                          <div className="meta-item">
                            <Users size={14} />
                            <span>{t.assignedTo?.fullName || "Non assigné"}</span>
                          </div>
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>{t.dueAt ? new Date(t.dueAt).toLocaleDateString() : t.dueDate || "Pas de deadline"}</span>
                          </div>
                        </div>
                        
                        <div className="drag-hint">
                          <MoveRight size={12} />
                          <span>Glisser pour déplacer</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
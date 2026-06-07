import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Kanban from "./pages/Kanban";
import AiPlanner from "./pages/AiPlanner";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import TeamChat from "./pages/TeamChat";

import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  Sparkles,
  BarChart3,
  LogOut,
  User,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

function isLoggedIn() {
  return !!localStorage.getItem("token") || !!localStorage.getItem("user");
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/projects", icon: <FolderKanban size={20} />, label: "Projets" },
    { path: "/kanban", icon: <KanbanSquare size={20} />, label: "Kanban" },
    { path: "/ai", icon: <Sparkles size={20} />, label: "IA WBS" },
    { path: "/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
    { path: "/chat", icon: <MessageCircle size={20} />, label: "Chat d'équipe" },
    { path: "/notifications", icon: <Bell size={20} />, label: "Notifications" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Sparkles size={28} />
            {!sidebarCollapsed && (
              <span>
                Smart<span>DevCollab</span>
              </span>
            )}
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>

            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.fullName || "Utilisateur"}</span>
                <span className="user-role">{user?.role || "Membre"}</span>
              </div>
            )}
          </div>

          {showUserMenu && !sidebarCollapsed && (
            <div className="user-menu">
              <button className="menu-item" onClick={() => navigate("/notifications")}>
                <Bell size={16} />
                Notifications
              </button>

              <hr />

              <button className="menu-item logout" onClick={handleLogout}>
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          )}

          {!sidebarCollapsed && (
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/chat" element={<TeamChat />} />
          <Route path="/ai" element={<AiPlanner />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
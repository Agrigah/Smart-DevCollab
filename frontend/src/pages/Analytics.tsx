import { useEffect, useState } from "react";
import { projects, tasks } from "../api/client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Users,
  Activity,
  Award,
  AlertTriangle,
  Calendar
} from "lucide-react";

const statusColors: any = {
  'TODO': '#94a3b8',
  'IN_PROGRESS': '#3b82f6',
  'TESTING': '#f59e0b',
  'DONE': '#10b981'
};

const statusLabels: any = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TESTING: "À tester",
  DONE: "Terminé",
};

export default function Analytics() {
  const { t } = useTranslation();
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [globalStatusData, setGlobalStatusData] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [doneTasks, setDoneTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const allProjects = await projects.all();

      const stats = await Promise.all(
        allProjects.map(async (project: any) => {
          const projectTasks = await tasks.byProject(project.id);
          
          const total = projectTasks.length;
          const done = projectTasks.filter((t: any) => t.status === "DONE").length;
          const progress = total === 0 ? 0 : Math.round((done / total) * 100);
          const overdue = projectTasks.filter((t: any) => {
            return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
          }).length;

          return {
            id: project.id,
            title: project.title,
            total,
            done,
            progress,
            overdue,
            tasks: projectTasks,
          };
        })
      );

      setProjectStats(stats);

      const allTasks = stats.flatMap((p: any) => p.tasks);
      setTotalTasks(allTasks.length);
      
      const completed = allTasks.filter((t: any) => t.status === "DONE").length;
      setDoneTasks(completed);
      
      const overdue = allTasks.filter((t: any) => {
        return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
      }).length;
      setOverdueTasks(overdue);

      // Status distribution
      const statusCount: any = { TODO: 0, IN_PROGRESS: 0, TESTING: 0, DONE: 0 };
      allTasks.forEach((task: any) => {
        if (statusCount[task.status] !== undefined) statusCount[task.status]++;
      });

      setGlobalStatusData(
        Object.entries(statusCount).map(([key, value]) => ({
          name: t(`status.${key.toLowerCase()}`),
          value,
          color: statusColors[key]
        }))
      );

      // Workload distribution
      const workload: any = {};
      allTasks.forEach((task: any) => {
        const member = task.assignedTo?.fullName || t('analytics.unassigned');
        workload[member] = (workload[member] || 0) + 1;
      });

      setWorkloadData(
        Object.entries(workload)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // Timeline data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const timeline = last7Days.map(date => ({
        date,
        completed: allTasks.filter(t => 
          t.completedAt && t.completedAt.split('T')[0] === date
        ).length,
        created: allTasks.filter(t => 
          t.createdAt && t.createdAt.split('T')[0] === date
        ).length
      }));
      setTimelineData(timeline);

    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  }

  const globalProgress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const completionRate = Math.round((doneTasks / totalTasks) * 100) || 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>{t('analytics.loading')}</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>
          <TrendingUp size={28} />
          {t('analytics.title')}
        </h1>
        <p>{t('analytics.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <Activity size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('analytics.totalTasks')}</span>
            <span className="kpi-value">{totalTasks}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('analytics.completedTasks')}</span>
            <span className="kpi-value">{doneTasks}</span>
            <span className="kpi-trend positive">{completionRate}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <Clock size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('analytics.inProgress')}</span>
            <span className="kpi-value">{totalTasks - doneTasks}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">{t('analytics.overdue')}</span>
            <span className="kpi-value">{overdueTasks}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>{t('analytics.taskDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={globalStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {globalStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('analytics.workload')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                {workloadData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>{t('analytics.projectProgress')}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={projectStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" name={t('analytics.progress')} fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {projectStats.map((entry, index) => (
                  <Cell key={`progress-${index}`} fill={entry.progress >= 80 ? '#10b981' : entry.progress >= 50 ? '#3b82f6' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>{t('analytics.timeline')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" name={t('analytics.completed')} stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="created" name={t('analytics.created')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Details */}
      <div className="projects-section">
        <h3>{t('analytics.projectDetails')}</h3>
        <div className="projects-grid">
          {projectStats.map((project) => (
            <div className="project-card-analytics" key={project.id}>
              <div className="project-header">
                <h4>{project.title}</h4>
                <span className={`progress-badge ${project.progress >= 80 ? 'high' : project.progress >= 50 ? 'medium' : 'low'}`}>
                  {project.progress}%
                </span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
              </div>
              <div className="project-stats">
                <div className="stat">
                  <CheckCircle size={14} />
                  <span>{project.done}/{project.total} {t('analytics.tasks')}</span>
                </div>
                {project.overdue > 0 && (
                  <div className="stat warning">
                    <AlertTriangle size={14} />
                    <span>{project.overdue} {t('analytics.overdue')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
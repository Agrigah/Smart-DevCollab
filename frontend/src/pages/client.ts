const API_URL = "http://localhost:8080/api";

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${text}`);
  }

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export const auth = {
  login: (email: string, password: string) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (fullName: string, email: string, password: string) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    }),
};

export const projects = {
  all: () => api("/projects"),

  create: (data: any) =>
    api("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    api(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/projects/${id}`, {
      method: "DELETE",
    }),
};

export const tasks = {
  getAll: () => api("/tasks"),

  byProject: (projectId: number) =>
    api(`/tasks/project/${projectId}`),

  create: (data: any) =>
    api("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  status: (id: number, status: string) =>
    api(`/tasks/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  deadline: (id: number, dueAt: string) =>
    api(`/tasks/${id}/deadline`, {
      method: "PUT",
      body: JSON.stringify({ dueAt }),
    }),

  assign: (id: number, userId: number) =>
    api(`/tasks/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify({ userId }),
    }),

  update: (id: number, data: any) =>
    api(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api(`/tasks/${id}`, {
      method: "DELETE",
    }),
};

export const ai = {
  plan: (prompt: string) =>
    api("/ai/plan", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  createTasks: (projectId: number, data: any[]) =>
    api(`/ai/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
export const analytics = {
  summary: () => api("/analytics/summary"),

  workload: () => api("/analytics/workload"),

  progress: () => api("/analytics/progress"),
};
export const notifications = {
  all: () => api("/notifications"),

  count: () => api("/notifications/count"),

  read: (id: number) =>
    api(`/notifications/${id}/read`, {
      method: "PUT",
    }),
};

export const activity = {
  byProject: (projectId: number) =>
    api(`/activity/project/${projectId}`),
};
export const users = {
  all: () => api("/users"),
};

export const messages = {
  byProject: (projectId: number) =>
    api(`/messages/project/${projectId}`),

  send: async (projectId: number, content: string, file?: File | null) => {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("content", content);

    if (file) {
      formData.append("file", file);
    }

    const response = await fetch(`${API_URL}/messages/project/${projectId}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  },

  downloadFile: async (messageId: number) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/messages/${messageId}/file`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};
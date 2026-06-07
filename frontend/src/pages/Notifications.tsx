import { useEffect, useState } from "react";
import { notifications } from "../api/client";

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);

  async function load() {
    const data = await notifications.all();
    setList(data);
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: number) {
    await notifications.read(id);
    load();
  }

  return (
    <div className="page">
      <h1>Notifications</h1>

      <div className="panel">
        {list.length === 0 ? (
          <p className="note">Aucune notification pour le moment.</p>
        ) : (
          <div className="notificationList">
            {list.map((n) => (
              <div
                className={n.read ? "notification read" : "notification unread"}
                key={n.id}
              >
                <div>
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </div>

                {!n.read && (
                  <button
                    className="btn secondary"
                    onClick={() => markAsRead(n.id)}
                  >
                    Marquer comme lue
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { projects, messages } from "../api/client";
import { Send, MessageCircle, Users, FileText, Paperclip } from "lucide-react";

export default function TeamChat() {
  const [projectId, setProjectId] = useState(0);
  const [ps, setPs] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function loadMessages(id: number) {
    if (!id) return;

    const data = await messages.byProject(id);
    setList(data);
  }

  useEffect(() => {
    projects.all().then((data: any[]) => {
      setPs(data);

      if (data.length > 0) {
        setProjectId(data[0].id);
        loadMessages(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;

    loadMessages(projectId);

    const interval = setInterval(() => {
      loadMessages(projectId);
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId]);

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!projectId) {
      alert("Choisis un projet.");
      return;
    }

    if (!content.trim() && !file) {
      alert("Écris un message ou choisis un PDF.");
      return;
    }

    if (file && file.type !== "application/pdf") {
      alert("Seuls les fichiers PDF sont autorisés.");
      return;
    }
    if (file && file.size > 20 * 1024 * 1024) {
  alert("Le fichier PDF ne doit pas dépasser 20 MB.");
  return;
}

    await messages.send(projectId, content, file);

    setContent("");
    setFile(null);
    await loadMessages(projectId);
  }

  async function downloadPdf(messageId: number, filename: string) {
    const url = await messages.downloadFile(messageId);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "document.pdf";
    a.click();

    URL.revokeObjectURL(url);
  }

  const currentProject = ps.find((p) => p.id === projectId);

  return (
    <div className="chatPage">
      <div className="chatHeader">
        <div>
          <h1>
            <MessageCircle size={26} />
            Communication d'équipe
          </h1>

          {currentProject && (
            <p>
              <Users size={16} />
              Projet : {currentProject.title}
            </p>
          )}
        </div>

        <select
          value={projectId}
          onChange={(e) => {
            const id = Number(e.target.value);
            setProjectId(id);
            loadMessages(id);
          }}
        >
          <option value={0}>Choisir un projet</option>

          {ps.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="chatBox">
        {list.length === 0 ? (
          <div className="emptyChat">Aucun message pour ce projet.</div>
        ) : (
          list.map((msg) => (
            <div className="messageItem" key={msg.id}>
              <div className="messageAvatar">
                {msg.sender?.fullName?.charAt(0) || "U"}
              </div>

              <div className="messageContent">
                <div className="messageTop">
                  <strong>{msg.sender?.fullName || "Utilisateur"}</strong>
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>

                {msg.content && <p>{msg.content}</p>}

                {msg.attachmentName && (
                  <button
                    className="pdfMessage"
                    type="button"
                    onClick={() => downloadPdf(msg.id, msg.attachmentName)}
                  >
                    <FileText size={18} />
                    Télécharger PDF : {msg.attachmentName}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form className="chatForm" onSubmit={sendMessage}>
        <input
          placeholder="Écrire un message à l'équipe..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label className="fileBtn">
          <Paperclip size={18} />
          PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            hidden
          />
        </label>

        <button className="btn-primary">
          <Send size={18} />
          Envoyer
        </button>
      </form>

      {file && (
        <div className="selectedFile">
          PDF sélectionné : <strong>{file.name}</strong>
          <button type="button" onClick={() => setFile(null)}>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
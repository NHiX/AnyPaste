import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Clipboard,
  Copy,
  Languages,
  Pause,
  Pin,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { getTranslator } from "./i18n";
import type { AppSnapshot, ClipItem, Language } from "./types";
import "./styles.css";

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
};

const kindLabels = {
  text: "Text",
  url: "URL",
  code: "Code",
};

function preview(content: string) {
  return content.length > 220 ? `${content.slice(0, 220)}...` : content;
}

function App() {
  const [snapshot, setSnapshot] = React.useState<AppSnapshot | null>(null);
  const [query, setQuery] = React.useState("");
  const [activeBoard, setActiveBoard] = React.useState("all");
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    void refresh();
    const unlisten = listen<AppSnapshot>("anypaste://state", (event) => setSnapshot(event.payload));
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  }, []);

  async function refresh() {
    setSnapshot(await invoke<AppSnapshot>("get_snapshot"));
  }

  async function updateLanguage(language: Language) {
    setSnapshot(await invoke<AppSnapshot>("set_language", { language }));
  }

  async function togglePause() {
    setSnapshot(await invoke<AppSnapshot>("toggle_pause"));
  }

  async function clearHistory() {
    setSnapshot(await invoke<AppSnapshot>("clear_history"));
  }

  async function copyClip(id: string) {
    setSnapshot(await invoke<AppSnapshot>("copy_clip", { id }));
  }

  async function deleteClip(id: string) {
    setSnapshot(await invoke<AppSnapshot>("delete_clip", { id }));
  }

  async function togglePin(id: string) {
    setSnapshot(await invoke<AppSnapshot>("toggle_pin", { id }));
  }

  async function moveToBoard(id: string, boardId: string | null) {
    setSnapshot(await invoke<AppSnapshot>("move_to_pinboard", { id, boardId }));
  }

  if (!snapshot) {
    return (
      <main className="boot">
        <Sparkles />
        <span>AnyPaste</span>
      </main>
    );
  }

  const t = getTranslator(snapshot.settings.language);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = snapshot.clips.filter((clip) => {
    const boardMatch =
      activeBoard === "all" ||
      (activeBoard === "pinned" && clip.pinned) ||
      clip.pinboard === activeBoard;
    const queryMatch = !normalizedQuery || clip.content.toLowerCase().includes(normalizedQuery);
    return boardMatch && queryMatch;
  });

  return (
    <main className="shell">
      <section className="panel">
        <header className="topbar">
          <div className="brand">
            <div className="brandMark">
              <Clipboard size={22} />
            </div>
            <div>
              <h1>AnyPaste</h1>
              <p>{snapshot.paused ? t("paused") : `${snapshot.clips.length} ${t("captured")}`}</p>
            </div>
          </div>
          <div className="windowActions">
            <button className="iconButton" onClick={togglePause} title={snapshot.paused ? t("resume") : t("pause")}>
              {snapshot.paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button className="iconButton" onClick={() => setSettingsOpen(true)} title={t("settings")}>
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="searchRow">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} />
        </div>

        <nav className="boardRail" aria-label={t("boards")}>
          <button className={activeBoard === "all" ? "active" : ""} onClick={() => setActiveBoard("all")}>
            {t("all")}
          </button>
          <button className={activeBoard === "pinned" ? "active" : ""} onClick={() => setActiveBoard("pinned")}>
            <Pin size={14} />
            {t("pinned")}
          </button>
          {snapshot.pinboards.map((board) => (
            <button
              key={board.id}
              className={activeBoard === board.id ? "active" : ""}
              onClick={() => setActiveBoard(board.id)}
            >
              <span className="swatch" style={{ background: board.color }} />
              {board.name}
            </button>
          ))}
        </nav>

        <section className="clipList" aria-label={t("history")}>
          {filtered.length === 0 ? (
            <div className="empty">
              <Clipboard size={34} />
              <h2>{snapshot.clips.length ? t("noResults") : t("emptyTitle")}</h2>
              <p>{t("emptyBody")}</p>
            </div>
          ) : (
            filtered.map((clip, index) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                index={index}
                t={t}
                boards={snapshot.pinboards}
                onCopy={copyClip}
                onDelete={deleteClip}
                onTogglePin={togglePin}
                onMoveToBoard={moveToBoard}
              />
            ))
          )}
        </section>

        <footer className="statusbar">
          <span>
            <ShieldCheck size={15} />
            {t("privacy")}
          </span>
          <span>{snapshot.settings.hotkey}</span>
        </footer>
      </section>

      {settingsOpen && (
        <aside className="settingsPane">
          <div className="settingsHeader">
            <h2>{t("settings")}</h2>
            <button className="iconButton" onClick={() => setSettingsOpen(false)} title="Close">
              <X size={18} />
            </button>
          </div>
          <label className="field">
            <span>
              <Languages size={16} />
              {t("language")}
            </span>
            <select
              value={snapshot.settings.language}
              onChange={(event) => void updateLanguage(event.target.value as Language)}
            >
              {(Object.keys(languageNames) as Language[]).map((language) => (
                <option key={language} value={language}>
                  {languageNames[language]}
                </option>
              ))}
            </select>
          </label>
          <div className="settingGrid">
            <div>
              <strong>{t("maxHistory")}</strong>
              <span>{snapshot.settings.max_history}</span>
            </div>
            <div>
              <strong>{t("hotkey")}</strong>
              <span>{snapshot.settings.hotkey}</span>
            </div>
            <div>
              <strong>{t("launchAtLogin")}</strong>
              <span>{snapshot.settings.launch_at_login ? "On" : "Off"}</span>
            </div>
          </div>
          <button className="dangerButton" onClick={clearHistory}>
            <Trash2 size={16} />
            {t("clear")}
          </button>
        </aside>
      )}
    </main>
  );
}

function ClipCard({
  clip,
  index,
  t,
  boards,
  onCopy,
  onDelete,
  onTogglePin,
  onMoveToBoard,
}: {
  clip: ClipItem;
  index: number;
  t: (key: string) => string;
  boards: AppSnapshot["pinboards"];
  onCopy: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  onMoveToBoard: (id: string, boardId: string | null) => Promise<void>;
}) {
  const created = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(clip.created_at));

  return (
    <article className="clipCard">
      <button className="quickIndex" onClick={() => void onCopy(clip.id)} title={t("quickPaste")}>
        {index < 9 ? index + 1 : <Copy size={14} />}
      </button>
      <div className="clipBody" onDoubleClick={() => void onCopy(clip.id)}>
        <div className="clipMeta">
          <span>{kindLabels[clip.kind]}</span>
          <span>{created}</span>
        </div>
        <p>{preview(clip.content)}</p>
      </div>
      <div className="clipTools">
        <button
          className={clip.pinned ? "tool activeTool" : "tool"}
          onClick={() => void onTogglePin(clip.id)}
          title={clip.pinned ? t("unpin") : t("pin")}
        >
          <Pin size={15} />
        </button>
        <select value={clip.pinboard ?? ""} onChange={(event) => void onMoveToBoard(clip.id, event.target.value || null)}>
          <option value="">-</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        <button className="tool" onClick={() => void onCopy(clip.id)} title={t("copy")}>
          <Copy size={15} />
        </button>
        <button className="tool" onClick={() => void onDelete(clip.id)} title={t("delete")}>
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

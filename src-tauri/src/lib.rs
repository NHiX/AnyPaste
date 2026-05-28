use arboard::Clipboard;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
enum ClipKind {
    Text,
    Url,
    Code,
}

#[derive(Clone, Serialize, Deserialize)]
struct ClipItem {
    id: String,
    content: String,
    kind: ClipKind,
    source_app: Option<String>,
    created_at: DateTime<Utc>,
    pinned: bool,
    pinboard: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
struct Pinboard {
    id: String,
    name: String,
    color: String,
}

#[derive(Clone, Serialize, Deserialize)]
struct Settings {
    language: String,
    max_history: usize,
    hotkey: String,
    launch_at_login: bool,
}

#[derive(Clone, Serialize, Deserialize)]
struct PersistedState {
    clips: Vec<ClipItem>,
    pinboards: Vec<Pinboard>,
    paused: bool,
    settings: Settings,
}

struct Store {
    path: PathBuf,
    state: PersistedState,
}

type SharedStore = Arc<Mutex<Store>>;

impl Default for PersistedState {
    fn default() -> Self {
        Self {
            clips: Vec::new(),
            pinboards: vec![
                Pinboard {
                    id: "work".to_string(),
                    name: "Work".to_string(),
                    color: "#9fe0c7".to_string(),
                },
                Pinboard {
                    id: "code".to_string(),
                    name: "Code".to_string(),
                    color: "#8fb8ff".to_string(),
                },
                Pinboard {
                    id: "ideas".to_string(),
                    name: "Ideas".to_string(),
                    color: "#f6c35f".to_string(),
                },
            ],
            paused: false,
            settings: Settings {
                language: "fr".to_string(),
                max_history: 500,
                hotkey: "Ctrl+Shift+V".to_string(),
                launch_at_login: false,
            },
        }
    }
}

impl Store {
    fn load() -> Self {
        let path = data_path();
        let state = fs::read_to_string(&path)
            .ok()
            .and_then(|raw| serde_json::from_str::<PersistedState>(&raw).ok())
            .unwrap_or_default();
        Self { path, state }
    }

    fn save(&self) {
        if let Some(parent) = self.path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(&self.state) {
            let _ = fs::write(&self.path, json);
        }
    }
}

fn data_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join("AnyPaste")
        .join("history.json")
}

fn classify(content: &str) -> ClipKind {
    let trimmed = content.trim();
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        ClipKind::Url
    } else if trimmed.contains("function ")
        || trimmed.contains("const ")
        || trimmed.contains("=>")
        || trimmed.contains("class ")
        || trimmed.contains("package ")
        || trimmed.contains("import ")
    {
        ClipKind::Code
    } else {
        ClipKind::Text
    }
}

fn snapshot(store: &SharedStore) -> PersistedState {
    store.lock().expect("store lock").state.clone()
}

fn emit_snapshot(app: &AppHandle, store: &SharedStore) {
    let _ = app.emit("anypaste://state", snapshot(store));
}

fn insert_clip(store: &SharedStore, content: String) -> bool {
    let normalized = content.trim();
    if normalized.is_empty() {
        return false;
    }

    let mut guard = store.lock().expect("store lock");
    if guard
        .state
        .clips
        .first()
        .map(|clip| clip.content.as_str() == normalized)
        .unwrap_or(false)
    {
        return false;
    }

    guard.state.clips.retain(|clip| clip.content != normalized);
    guard.state.clips.insert(
        0,
        ClipItem {
            id: Uuid::new_v4().to_string(),
            content: normalized.to_string(),
            kind: classify(normalized),
            source_app: None,
            created_at: Utc::now(),
            pinned: false,
            pinboard: None,
        },
    );

    let max_history = guard.state.settings.max_history;
    let mut kept = 0usize;
    guard.state.clips.retain(|clip| {
        if clip.pinned {
            true
        } else {
            kept += 1;
            kept <= max_history
        }
    });
    guard.save();
    true
}

fn start_clipboard_monitor(app: AppHandle, store: SharedStore) {
    thread::spawn(move || {
        let mut clipboard = match Clipboard::new() {
            Ok(clipboard) => clipboard,
            Err(_) => return,
        };
        let mut last_seen = String::new();

        loop {
            thread::sleep(Duration::from_millis(800));
            if store.lock().expect("store lock").state.paused {
                continue;
            }
            let Ok(text) = clipboard.get_text() else {
                continue;
            };
            if text == last_seen {
                continue;
            }
            last_seen = text.clone();
            if insert_clip(&store, text) {
                emit_snapshot(&app, &store);
            }
        }
    });
}

fn show_or_hide_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(true) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

fn register_shortcut(app: &AppHandle) {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyV);
    let app_handle = app.clone();
    let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            show_or_hide_main(&app_handle);
        }
    });
}

#[tauri::command]
fn get_snapshot(store: State<'_, SharedStore>) -> PersistedState {
    snapshot(&store)
}

#[tauri::command]
fn toggle_pause(app: AppHandle, store: State<'_, SharedStore>) -> PersistedState {
    {
        let mut guard = store.lock().expect("store lock");
        guard.state.paused = !guard.state.paused;
        guard.save();
    }
    emit_snapshot(&app, &store);
    snapshot(&store)
}

#[tauri::command]
fn clear_history(app: AppHandle, store: State<'_, SharedStore>) -> PersistedState {
    {
        let mut guard = store.lock().expect("store lock");
        guard.state.clips.retain(|clip| clip.pinned);
        guard.save();
    }
    emit_snapshot(&app, &store);
    snapshot(&store)
}

#[tauri::command]
fn copy_clip(app: AppHandle, store: State<'_, SharedStore>, id: String) -> PersistedState {
    let content = store
        .lock()
        .expect("store lock")
        .state
        .clips
        .iter()
        .find(|clip| clip.id == id)
        .map(|clip| clip.content.clone());

    if let Some(content) = content {
        if let Ok(mut clipboard) = Clipboard::new() {
            let _ = clipboard.set_text(content);
        }
    }

    emit_snapshot(&app, &store);
    snapshot(&store)
}

#[tauri::command]
fn delete_clip(app: AppHandle, store: State<'_, SharedStore>, id: String) -> PersistedState {
    {
        let mut guard = store.lock().expect("store lock");
        guard.state.clips.retain(|clip| clip.id != id);
        guard.save();
    }
    emit_snapshot(&app, &store);
    snapshot(&store)
}

#[tauri::command]
fn toggle_pin(app: AppHandle, store: State<'_, SharedStore>, id: String) -> PersistedState {
    {
        let mut guard = store.lock().expect("store lock");
        if let Some(clip) = guard.state.clips.iter_mut().find(|clip| clip.id == id) {
            clip.pinned = !clip.pinned;
        }
        guard.save();
    }
    emit_snapshot(&app, &store);
    snapshot(&store)
}

#[tauri::command]
fn move_to_pinboard(
    app: AppHandle,
    store: State<'_, SharedStore>,
    id: String,
    board_id: Option<String>,
) -> PersistedState {
    {
        let mut guard = store.lock().expect("store lock");
        if let Some(clip) = guard.state.clips.iter_mut().find(|clip| clip.id == id) {
            clip.pinboard = board_id;
            clip.pinned = clip.pinboard.is_some() || clip.pinned;
        }
        guard.save();
    }
    emit_snapshot(&app, &store);
    snapshot(&store)
}

#[tauri::command]
fn set_language(app: AppHandle, store: State<'_, SharedStore>, language: String) -> PersistedState {
    {
        let mut guard = store.lock().expect("store lock");
        if ["en", "fr", "es", "de"].contains(&language.as_str()) {
            guard.state.settings.language = language;
            guard.save();
        }
    }
    emit_snapshot(&app, &store);
    snapshot(&store)
}

pub fn run() {
    let store: SharedStore = Arc::new(Mutex::new(Store::load()));

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(store.clone())
        .invoke_handler(tauri::generate_handler![
            get_snapshot,
            toggle_pause,
            clear_history,
            copy_clip,
            delete_clip,
            toggle_pin,
            move_to_pinboard,
            set_language
        ])
        .setup(move |app| {
            register_shortcut(app.handle());
            start_clipboard_monitor(app.handle().clone(), store.clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running AnyPaste");
}

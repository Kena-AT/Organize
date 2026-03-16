use tauri::{AppHandle, Emitter, Manager};
use crate::scanner::{Scanner, Rule, PreviewOperation};
use crate::error::{AppError, AppResult};
use rusqlite::Connection;
use uuid::Uuid;
use serde::Serialize;
use std::path::Path;
use std::collections::HashMap;

#[derive(Clone, Serialize)]
struct ProgressPayload {
    current: usize,
    total: usize,
    filename: String,
    status: String,
}

#[tauri::command]
pub fn ping() -> String {
    "pong".to_string()
}

#[tauri::command]
pub async fn get_preview(app: AppHandle, folder_path: String, destination_path: String, rules: Vec<Rule>) -> Result<Vec<PreviewOperation>, AppError> {
    if !is_safe_path(&folder_path) || !is_safe_path(&destination_path) {
        return Err(AppError::Path("Security violation: Restricted or invalid path.".to_string()));
    }

    let mut protected_folders: Vec<String> = Vec::new();
    
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'protected_folders'")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        let value: String = row.get(0)?;
        if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&value) {
            protected_folders = parsed;
        }
    }

    Ok(Scanner::scan_folder(&folder_path, &destination_path, rules, protected_folders))
}

#[derive(Clone, Serialize)]
pub struct RunRecord {
    pub id: String,
    pub timestamp: String,
    pub total_files: usize,
    pub success_count: usize,
    pub error_count: usize,
    pub source_folder: String,
    pub destination_folder: String,
}

#[tauri::command]
pub async fn run_organization(
    app: AppHandle, 
    operations: Vec<PreviewOperation>,
    source_folder: String,
    destination_folder: String
) -> Result<Vec<PreviewOperation>, AppError> {
    if !is_safe_path(&source_folder) || !is_safe_path(&destination_folder) {
        return Err(AppError::Path("Security violation: Restricted or invalid path.".to_string()));
    }
    
    // Max file operation limit per run (Security Hardening)
    if operations.len() > 100_000 {
        return Err(AppError::Generic("Security violation: Exceeded maximum allowed operations (100,000) per run.".to_string()));
    }
    let run_id = Uuid::new_v4().to_string();
    let app_handle = app.clone();
    
    // Execute operations with progress reporting
    let results = Scanner::execute_operations(operations, move |current, total, filename, status| {
        let _ = app_handle.emit("run-progress", ProgressPayload {
            current,
            total,
            filename,
            status,
        });
    });

    let success_count = results.iter().filter(|op| op.status == "success").count();
    let error_count = results.iter().filter(|op| op.status == "error").count();

    // Logging to history and runs table
    if let Ok(data_dir) = app.path().app_data_dir() {
        let db_path = data_dir.join("organize.db");
        
        if let Ok(conn) = Connection::open(db_path) {
            // Log the Run
            let _ = conn.execute(
                "INSERT INTO runs (id, total_files, success_count, error_count, source_folder, destination_folder) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                (
                    &run_id,
                    results.len(),
                    success_count,
                    error_count,
                    &source_folder,
                    &destination_folder,
                ),
            );

            // Log individual operations
            for op in &results {
                let _ = conn.execute(
                    "INSERT INTO history (id, run_id, source_path, target_path, action, rule_name, status) 
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    (
                        Uuid::new_v4().to_string(),
                        &run_id,
                        &op.original_path,
                        &op.suggested_target,
                        &op.suggested_action,
                        &op.rule_name,
                        &op.status,
                    ),
                );
            }
        }
    }

    // Emit completion event
    let _ = app.emit("run-complete", run_id);

    Ok(results)
}

#[tauri::command]
pub async fn get_history(app: AppHandle) -> Result<Vec<RunRecord>, AppError> {
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    let conn = Connection::open(db_path)?;
    
    let mut stmt = conn.prepare(
        "SELECT id, timestamp, total_files, success_count, error_count, source_folder, destination_folder 
         FROM runs ORDER BY timestamp DESC LIMIT 50"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok(RunRecord {
            id: row.get(0)?,
            timestamp: row.get(1)?,
            total_files: row.get(2)?,
            success_count: row.get(3)?,
            error_count: row.get(4)?,
            source_folder: row.get(5)?,
            destination_folder: row.get(6)?,
        })
    })?;

    let mut history = Vec::new();
    for row in rows {
        if let Ok(record) = row {
            history.push(record);
        }
    }
    Ok(history)
}

#[tauri::command]
pub async fn get_run_operations(app: AppHandle, run_id: String) -> Result<Vec<PreviewOperation>, AppError> {
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    let conn = Connection::open(db_path)?;
    
    let mut stmt = conn.prepare(
        "SELECT rule_name, source_path, target_path, action, status 
         FROM history WHERE run_id = ?1"
    )?;
    
    let rows = stmt.query_map([run_id], |row| {
        let source_path: String = row.get(1)?;
        let original_name = Path::new(&source_path)
            .file_name()
            .map(|n: &std::ffi::OsStr| n.to_string_lossy().to_string())
            .unwrap_or_default();

        Ok(PreviewOperation {
            rule_name: row.get(0)?,
            original_path: source_path,
            original_name,
            suggested_action: row.get(3)?,
            suggested_target: row.get(2)?,
            conflict_strategy: "unknown".to_string(), // Not stored in history currently
            status: row.get(4)?,
            error_message: None, 
        })
    })?;

    let mut ops = Vec::new();
    for row in rows {
        if let Ok(op) = row {
            ops.push(op);
        }
    }
    Ok(ops)
}

#[derive(Clone, Serialize)]
pub struct UndoResult {
    pub success: bool,
    pub original_path: String,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn undo_run(app: AppHandle, run_id: String) -> Result<Vec<UndoResult>, AppError> {
    let mut results = Vec::new();
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    let conn = Connection::open(db_path)?;
    
    // Fetch successful operations for this run
    let mut stmt = conn.prepare(
        "SELECT id, source_path, target_path, action, status 
         FROM history WHERE run_id = ?1 AND (status = 'success' OR status = 'executed')"
    )?;
                
                struct HistoryRecord {
                    id: String,
                    source_path: String,
                    target_path: String,
                    action: String,
                }

                let rows = stmt.query_map([&run_id], |row| {
                    Ok(HistoryRecord {
                        id: row.get(0)?,
                        source_path: row.get(1)?,
                        target_path: row.get(2)?,
                        action: row.get(3)?,
                    })
                })?;

                let records: Vec<HistoryRecord> = rows.filter_map(|r| r.ok()).collect();
                let total = records.len();

                for (i, record) in records.into_iter().enumerate() {
                    let source = Path::new(&record.source_path);
                    let target = Path::new(&record.target_path);

                    let original_name = source
                        .file_name()
                        .map(|n: &std::ffi::OsStr| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let mut undo_success = false;
                    let mut error_msg = None;

                    // Ensure the original parent directory exists
                    if let Some(parent) = source.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }

                    if !target.exists() {
                        error_msg = Some("Target file no longer exists".to_string());
                    } else if source.exists() {
                        error_msg = Some("Original file path is blocked by another file".to_string());
                    } else {
                        // Reverse the action
                        let res = match record.action.as_str() {
                            "move" => std::fs::rename(target, source).map(|_| ()),
                            "copy" => std::fs::remove_file(target).map(|_| ()),
                            "delete" => Err(std::io::Error::new(std::io::ErrorKind::Other, "Cannot undo delete without recycle bin")),
                            _ => Ok(()),
                        };

                        match res {
                            Ok(_) => {
                                undo_success = true;
                                // Update status to undone
                                let _ = conn.execute(
                                    "UPDATE history SET status = 'undone' WHERE id = ?1",
                                    [&record.id],
                                );
                            },
                            Err(e) => {
                                error_msg = Some(e.to_string());
                            }
                        }
                    }

                    let status_str = if undo_success { "success" } else { "error" };
                    
                    let _ = app.emit("run-progress", ProgressPayload {
                        current: i + 1,
                        total,
                        filename: format!("Undoing {}", original_name),
                        status: status_str.to_string(),
                    });

                    results.push(UndoResult {
                        success: undo_success,
                        original_path: record.source_path,
                        message: error_msg,
                    });
                }
                
                Ok(results)
}

#[tauri::command]
pub async fn get_setting(app: AppHandle, key: String) -> Result<Option<String>, AppError> {
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    let conn = Connection::open(db_path)?;
    
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query([key])?;
    
    if let Some(row) = rows.next()? {
        let value: String = row.get(0)?;
        Ok(Some(value))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn set_setting(app: AppHandle, key: String, value: String) -> Result<(), AppError> {
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    let conn = Connection::open(db_path)?;
    
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) 
         ON CONFLICT(key) DO UPDATE SET value = ?2",
        [&key, &value]
    )?;
    Ok(())
}

#[tauri::command]
pub async fn get_all_settings(app: AppHandle) -> Result<HashMap<String, String>, AppError> {
    let data_dir = app.path().app_data_dir()?;
    let db_path = data_dir.join("organize.db");
    let conn = Connection::open(db_path)?;
    
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?;
    
    let mut settings = HashMap::new();
    for row in rows {
        if let Ok((k, v)) = row {
            settings.insert(k, v);
        }
    }
    Ok(settings)
}

fn is_safe_path(path_str: &str) -> bool {
    let path = Path::new(path_str);
    
    // Must be absolute
    if !path.is_absolute() {
        return false;
    }
    
    // Prevent obvious path traversal components from strings
    if path_str.contains("..") {
        return false;
    }

    let lower_path = path_str.to_lowercase();
    
    // Restrict system directories
    let restricted_prefixes = [
        "c:\\windows",
        "c:\\program files",
        "c:\\program files (x86)",
        "\\appdata", // Catch variations like roaming/local
    ];

    for restricted in restricted_prefixes {
        if lower_path.contains(restricted) {
            return false;
        }
    }

    true
}

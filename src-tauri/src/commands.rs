use tauri::{AppHandle, Emitter, Manager};
use crate::scanner::{Scanner, Rule, PreviewOperation};
use rusqlite::Connection;
use uuid::Uuid;
use serde::Serialize;

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
pub async fn get_preview(folder_path: String, destination_path: String, rules: Vec<Rule>) -> Result<Vec<PreviewOperation>, String> {
    Ok(Scanner::scan_folder(&folder_path, &destination_path, rules))
}

#[tauri::command]
pub async fn run_organization(app: AppHandle, operations: Vec<PreviewOperation>) -> Result<Vec<PreviewOperation>, String> {
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

    // Logging to history table
    // Note: tauri-plugin-sql usually puts its DBs in the app data directory
    if let Ok(data_dir) = app.path().app_data_dir() {
        let db_path = data_dir.join("organize.db");
        
        if let Ok(conn) = Connection::open(db_path) {
            for op in &results {
                if op.status == "success" {
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
                            "executed",
                        ),
                    );
                }
            }
        }
    }

    // Emit completion event
    let _ = app.emit("run-complete", run_id);

    Ok(results)
}

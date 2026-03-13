mod commands;
mod scanner;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create settings table",
            sql: "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create rules table",
            sql: "CREATE TABLE IF NOT EXISTS rules (
                id TEXT PRIMARY KEY,
                name TEXT,
                condition_type TEXT,
                condition_value TEXT,
                action_type TEXT,
                action_target TEXT,
                status TEXT DEFAULT 'active',
                priority INTEGER
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create history table",
            sql: "CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                run_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                source_path TEXT,
                target_path TEXT,
                action TEXT,
                rule_name TEXT,
                status TEXT
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create runs table",
            sql: "CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_files INTEGER,
                success_count INTEGER,
                error_count INTEGER,
                source_folder TEXT,
                destination_folder TEXT
            );",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:organize.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::get_preview,
            commands::run_organization,
            commands::get_history,
            commands::get_run_operations
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

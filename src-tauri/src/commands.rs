use crate::scanner::{Scanner, Rule, PreviewOperation};

#[tauri::command]
pub fn ping() -> String {
    "pong".to_string()
}

#[tauri::command]
pub async fn get_preview(folder_path: String, destination_path: String, rules: Vec<Rule>) -> Result<Vec<PreviewOperation>, String> {
    Ok(Scanner::scan_folder(&folder_path, &destination_path, rules))
}

#[tauri::command]
pub async fn run_organization(operations: Vec<PreviewOperation>) -> Result<Vec<PreviewOperation>, String> {
    Ok(Scanner::execute_operations(operations))
}

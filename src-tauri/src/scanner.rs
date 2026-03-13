use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Rule {
    pub id: String,
    pub name: String,
    pub condition_type: String,
    pub condition_value: String,
    pub action_type: String,
    pub action_target: String,
    pub status: String,
    pub priority: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PreviewOperation {
    pub rule_name: String,
    pub original_path: String,
    pub original_name: String,
    pub suggested_action: String,
    pub suggested_target: String,
    pub status: String, // "pending", "success", "error", "skipped"
}

pub struct Scanner;

impl Scanner {
    pub fn scan_folder(path: &str, base_destination: &str, rules: Vec<Rule>) -> Vec<PreviewOperation> {
        let mut operations = Vec::new();
        let source_path = Path::new(path);

        if !source_path.exists() || !source_path.is_dir() {
            return operations;
        }

        // Filter active rules and sort by priority
        let active_rules: Vec<Rule> = rules
            .into_iter()
            .filter(|r| r.status == "active")
            .collect();

        for entry in WalkDir::new(source_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let file_path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            let mut matched = false;
            for rule in &active_rules {
                if Scanner::matches_rule(file_path, &file_name, rule) {
                    operations.push(PreviewOperation {
                        rule_name: rule.name.clone(),
                        original_path: file_path.to_string_lossy().to_string(),
                        original_name: file_name.clone(),
                        suggested_action: rule.action_type.clone(),
                        suggested_target: Scanner::resolve_target_path(file_path, base_destination, rule),
                        status: "pending".to_string(),
                    });
                    matched = true;
                    break;
                }
            }

            if !matched {
                operations.push(PreviewOperation {
                    rule_name: "Default".to_string(),
                    original_path: file_path.to_string_lossy().to_string(),
                    original_name: file_name.clone(),
                    suggested_action: "skip".to_string(),
                    suggested_target: "".to_string(),
                    status: "skipped".to_string(),
                });
            }
        }

        operations
    }

    pub fn execute_operations(operations: Vec<PreviewOperation>) -> Vec<PreviewOperation> {
        let mut results = Vec::new();
        for mut op in operations {
            if op.suggested_action == "skip" {
                op.status = "skipped".to_string();
                results.push(op);
                continue;
            }

            let source = Path::new(&op.original_path);
            let target_str = op.suggested_target.clone();
            let target = Path::new(&target_str);

            let res = match op.suggested_action.as_str() {
                "move" => {
                    if let Some(parent) = target.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    std::fs::rename(source, target)
                },
                "copy" => {
                    if let Some(parent) = target.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    std::fs::copy(source, target).map(|_| ())
                },
                "delete" => {
                    std::fs::remove_file(source)
                },
                _ => Ok(()),
            };

            match res {
                Ok(_) => op.status = "success".to_string(),
                Err(e) => {
                    op.status = format!("error: {}", e);
                }
            }
            results.push(op);
        }
        results
    }

    fn matches_rule(path: &Path, name: &str, rule: &Rule) -> bool {
        match rule.condition_type.as_str() {
            "extension" => {
                let ext = path.extension()
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                
                // Handle multiple extensions separated by comma
                let allowed_extensions: Vec<&str> = rule.condition_value
                    .split(',')
                    .map(|s| s.trim().trim_start_matches('.'))
                    .collect();
                
                allowed_extensions.iter().any(|&e| e.to_lowercase() == ext)
            },
            "name_contains" => {
                let search_terms: Vec<&str> = rule.condition_value
                    .split(',')
                    .map(|s| s.trim())
                    .collect();
                
                search_terms.iter().any(|&term| name.to_lowercase().contains(&term.to_lowercase()))
            },
            "size_gt" => {
                if let Ok(metadata) = std::fs::metadata(path) {
                    let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);
                    if let Ok(threshold) = rule.condition_value.parse::<f64>() {
                        return size_mb > threshold;
                    }
                }
                false
            },
            _ => false,
        }
    }

    fn resolve_target_path(original_path: &Path, base_destination: &str, rule: &Rule) -> String {
        if rule.action_type == "delete" {
            return "Trash/Permanent Delete".to_string();
        }

        // Start with the user's selected base destination
        let mut target = PathBuf::from(base_destination);
        
        // Append the rule's specific target directory
        if !rule.action_target.is_empty() {
            target.push(&rule.action_target);
        }
        
        // Final filename
        if let Some(file_name) = original_path.file_name() {
            target.push(file_name);
        }
        target.to_string_lossy().to_string()
    }
}

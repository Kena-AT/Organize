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
    pub conflict_strategy: String, // "skip", "rename", "replace"
    pub status: String, // "pending", "success", "error", "skipped"
    pub error_message: Option<String>,
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
                        conflict_strategy: "skip".to_string(),
                        status: "pending".to_string(),
                        error_message: None,
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
                    conflict_strategy: "skip".to_string(),
                    status: "skipped".to_string(),
                    error_message: None,
                });
            }
        }

        operations
    }

    pub fn execute_operations<F>(operations: Vec<PreviewOperation>, mut progress_callback: F) -> Vec<PreviewOperation> 
    where F: FnMut(usize, usize, String, String) {
        let mut results = Vec::new();
        let total = operations.len();
        
        for (i, mut op) in operations.into_iter().enumerate() {
            if op.suggested_action == "skip" {
                op.status = "skipped".to_string();
                results.push(op.clone());
                progress_callback(i + 1, total, op.original_name.clone(), "skipped".to_string());
                continue;
            }

            let source = Path::new(&op.original_path);
            let mut target_path = PathBuf::from(&op.suggested_target);

            // Conflict Resolution
            if target_path.exists() {
                match op.conflict_strategy.as_str() {
                    "skip" => {
                        op.status = "skipped".to_string();
                        op.error_message = Some("Target already exists (skipped)".to_string());
                        results.push(op.clone());
                        progress_callback(i + 1, total, op.original_name.clone(), "skipped".to_string());
                        continue;
                    },
                    "rename" => {
                        let mut counter = 1;
                        let stem = target_path.file_stem().unwrap().to_string_lossy().to_string();
                        let ext = target_path.extension().map(|e| e.to_string_lossy().to_string()).unwrap_or_default();
                        
                        while target_path.exists() {
                            let new_name = if ext.is_empty() {
                                format!("{}_{}", stem, counter)
                            } else {
                                format!("{}_{}.{}", stem, counter, ext)
                            };
                            target_path.set_file_name(new_name);
                            counter += 1;
                        }
                        op.suggested_target = target_path.to_string_lossy().to_string();
                    },
                    "replace" => {
                        // std::fs::remove_file is covered by std::fs::rename on most systems, 
                        // but explicit is clearer or needed for copy.
                        if let Ok(metadata) = std::fs::metadata(&target_path) {
                            if metadata.is_dir() {
                                op.status = "error".to_string();
                                op.error_message = Some("Target is a directory".to_string());
                                results.push(op.clone());
                                progress_callback(i + 1, total, op.original_name.clone(), "error".to_string());
                                continue;
                            }
                        }
                    },
                    _ => {}
                }
            }

            if let Some(parent) = target_path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }

            let res = match op.suggested_action.as_str() {
                "move" => std::fs::rename(source, &target_path),
                "copy" => std::fs::copy(source, &target_path).map(|_| ()),
                "delete" => std::fs::remove_file(source),
                _ => Ok(()),
            };

            match res {
                Ok(_) => {
                    op.status = "success".to_string();
                    progress_callback(i + 1, total, op.original_name.clone(), "success".to_string());
                },
                Err(e) => {
                    op.status = "error".to_string();
                    op.error_message = Some(e.to_string());
                    progress_callback(i + 1, total, op.original_name.clone(), "error".to_string());
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
        
        // Append the rule's specific target directory (ensure it's treated as relative)
        if !rule.action_target.is_empty() {
            let relative_target = rule.action_target.trim_start_matches(|c| c == '/' || c == '\\');
            target.push(relative_target);
        }
        
        // Final filename
        if let Some(file_name) = original_path.file_name() {
            target.push(file_name);
        }
        target.to_string_lossy().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_resolve_target_path_nesting() {
        let original = Path::new("C:\\Users\\hp\\Documents\\Bunch of\\PDFs\\file.pdf");
        let base_dest = "C:\\Users\\hp\\Documents\\Bunch of\\PDFs";
        let rule = Rule {
            id: "1".to_string(),
            name: "Organize PDFs".to_string(),
            condition_type: "extension".to_string(),
            condition_value: "pdf".to_string(),
            action_type: "move".to_string(),
            action_target: "\\PDFs".to_string(),
            status: "active".to_string(),
            priority: 1,
        };

        let result = Scanner::resolve_target_path(original, base_dest, &rule);
        
        // On Windows, PathBuf uses backslashes. 
        // We'll normalize to compare or just check the tail components.
        let result_path = Path::new(&result);
        assert!(result_path.ends_with("PDFs\\file.pdf"));
        
        // Full check (ignoring drive letter case differences if any)
        assert!(result.contains("Bunch of\\PDFs\\PDFs\\file.pdf"));
    }

    #[test]
    fn test_resolve_target_path_absolute_fallback() {
        let original = Path::new("C:\\test\\file.txt");
        let base_dest = "C:\\dest";
        let rule = Rule {
            id: "2".to_string(),
            name: "Test".to_string(),
            condition_type: "extension".to_string(),
            condition_value: "txt".to_string(),
            action_type: "move".to_string(),
            action_target: "/sub/folder".to_string(),
            status: "active".to_string(),
            priority: 1,
        };

        let result = Scanner::resolve_target_path(original, base_dest, &rule);
        let result_path = Path::new(&result);
        
        // Check components to be platform independent
        let components: Vec<_> = result_path.components().map(|c| c.as_os_str().to_string_lossy()).collect();
        assert!(components.contains(&"dest".into()));
        assert!(components.contains(&"sub".into()));
        assert!(components.contains(&"folder".into()));
        assert!(components.contains(&"file.txt".into()));
    }
}

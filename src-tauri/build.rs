use std::{fs, path::Path};

fn watch_tree(path: &Path) {
    println!("cargo:rerun-if-changed={}", path.display());
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let child = entry.path();
            if child.is_dir() {
                watch_tree(&child);
            } else {
                println!("cargo:rerun-if-changed={}", child.display());
            }
        }
    }
}

fn main() {
    watch_tree(Path::new("../web"));
    println!("cargo:rerun-if-changed=tauri.conf.json");
    tauri_build::build()
}

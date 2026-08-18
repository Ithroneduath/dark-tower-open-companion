use tauri::Manager;

#[tauri::command]
async fn show_shared_display(app: tauri::AppHandle) -> Result<(), String> {
    let window = if let Some(existing) = app.get_webview_window("shared-display") {
        existing
    } else {
        let config = app
            .config()
            .app
            .windows
            .iter()
            .find(|window| window.label == "shared-display")
            .cloned()
            .ok_or_else(|| "Shared display configuration is missing.".to_string())?;

        tauri::WebviewWindowBuilder::from_config(&app, &config)
            .map_err(|error| format!("Could not prepare the Shared Tower window: {error}"))?
            .build()
            .map_err(|error| format!("Could not create the Shared Tower window: {error}"))?
    };

    window
        .show()
        .map_err(|error| format!("Could not show the Shared Tower window: {error}"))?;
    let _ = window.unminimize();
    window
        .set_focus()
        .map_err(|error| format!("Could not focus the Shared Tower window: {error}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![show_shared_display])
        .run(tauri::generate_context!())
        .expect("error while running Dark Tower: Open Companion");
}

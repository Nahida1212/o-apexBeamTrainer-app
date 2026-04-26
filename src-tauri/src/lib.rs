mod gamepad;
mod mouse;

use gamepad::xinput::GamepadManager;
use mouse::listener::MouseListenerManager;
use std::sync::Mutex;

// 全局手柄管理器
static GAMEPAD_MANAGER: Mutex<Option<GamepadManager>> = Mutex::new(None);

// 全局鼠标监听管理器
static MOUSE_LISTENER_MANAGER: Mutex<Option<MouseListenerManager>> = Mutex::new(None);

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 初始化手柄管理器并启动监听
#[tauri::command]
fn init_gamepad() -> String {
    let mut manager_guard = GAMEPAD_MANAGER.lock().unwrap();

    if manager_guard.is_none() {
        let manager = GamepadManager::new();
        manager.start_polling(8); // 每 8ms 轮询一次，约 125Hz
        *manager_guard = Some(manager);
        "Gamepad initialized and polling started".to_string()
    } else {
        "Gamepad already initialized".to_string()
    }
}

/// 停止手柄监听
#[tauri::command]
fn stop_gamepad_polling() -> String {
    let manager_guard = GAMEPAD_MANAGER.lock().unwrap();

    if let Some(manager) = manager_guard.as_ref() {
        manager.stop_polling();
        "Gamepad polling stopped".to_string()
    } else {
        "Gamepad not initialized".to_string()
    }
}

/// 获取手柄状态（包含鼠标模拟）
#[tauri::command]
fn get_gamepad_state(user_index: u32) -> Option<gamepad::xinput::ControllerState> {
    let manager_guard = GAMEPAD_MANAGER.lock().unwrap();
    // 不直接 ? 返回，先尝试获取手柄状态，允许无手柄时走鼠标回退
    let gamepad_state = manager_guard.as_ref().and_then(|m| m.get_state(user_index));

    let mouse_guard = MOUSE_LISTENER_MANAGER.lock().unwrap();
    let mouse_exists = mouse_guard.as_ref().is_some();
    let mouse_left = mouse_guard.as_ref().map_or(false, |m| m.is_left_pressed());
    let mouse_right = mouse_guard.as_ref().map_or(false, |m| m.is_right_pressed());

    match gamepad_state {
        Some(mut state) => {
            // 保存原始扳机值用于调试
            let original_left = state.left_trigger;
            let original_right = state.right_trigger;

            // 鼠标左键 -> 右扳机 (RT)
            if mouse_left { state.right_trigger = 255; }
            // 鼠标右键 -> 左扳机 (LT)
            if mouse_right { state.left_trigger = 255; }

            // 调试日志
            if mouse_left || mouse_right || original_left > 0 || original_right > 0 {
                println!(
                    "[Gamepad] 状态更新 - 原始: LT={}, RT={} | 鼠标: L={}, R={} | 最终: LT={}, RT={}",
                    original_left, original_right,
                    mouse_left, mouse_right,
                    state.left_trigger, state.right_trigger
                );
            }

            Some(state)
        }
        None if mouse_exists => {
            // 无手柄连接，从鼠标数据合成状态
            let mut state = gamepad::xinput::ControllerState::default();
            if mouse_left { state.right_trigger = 255; }
            if mouse_right { state.left_trigger = 255; }
            println!(
                "[Gamepad] 无手柄，使用鼠标状态: 左键={}, 右键={}",
                mouse_left, mouse_right
            );
            Some(state)
        }
        None => None
    }
}

/// 检查手柄是否已初始化
#[tauri::command]
fn is_gamepad_initialized() -> bool {
    let manager_guard = GAMEPAD_MANAGER.lock().unwrap();
    manager_guard.is_some()
}

/// 初始化鼠标监听器并启动监听
#[tauri::command]
fn init_mouse_listener() -> String {
    let mut manager_guard = MOUSE_LISTENER_MANAGER.lock().unwrap();

    if let Some(manager) = manager_guard.as_ref() {
        if !manager.is_running() {
            println!("[Rust] init_mouse_listener: 重启鼠标监听");
            manager.start_listening();
            return "Mouse listener restarted".to_string();
        }
        println!("[Rust] init_mouse_listener: 监听器已存在且正在运行");
        return "Mouse listener already initialized".to_string();
    }

    println!("[Rust] init_mouse_listener: 创建新的鼠标监听管理器");
    let manager = MouseListenerManager::new();
    manager.start_listening();
    *manager_guard = Some(manager);
    println!("[Rust] init_mouse_listener: 监听已启动");
    "Mouse listener initialized and listening started".to_string()
}

/// 停止鼠标监听
#[tauri::command]
fn stop_mouse_listener() -> String {
    let manager_guard = MOUSE_LISTENER_MANAGER.lock().unwrap();

    if let Some(manager) = manager_guard.as_ref() {
        manager.stop_listening();
        "Mouse listener stopped".to_string()
    } else {
        "Mouse listener not initialized".to_string()
    }
}

/// 获取当前鼠标状态
#[tauri::command]
fn get_mouse_state() -> mouse::listener::MouseState {
    let manager_guard = MOUSE_LISTENER_MANAGER.lock().unwrap();
    manager_guard.as_ref().map_or(mouse::listener::MouseState::Idle, |m| m.get_state())
}

/// 检查鼠标监听是否正在运行
#[tauri::command]
fn is_mouse_listener_running() -> bool {
    let manager_guard = MOUSE_LISTENER_MANAGER.lock().unwrap();
    manager_guard.as_ref().map_or(false, |m| m.is_running())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            init_gamepad,
            stop_gamepad_polling,
            get_gamepad_state,
            is_gamepad_initialized,
            init_mouse_listener,
            stop_mouse_listener,
            get_mouse_state,
            is_mouse_listener_running
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

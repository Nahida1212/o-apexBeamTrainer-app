use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};

#[cfg(windows)]
use rusty_xinput::XInputHandle;

/// 手柄状态结构体
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct ControllerState {
    /// 左摇杆 X 轴 (-32768 到 32767)
    pub left_stick_x: i16,
    /// 左摇杆 Y 轴 (-32768 到 32767)
    pub left_stick_y: i16,
    /// 右摇杆 X 轴 (-32768 到 32767)
    pub right_stick_x: i16,
    /// 右摇杆 Y 轴 (-32768 到 32767)
    pub right_stick_y: i16,
    /// 左扳机 (0 到 255)
    pub left_trigger: u8,
    /// 右扳机 (0 到 255)
    pub right_trigger: u8,
    /// 按键状态
    pub buttons: ButtonState,
}

/// 按键状态结构体
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct ButtonState {
    pub a: bool,              // Xbox: A, Playstation: X, Nintendo: B
    pub b: bool,              // Xbox: B, Playstation: Circle, Nintendo: A
    pub x: bool,              // Xbox: X, Playstation: Square, Nintendo: Y
    pub y: bool,              // Xbox: Y, Playstation: Triangle, Nintendo: X
    pub left_shoulder: bool,  // Xbox: LB, Playstation: L1, Nintendo: L
    pub right_shoulder: bool, // Xbox: RB, Playstation: R1, Nintendo: R
    pub back: bool,           // Xbox: Back, Playstation: Select, Nintendo: -
    pub start: bool,          // Xbox: Start, Playstation: Start, Nintendo: +
    pub left_thumb: bool,     // Xbox: L3, Playstation: L3, Nintendo: (L)
    pub right_thumb: bool,    // Xbox: R3, Playstation: R3, Nintendo: (R)
    pub dpad_up: bool,
    pub dpad_down: bool,
    pub dpad_left: bool,
    pub dpad_right: bool,
}

/// 手柄管理器
pub struct GamepadManager {
    #[cfg(windows)]
    handle: Option<XInputHandle>,
    running: Arc<AtomicBool>,
}

impl GamepadManager {
    /// 创建新的手柄管理器
    #[cfg(windows)]
    pub fn new() -> Self {
        let handle = XInputHandle::load_default().ok();
        if handle.is_some() {
            println!("[Gamepad] XInput DLL 加载成功");
        } else {
            println!("[Gamepad] XInput DLL 加载失败，手柄功能不可用");
        }
        Self {
            handle,
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// 非 Windows 平台的占位实现
    #[cfg(not(windows))]
    pub fn new() -> Self {
        println!("[Gamepad] XInput 仅支持 Windows 平台");
        Self {
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// 启动手柄监听循环
    pub fn start_polling(&self, poll_interval_ms: u64) {
        if self.running.load(Ordering::SeqCst) {
            println!("[Gamepad] 监听已在运行中");
            return;
        }

        self.running.store(true, Ordering::SeqCst);
        let running = Arc::clone(&self.running);

        #[cfg(windows)]
        let handle = self.handle.clone();

        thread::spawn(move || {
            println!("[Gamepad] 开始监听手柄输入 (轮询间隔: {}ms)...", poll_interval_ms);

            #[cfg(windows)]
            {
                if let Some(xinput_handle) = handle {
                    poll_loop_windows(xinput_handle, running, poll_interval_ms);
                } else {
                    println!("[Gamepad] XInput 未加载，监听终止");
                }
            }

            #[cfg(not(windows))]
            {
                println!("[Gamepad] 非 Windows 平台，监听终止");
            }
        });
    }

    /// 停止手柄监听
    pub fn stop_polling(&self) {
        self.running.store(false, Ordering::SeqCst);
        println!("[Gamepad] 监听已停止");
    }

    /// 获取单个手柄状态
    #[cfg(windows)]
    pub fn get_state(&self, user_index: u32) -> Option<ControllerState> {
        self.handle.as_ref().and_then(|h| {
            h.get_state(user_index)
                .ok()
                .map(|state| convert_xinput_state(&state))
        })
    }

    #[cfg(not(windows))]
    pub fn get_state(&self, _user_index: u32) -> Option<ControllerState> {
        None
    }
}

/// Windows 平台的轮询循环
#[cfg(windows)]
fn poll_loop_windows(handle: XInputHandle, running: Arc<AtomicBool>, poll_interval_ms: u64) {
    // 记录每个手柄是否已连接，避免反复打印未连接手柄的错误
    let mut connected_states = [false; 4];

    while running.load(Ordering::SeqCst) {
        for user_index in 0..4 {
            match handle.get_state(user_index) {
                Ok(state) => {
                    let idx = user_index as usize;
                    if !connected_states[idx] {
                        println!("[Gamepad] 手柄 {} 已连接", user_index);
                        connected_states[idx] = true;
                    }

                    let controller_state = convert_xinput_state(&state);

                    // 只在有有效输入时打印
                    if has_significant_input(&controller_state) {
                        print_controller_state(user_index, &controller_state);
                    }
                }
                Err(_) => {
                    // 手柄未连接，静默处理
                    let idx = user_index as usize;
                    if connected_states[idx] {
                        println!("[Gamepad] 手柄 {} 已断开", user_index);
                        connected_states[idx] = false;
                    }
                }
            }
        }

        thread::sleep(Duration::from_millis(poll_interval_ms));
    }
}

/// 将 XInputState 转换为 ControllerState
#[cfg(windows)]
fn convert_xinput_state(state: &rusty_xinput::XInputState) -> ControllerState {
    let (lx, ly) = state.left_stick_raw();
    let (rx, ry) = state.right_stick_raw();

    ControllerState {
        left_stick_x: lx,
        left_stick_y: ly,
        right_stick_x: rx,
        right_stick_y: ry,
        left_trigger: state.left_trigger(),
        right_trigger: state.right_trigger(),
        buttons: ButtonState {
            a: state.south_button(),
            b: state.east_button(),
            x: state.west_button(),
            y: state.north_button(),
            left_shoulder: state.left_shoulder(),
            right_shoulder: state.right_shoulder(),
            back: state.select_button(),
            start: state.start_button(),
            left_thumb: state.left_thumb_button(),
            right_thumb: state.right_thumb_button(),
            dpad_up: state.arrow_up(),
            dpad_down: state.arrow_down(),
            dpad_left: state.arrow_left(),
            dpad_right: state.arrow_right(),
        },
    }
}

/// 检查是否有有效输入 (排除死区)
fn has_significant_input(state: &ControllerState) -> bool {
    const STICK_THRESHOLD: i16 = 7849; // XInput 默认左摇杆死区
    const TRIGGER_THRESHOLD: u8 = rusty_xinput::XInputState::TRIGGER_THRESHOLD;

    state.left_stick_x.abs() > STICK_THRESHOLD
        || state.left_stick_y.abs() > STICK_THRESHOLD
        || state.right_stick_x.abs() > STICK_THRESHOLD
        || state.right_stick_y.abs() > STICK_THRESHOLD
        || state.left_trigger > TRIGGER_THRESHOLD
        || state.right_trigger > TRIGGER_THRESHOLD
        || is_any_button_pressed(&state.buttons)
}

/// 检查是否有任何按键被按下
fn is_any_button_pressed(buttons: &ButtonState) -> bool {
    buttons.a
        || buttons.b
        || buttons.x
        || buttons.y
        || buttons.left_shoulder
        || buttons.right_shoulder
        || buttons.back
        || buttons.start
        || buttons.left_thumb
        || buttons.right_thumb
        || buttons.dpad_up
        || buttons.dpad_down
        || buttons.dpad_left
        || buttons.dpad_right
}

/// 打印手柄状态到控制台
fn print_controller_state(user_index: u32, state: &ControllerState) {
    let buttons_str = format_buttons(&state.buttons);

    println!(
        "[手柄 {}] 左摇杆: ({:6}, {:6}) | 右摇杆: ({:6}, {:6}) | 扳机: ({:3}, {:3}) | 按键: {}",
        user_index,
        state.left_stick_x,
        state.left_stick_y,
        state.right_stick_x,
        state.right_stick_y,
        state.left_trigger,
        state.right_trigger,
        buttons_str
    );
}

/// 格式化按键状态为字符串
fn format_buttons(buttons: &ButtonState) -> String {
    let mut pressed = Vec::new();

    if buttons.a { pressed.push("A"); }
    if buttons.b { pressed.push("B"); }
    if buttons.x { pressed.push("X"); }
    if buttons.y { pressed.push("Y"); }
    if buttons.left_shoulder { pressed.push("LB"); }
    if buttons.right_shoulder { pressed.push("RB"); }
    if buttons.back { pressed.push("Back"); }
    if buttons.start { pressed.push("Start"); }
    if buttons.left_thumb { pressed.push("L3"); }
    if buttons.right_thumb { pressed.push("R3"); }
    if buttons.dpad_up { pressed.push("D-Up"); }
    if buttons.dpad_down { pressed.push("D-Down"); }
    if buttons.dpad_left { pressed.push("D-Left"); }
    if buttons.dpad_right { pressed.push("D-Right"); }

    if pressed.is_empty() {
        "无".to_string()
    } else {
        pressed.join(", ")
    }
}

impl Default for GamepadManager {
    fn default() -> Self {
        Self::new()
    }
}
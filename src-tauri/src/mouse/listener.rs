use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Arc;
use std::thread;

use serde::{Deserialize, Serialize};

/// 鼠标状态枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MouseState {
    Idle,
    Aiming,
    Shooting,
}

impl Default for MouseState {
    fn default() -> Self {
        MouseState::Idle
    }
}

/// 鼠标监听管理器
pub struct MouseListenerManager {
    running: Arc<AtomicBool>,
    state: Arc<AtomicU8>, // 0: Idle, 1: Aiming, 2: Shooting
    left_pressed: Arc<AtomicBool>,
    right_pressed: Arc<AtomicBool>,
}

impl MouseListenerManager {
    /// 创建新的鼠标监听管理器，同时启动 rdev::listen 后台线程（只启动一次）
    pub fn new() -> Self {
        let manager = Self {
            running: Arc::new(AtomicBool::new(false)),
            state: Arc::new(AtomicU8::new(0)), // 默认为 Idle
            left_pressed: Arc::new(AtomicBool::new(false)),
            right_pressed: Arc::new(AtomicBool::new(false)),
        };
        manager.spawn_listener_thread();
        manager
    }

    /// 启动 rdev::listen 后台线程（只由 new() 调用一次）
    fn spawn_listener_thread(&self) {
        let running = Arc::clone(&self.running);
        let state = Arc::clone(&self.state);
        let left_pressed = Arc::clone(&self.left_pressed);
        let right_pressed = Arc::clone(&self.right_pressed);

        thread::spawn(move || {
            println!("[Mouse] rdev::listen 后台线程已启动");

            // 为回调创建 Arc 的克隆
            let running_cb = Arc::clone(&running);
            let state_cb = Arc::clone(&state);
            let left_pressed_cb = Arc::clone(&left_pressed);
            let right_pressed_cb = Arc::clone(&right_pressed);

            // 设置 rdev 事件监听
            let callback = move |event: rdev::Event| {
                if !running_cb.load(Ordering::SeqCst) {
                    return;
                }

                println!("[Mouse] 收到事件: {:?}", event.event_type);

                match event.event_type {
                    rdev::EventType::ButtonPress(button) => {
                        match button {
                            rdev::Button::Left => {
                                left_pressed_cb.store(true, Ordering::SeqCst);
                                println!("[Mouse] 左键按下 - 射击状态");
                            }
                            rdev::Button::Right => {
                                right_pressed_cb.store(true, Ordering::SeqCst);
                                println!("[Mouse] 右键按下 - 瞄准状态");
                            }
                            _ => {}
                        }
                    }
                    rdev::EventType::ButtonRelease(button) => {
                        match button {
                            rdev::Button::Left => {
                                left_pressed_cb.store(false, Ordering::SeqCst);
                                println!("[Mouse] 左键释放");
                            }
                            rdev::Button::Right => {
                                right_pressed_cb.store(false, Ordering::SeqCst);
                                println!("[Mouse] 右键释放");
                            }
                            _ => {}
                        }
                    }
                    _ => {}
                }

                // 更新状态
                update_state_from_atomics(
                    &left_pressed_cb,
                    &right_pressed_cb,
                    &state_cb,
                );
            };

            // rdev::listen 会阻塞，这个线程就是专门跑它的
            println!("[Mouse] 开始监听全局鼠标事件...");
            if let Err(error) = rdev::listen(callback) {
                eprintln!("[Mouse] 监听鼠标事件失败: {:?}", error);
            } else {
                println!("[Mouse] rdev::listen 正常退出");
            }
            println!("[Mouse] rdev::listen 后台线程已退出");
        });
    }

    /// 启动鼠标监听（只切换 running 标志，不重新创建线程）
    pub fn start_listening(&self) {
        if self.running.load(Ordering::SeqCst) {
            println!("[Mouse] 监听已在运行中");
            return;
        }

        self.running.store(true, Ordering::SeqCst);
        println!("[Mouse] 设置 running 标志为 true");
    }

    /// 停止鼠标监听（只切换 running 标志，不影响 rdev::listen 线程）
    pub fn stop_listening(&self) {
        self.running.store(false, Ordering::SeqCst);
        self.left_pressed.store(false, Ordering::SeqCst);
        self.right_pressed.store(false, Ordering::SeqCst);
        self.state.store(0, Ordering::SeqCst);
        println!("[Mouse] 监听已停止");
    }

    /// 获取当前鼠标状态
    pub fn get_state(&self) -> MouseState {
        let state_num = self.state.load(Ordering::SeqCst);
        let state = match state_num {
            1 => MouseState::Aiming,
            2 => MouseState::Shooting,
            _ => MouseState::Idle,
        };
        println!("[Mouse] get_state() 被调用，状态值: {} -> {:?}", state_num, state);
        state
    }

    /// 检查监听是否正在运行
    pub fn is_running(&self) -> bool {
        let running = self.running.load(Ordering::SeqCst);
        println!("[Mouse] is_running() 被调用，返回: {}", running);
        running
    }

    /// 获取左键按下状态
    pub fn is_left_pressed(&self) -> bool {
        let pressed = self.left_pressed.load(Ordering::SeqCst);
        let running = self.running.load(Ordering::SeqCst);
        println!("[Mouse] is_left_pressed() 被调用，running: {}, 返回: {}", running, pressed);
        pressed
    }

    /// 获取右键按下状态
    pub fn is_right_pressed(&self) -> bool {
        let pressed = self.right_pressed.load(Ordering::SeqCst);
        let running = self.running.load(Ordering::SeqCst);
        println!("[Mouse] is_right_pressed() 被调用，running: {}, 返回: {}", running, pressed);
        pressed
    }
}

/// 根据原子按键状态更新状态
fn update_state_from_atomics(
    left_pressed: &AtomicBool,
    right_pressed: &AtomicBool,
    state: &AtomicU8,
) {
    let new_state = if left_pressed.load(Ordering::SeqCst) {
        MouseState::Shooting
    } else if right_pressed.load(Ordering::SeqCst) {
        MouseState::Aiming
    } else {
        MouseState::Idle
    };

    let state_num = match new_state {
        MouseState::Idle => 0,
        MouseState::Aiming => 1,
        MouseState::Shooting => 2,
    };

    state.store(state_num, Ordering::SeqCst);
    println!("[Mouse] 状态已更新: {:?}", new_state);
}

impl Default for MouseListenerManager {
    fn default() -> Self {
        Self::new()
    }
}
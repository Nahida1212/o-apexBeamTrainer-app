/**
 * services/mouseService.ts - 鼠标服务
 * 处理与Rust后端的鼠标监听通信
 */

import { invoke } from "@tauri-apps/api/core";
import type { MouseState } from "@/types";

/**
 * 初始化鼠标监听器
 */
export async function initMouseListener(): Promise<string> {
  return invoke<string>("init_mouse_listener");
}

/**
 * 停止鼠标监听
 */
export async function stopMouseListener(): Promise<string> {
  return invoke<string>("stop_mouse_listener");
}

/**
 * 获取当前鼠标状态
 */
export async function getMouseState(): Promise<MouseState> {
  return invoke<MouseState>("get_mouse_state");
}

/**
 * 检查鼠标监听是否正在运行
 */
export async function isMouseListenerRunning(): Promise<boolean> {
  return invoke<boolean>("is_mouse_listener_running");
}
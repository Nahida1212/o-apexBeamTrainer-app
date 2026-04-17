/**
 * services/gamepadService.ts - 手柄服务
 * 处理与Rust后端的通信
 */

import { invoke } from "@tauri-apps/api/core";
import type { ControllerState } from "@/types";

/**
 * 初始化手柄管理器
 */
export async function initGamepad(): Promise<string> {
  return invoke<string>("init_gamepad");
}

/**
 * 停止手柄轮询
 */
export async function stopGamepadPolling(): Promise<string> {
  return invoke<string>("stop_gamepad_polling");
}

/**
 * 获取指定手柄的状态
 * @param userIndex - 手柄索引 (0-3)
 */
export async function getGamepadState(
  userIndex: number
): Promise<ControllerState | null> {
  return invoke<ControllerState | null>("get_gamepad_state", {
    userIndex,
  });
}

/**
 * 检查手柄是否已初始化
 */
export async function isGamepadInitialized(): Promise<boolean> {
  return invoke<boolean>("is_gamepad_initialized");
}

/**
 * 获取所有连接的手柄状态
 */
export async function getAllGamepadStates(): Promise<(ControllerState | null)[]> {
  const states: (ControllerState | null)[] = [];
  for (let i = 0; i < 4; i++) {
    try {
      const state = await getGamepadState(i);
      states.push(state);
    } catch {
      states.push(null);
    }
  }
  return states;
}

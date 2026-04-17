/**
 * types/mouse.ts - 鼠标相关类型定义
 */

/**
 * 鼠标状态枚举
 */
export type MouseState = 'idle' | 'aiming' | 'shooting';

/**
 * 鼠标监听器状态
 */
export interface MouseListenerState {
  isInitialized: boolean;
  isRunning: boolean;
  currentState: MouseState;
}
/**
 * 按键状态接口
 */
export interface ButtonState {
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  left_shoulder: boolean;
  right_shoulder: boolean;
  back: boolean;
  start: boolean;
  left_thumb: boolean;
  right_thumb: boolean;
  dpad_up: boolean;
  dpad_down: boolean;
  dpad_left: boolean;
  dpad_right: boolean;
}

/**
 * 手柄状态接口
 */
export interface ControllerState {
  left_stick_x: number;
  left_stick_y: number;
  right_stick_x: number;
  right_stick_y: number;
  left_trigger: number;
  right_trigger: number;
  buttons: ButtonState;
}

/**
 * 手柄初始化选项
 */
export interface GamepadInitOptions {
  pollInterval?: number; // 轮询间隔（毫秒），默认 8ms
}

/**
 * 手柄管理器状态
 */
export interface GamepadManagerState {
  isInitialized: boolean;
  isPolling: boolean;
  statusMessage: string;
  controllers: (ControllerState | null)[];
}

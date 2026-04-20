/**
 * 按键绑定设置
 */
export interface KeyBindings {
  /** 开火按键，默认 'right_trigger' (RT) */
  fire: string;
  /** 瞄准按键，默认 'left_trigger' (LT) */
  aim: string;
  /** 开关按键，默认 'a' (A按钮) */
  toggle: string;
}

/**
 * 应用程序设置
 */
export interface AppSettings {
  /** 按键绑定配置 */
  keyBindings: KeyBindings;
}

/**
 * 默认按键绑定
 */
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  fire: 'right_trigger',
  aim: 'left_trigger',
  toggle: 'a',
};

/**
 * 默认应用程序设置
 */
export const DEFAULT_SETTINGS: AppSettings = {
  keyBindings: DEFAULT_KEY_BINDINGS,
};
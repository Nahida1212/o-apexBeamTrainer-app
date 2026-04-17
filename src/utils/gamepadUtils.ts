/**
 * utils/gamepadUtils.ts - 手柄工具函数
 */

import type { ButtonState } from "@/types";

/**
 * 将摇杆原始值转换为百分比
 * @param value - 摇杆值 (-32768 ~ 32767)
 */
export function formatStickValue(value: number): string {
  const percent = ((value / 32767) * 100).toFixed(1);
  return `${percent}%`;
}

/**
 * 获取按下的按键列表
 */
export function getPressedButtons(buttons: ButtonState): string[] {
  const pressed: string[] = [];

  if (buttons.a) pressed.push("A");
  if (buttons.b) pressed.push("B");
  if (buttons.x) pressed.push("X");
  if (buttons.y) pressed.push("Y");
  if (buttons.left_shoulder) pressed.push("LB");
  if (buttons.right_shoulder) pressed.push("RB");
  if (buttons.back) pressed.push("Back");
  if (buttons.start) pressed.push("Start");
  if (buttons.left_thumb) pressed.push("L3");
  if (buttons.right_thumb) pressed.push("R3");
  if (buttons.dpad_up) pressed.push("↑");
  if (buttons.dpad_down) pressed.push("↓");
  if (buttons.dpad_left) pressed.push("←");
  if (buttons.dpad_right) pressed.push("→");

  return pressed;
}

/**
 * 计算摇杆在可视化区域中的位置
 * @param x - X 轴值
 * @param y - Y 轴值
 */
export function getStickPosition(
  x: number,
  y: number
): { left: string; top: string } {
  const centerX = 50 + (x / 32767) * 40;
  const centerY = 50 - (y / 32767) * 40;

  return {
    left: `${Math.max(5, Math.min(95, centerX))}%`,
    top: `${Math.max(5, Math.min(95, centerY))}%`,
  };
}

/**
 * 格式化扳机值为百分比
 */
export function formatTriggerValue(value: number): number {
  return Math.round((value / 255) * 100);
}

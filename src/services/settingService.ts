/**
 * services/settingService.ts - 设置服务
 * 使用Tauri Store插件管理应用程序设置
 */

import { Store } from '@tauri-apps/plugin-store';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

const SETTINGS_FILE = 'settings.json';
const SETTINGS_KEY = 'app_settings';

// 全局store实例
let store: Store | null = null;

/**
 * 初始化设置store
 */
async function initStore(): Promise<Store> {
  if (!store) {
    store = await Store.load(SETTINGS_FILE);
  }
  return store;
}

/**
 * 获取当前设置
 * 如果不存在则创建默认设置
 */
export async function getSettings(): Promise<AppSettings> {
  const store = await initStore();

  // 尝试读取现有设置
  const settings = await store.get<AppSettings>(SETTINGS_KEY);

  if (settings) {
    return settings;
  }

  // 创建默认设置
  await store.set(SETTINGS_KEY, DEFAULT_SETTINGS);
  await store.save();

  return DEFAULT_SETTINGS;
}

/**
 * 更新设置
 */
export async function updateSettings(settings: AppSettings): Promise<void> {
  const store = await initStore();
  await store.set(SETTINGS_KEY, settings);
  await store.save();
}

/**
 * 重置为默认设置
 */
export async function resetSettings(): Promise<AppSettings> {
  await updateSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * 获取按键绑定
 */
export async function getKeyBindings() {
  const settings = await getSettings();
  return settings.keyBindings;
}

/**
 * 更新按键绑定
 */
export async function updateKeyBindings(keyBindings: AppSettings['keyBindings']): Promise<void> {
  const settings = await getSettings();
  settings.keyBindings = keyBindings;
  await updateSettings(settings);
}
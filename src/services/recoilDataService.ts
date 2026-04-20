/**
 * services/recoilDataService.ts - 压枪数据管理服务
 */
import type { WeaponRecoilData } from "@/types";
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

let recoilDataCache: WeaponRecoilData[] = [];

/**
 * 加载压枪数据从time.txt
 */
export async function loadRecoilData(): Promise<WeaponRecoilData[]> {
  if (recoilDataCache.length > 0) {
    return recoilDataCache;
  }

  try {
    // 使用Tauri fs API读取打包的资源文件
    const text = await readTextFile('resources/time.txt', { baseDir: BaseDirectory.Resource });

    // 将JavaScript对象字面量转换为标准JSON格式
    // 为所有未被引号包围的属性名添加引号
    const jsonText = text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // 解析JSON数据
    recoilDataCache = JSON.parse(jsonText);
    console.log("✓ 压枪数据加载成功", recoilDataCache.length, "把枪械");
    return recoilDataCache;
  } catch (error) {
    console.error("✗ 加载压枪数据失败:", error);
    console.error("Error details:", JSON.stringify(error));
    return [];
  }
}

/**
 * 根据枪械ID获取压枪数据
 */
export function getRecoilDataById(weaponId: string): WeaponRecoilData | undefined {
  return recoilDataCache.find((w) => w.id === weaponId);
}

/**
 * 获取所有压枪数据
 */
export function getAllRecoilData(): WeaponRecoilData[] {
  return recoilDataCache;
}

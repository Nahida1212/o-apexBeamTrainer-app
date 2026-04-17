/**
 * types/weapon.ts - 武器相关类型定义
 */

/**
 * 压枪动作
 */
export interface RecoilAction {
  type: 'direction' | 'shoot';
  direction?: 'left' | 'right';
  duration: number; // 毫秒
}

/**
 * 压枪模式集合
 */
export type RecoilPatternMap = Record<string, RecoilAction[]>;

/**
 * 完整的枪械压枪数据（来自time.txt）
 */
export interface WeaponRecoilData {
  id: string;
  name: string;
  category: string;
  image: string;
  ammo: string;
  reloadTimeSeconds: number;
  pattern: RecoilPatternMap;
}

/**
 * 压枪难度等级
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert';

/**
 * 枪械类型
 */
export type WeaponType = 'rifle' | 'smg' | 'sniper' | 'shotgun' | 'pistol' | 'lmg';

/**
 * 枪械信息
 */
export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  icon: string; // SVG 文件路径
  description: string;
  difficulty: DifficultyLevel;
  recoilPattern: number[]; // 压枪模式数据 (1-100 的百分比)
  horizontalPattern: number[]; // 横移模式 (0-100, <50左移, >50右移)
  fireRate: number; // 射速 (发/秒)
  damage: number; // 伤害值
}

/**
 * 压枪训练设置
 */
export interface RecoilTrainingConfig {
  duration: number; // 训练时长 (秒)
  feedbackType: 'visual' | 'audio' | 'both'; // 反馈类型
  enableSound: boolean; // 是否启用音频反馈
  enableVisual: boolean; // 是否启用可视反馈
  targetAccuracy: number; // 目标准度 (0-100)
}

/**
 * 训练结果
 */
export interface TrainingResult {
  weaponId: string;
  duration: number;
  accuracy: number;
  shots: number;
  hitCount: number;
  timestamp: string;
}

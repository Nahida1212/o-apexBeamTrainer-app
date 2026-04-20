/**
 * types/index.ts - 导出所有TypeScript类型
 */

export type {
  ButtonState,
  ControllerState,
  GamepadInitOptions,
  GamepadManagerState,
} from './gamepad';

export type {
  DifficultyLevel,
  WeaponType,
  Weapon,
  RecoilTrainingConfig,
  TrainingResult,
  RecoilAction,
  RecoilPatternMap,
  WeaponRecoilData,
} from './weapon';

export type {
  MouseState,
  MouseListenerState,
} from './mouse';

export type {
  KeyBindings,
  AppSettings,
} from './setting';

export {
  DEFAULT_KEY_BINDINGS,
  DEFAULT_SETTINGS,
} from './setting';

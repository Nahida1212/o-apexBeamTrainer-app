<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getKeyBindings, updateKeyBindings, resetSettings } from '@/services/settingService';
import { gamepadService } from '@/services';
import type { KeyBindings, ControllerState } from '@/types';

// 当前绑定的按键
const currentBindings = ref<KeyBindings>({
  fire: 'right_trigger',
  aim: 'left_trigger',
  toggle: 'a'
});

// 正在监听的功能
const listeningFor = ref<keyof KeyBindings | null>(null);
// 轮询间隔引用
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null);

// 按键显示名称映射
const buttonDisplayNames: Record<string, string> = {
  left_trigger: 'LT',
  right_trigger: 'RT',
  a: 'A',
  b: 'B',
  x: 'X',
  y: 'Y',
  left_shoulder: 'LB',
  right_shoulder: 'RB',
  back: 'Back',
  start: 'Start',
  left_thumb: 'L3',
  right_thumb: 'R3',
  dpad_up: 'D-pad Up',
  dpad_down: 'D-pad Down',
  dpad_left: 'D-pad Left',
  dpad_right: 'D-pad Right',
};

// 获取完整显示名称
const getDisplayName = (buttonValue: string) => {
  const displayMap: Record<string, string> = {
    left_trigger: '左扳机(LT)',
    right_trigger: '右扳机(RT)',
    a: 'A按钮',
    b: 'B按钮',
    x: 'X按钮',
    y: 'Y按钮',
    left_shoulder: '左肩键(LB)',
    right_shoulder: '右肩键(RB)',
    back: '返回键',
    start: '开始键',
    left_thumb: '左摇杆按下(L3)',
    right_thumb: '右摇杆按下(R3)',
    dpad_up: '十字键上',
    dpad_down: '十字键下',
    dpad_left: '十字键左',
    dpad_right: '十字键右',
  };
  return displayMap[buttonValue] || buttonValue;
};

// 获取简写显示名称
const getShortDisplayName = (buttonValue: string) => {
  return buttonDisplayNames[buttonValue] || buttonValue;
};

// 加载当前绑定
const loadBindings = async () => {
  try {
    const bindings = await getKeyBindings();
    currentBindings.value = bindings;
    console.log('按键绑定加载成功:', bindings);
  } catch (error) {
    console.error('加载按键绑定失败:', error);
  }
};

// 获取绑定标签
const getBindingLabel = (key: keyof KeyBindings) => {
  const labels = {
    fire: '开火按键',
    aim: '瞄准按键',
    toggle: '开关按键'
  };
  return labels[key] || key;
};

// 根据绑定名称获取按键/扳机状态
const getButtonValue = (state: ControllerState, buttonName: string): number => {
  // 扳机
  if (buttonName === 'left_trigger') return state.left_trigger;
  if (buttonName === 'right_trigger') return state.right_trigger;
  // 按钮
  const buttonMap: Record<string, keyof typeof state.buttons> = {
    a: 'a',
    b: 'b',
    x: 'x',
    y: 'y',
    left_shoulder: 'left_shoulder',
    right_shoulder: 'right_shoulder',
    back: 'back',
    start: 'start',
    left_thumb: 'left_thumb',
    right_thumb: 'right_thumb',
    dpad_up: 'dpad_up',
    dpad_down: 'dpad_down',
    dpad_left: 'dpad_left',
    dpad_right: 'dpad_right',
  };
  const mapped = buttonMap[buttonName];
  if (mapped && state.buttons[mapped]) {
    return state.buttons[mapped] ? 255 : 0;
  }
  return 0;
};

// 检测所有可能的按键
const detectPressedButton = (state: ControllerState): string | null => {
  const buttonsToCheck = [
    'left_trigger', 'right_trigger',
    'a', 'b', 'x', 'y',
    'left_shoulder', 'right_shoulder',
    'back', 'start',
    'left_thumb', 'right_thumb',
    'dpad_up', 'dpad_down', 'dpad_left', 'dpad_right'
  ];

  for (const button of buttonsToCheck) {
    const value = getButtonValue(state, button);
    if (value > 100) { // 阈值100/255
      return button;
    }
  }
  return null;
};

// 开始监听按键
const startListening = async (bindingKey: keyof KeyBindings) => {
  try {
    // 确保手柄已初始化
    const isInitialized = await gamepadService.isGamepadInitialized();
    if (!isInitialized) {
      const initResult = await gamepadService.initGamepad();
      console.log('手柄初始化结果:', initResult);
    }

    listeningFor.value = bindingKey;

    // 清除现有轮询
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }

    // 启动轮询检测按键按下
    pollingInterval.value = setInterval(async () => {
      if (!listeningFor.value) return;

      try {
        const state = await gamepadService.getGamepadState(0);
        if (!state) return;

        const pressedButton = detectPressedButton(state);
        if (pressedButton) {
          // 更新绑定
          const newBindings = { ...currentBindings.value };

          // 检查是否已被其他功能使用
          const usedByOther = Object.entries(newBindings).find(
            ([key, value]) => key !== listeningFor.value && value === pressedButton
          );

          if (usedByOther) {
            // 交换按键
            const [otherKey] = usedByOther;
            newBindings[otherKey as keyof KeyBindings] = newBindings[listeningFor.value];
          }

          newBindings[listeningFor.value] = pressedButton;

          await updateKeyBindings(newBindings);
          currentBindings.value = newBindings;

          console.log('按键绑定更新成功:', newBindings);
          listeningFor.value = null;

          // 停止轮询
          if (pollingInterval.value) {
            clearInterval(pollingInterval.value);
            pollingInterval.value = null;
          }
        }
      } catch (error) {
        console.error('检测手柄状态失败:', error);
      }
    }, 16); // 约 60fps，与游戏手柄测试页面一致
  } catch (error) {
    console.error('开始监听失败:', error);
    alert('无法初始化手柄，请检查连接');
  }
};

// 取消监听
const cancelListening = () => {
  listeningFor.value = null;
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

// 恢复默认设置
const restoreDefaults = async () => {
  if (confirm('确定要恢复默认键位吗？当前的自定义设置将会丢失。')) {
    try {
      const defaultSettings = await resetSettings();
      currentBindings.value = defaultSettings.keyBindings;
      console.log('已恢复默认设置:', defaultSettings.keyBindings);
      alert('已恢复默认键位设置');
    } catch (error) {
      console.error('恢复默认设置失败:', error);
      alert('恢复失败，请重试');
    }
  }
};

// 页面加载时获取绑定
onMounted(() => {
  loadBindings();
});

// 页面卸载时清理
onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
});
</script>

<template>
  <div class="binding-page">
    <div class="page-header">
      <h1>⚙️ 按键绑定设置</h1>
      <p class="subtitle">自定义游戏手柄控制按键</p>
    </div>

    <div class="binding-container">
      <!-- 当前绑定状态 -->
      <div class="current-binding-card">
        <h3>🎮 当前按键绑定</h3>
        <div class="binding-list">
          <div v-for="(value, key) in currentBindings" :key="key" class="binding-item">
            <span class="binding-label">{{ getBindingLabel(key as keyof KeyBindings) }}</span>
            <span class="binding-value">
              {{ getDisplayName(value) }}
              <span class="short-name">({{ getShortDisplayName(value) }})</span>
            </span>
            <button
              class="edit-btn"
              @click="startListening(key as keyof KeyBindings)"
              :disabled="!!listeningFor"
            >
              修改
            </button>
          </div>
        </div>

        <div class="action-buttons">
          <button
            class="btn btn-restore"
            @click="restoreDefaults"
            :disabled="!!listeningFor"
          >
            🔄 恢复默认
          </button>
        </div>
      </div>

      <!-- 监听界面 -->
      <div v-if="listeningFor" class="edit-panel">
        <h3>🎮 正在修改 {{ getBindingLabel(listeningFor) }}</h3>

        <div class="listening-form">
          <div class="listening-message">
            <div class="listening-icon">🎯</div>
            <div class="listening-text">
              <p>请按下手柄上的按键来绑定到<span class="function-name"> {{ getBindingLabel(listeningFor) }} </span>功能</p>
              <p class="hint">按下任意按钮或扳机即可完成绑定</p>
            </div>
          </div>

          <div class="listening-actions">
            <button class="btn btn-cancel" @click="cancelListening">
              ❌ 取消绑定
            </button>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="instructions-card">
        <h4>💡 使用说明</h4>
        <ul>
          <li><strong>开火按键:</strong> 控制武器射击，默认 RT</li>
          <li><strong>瞄准按键:</strong> 控制进入瞄准状态，默认 LT</li>
          <li><strong>开关按键:</strong> 控制功能开关，默认 A</li>
          <li>每个功能只能分配一个按键，不能重复</li>
          <li>修改后需要重启训练才能生效</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.binding-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.binding-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-binding-card,
.edit-panel,
.instructions-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.current-binding-card h3,
.edit-panel h3,
.instructions-card h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #334155;
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.binding-item {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.binding-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.binding-value {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.short-name {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}

.edit-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-restore {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-restore:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.button-select {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.button-select:focus {
  outline: none;
  border-color: #667eea;
}

.warning-text {
  margin: 0;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
}

.edit-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-save {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.instructions-card ul {
  margin: 0;
  padding-left: 20px;
}

.instructions-card li {
  margin-bottom: 8px;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.instructions-card strong {
  color: #334155;
}

/* 监听表单样式 */
.listening-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.listening-message {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 2px solid #0ea5e9;
  border-radius: 12px;
}

.listening-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.listening-text {
  flex: 1;
}

.listening-text p {
  margin: 0;
  font-size: 15px;
  color: #0369a1;
  line-height: 1.5;
}

.listening-text .function-name {
  font-weight: 700;
  color: #0c4a6e;
}

.listening-text .hint {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.listening-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
</style>
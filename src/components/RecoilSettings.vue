<script setup lang="ts">
import { ref, inject, computed, onUnmounted, onMounted } from "vue";
import type { RecoilTrainingConfig } from "@/types";
import { getRecoilDataById, loadRecoilData } from "@/services/recoilDataService";
import { initGamepad, stopGamepadPolling, getGamepadState } from "@/services/gamepadService";
import { initMouseListener, stopMouseListener, isMouseListenerRunning } from "@/services/mouseService";
import { soundService } from "@/services/soundService";
import { useDirectionWindow } from "@/composables/useDirectionWindow";
import { getKeyBindings } from "@/services/settingService";

// 瞄准模式切换相关状态
const aimMode = ref<'hold' | 'toggle'>('hold');
const previousAimButtonState = ref(false);
const aimingDelayTimer = ref<ReturnType<typeof setTimeout> | null>(null);

// 方向窗口控制（置顶显示）
const { showDirection, showWindow, hideWindow } = useDirectionWindow();

// 播放音效和显示方向反馈
const playSound = (type: 'ready' | 'left' | 'right') => {
  console.log(`playSound被调用: type=${type}`);
  const { feedbackType, enableSound, enableVisual } = config.value;
  console.log(`配置: feedbackType=${feedbackType}, enableSound=${enableSound}, enableVisual=${enableVisual}`);

  // 音频反馈
  if (enableSound && feedbackType !== 'visual') {
    try {
      console.log(`准备播放音效: ${type}`);
      switch (type) {
        case 'ready':
          soundService.playReadySound();
          break;
        case 'left':
          soundService.playDirectionSound('left', 500);
          break;
        case 'right':
          soundService.playDirectionSound('right', 500);
          break;
      }
      console.log(`音效播放调用完成: ${type}`);
    } catch (error) {
      console.error(`播放音效失败:`, error);
    }
  } else {
    console.log(`音效被禁用或不需要: feedbackType=${feedbackType}, enableSound=${enableSound}`);
  }

  // 视觉反馈（方向叠加层）
  if (enableVisual && feedbackType !== 'audio' && (type === 'left' || type === 'right')) {
    try {
      console.log(`🎯 准备显示方向指示: ${type}`);
      showDirection(type, 800); // 显示800ms，比音效稍长
      console.log(`🎯 showDirection调用完成: ${type}`);
    } catch (error) {
      console.error(`❌ 显示方向指示失败:`, error);
    }
  } else if (type === 'ready') {
    console.log(`⏭️  Ready音效，跳过方向指示（no direction for ready）`);
  } else {
    console.log(`⚠️  视觉反馈被禁用: enableVisual=${enableVisual}, feedbackType=${feedbackType}`);
  }
};

// 通过inject获取选中的枪械
const selectedWeapon = inject<any>("selectedWeapon");

// 获取对应的压枪数据
const recoilData = computed(() => {
  if (selectedWeapon?.value?.id) {
    return getRecoilDataById(selectedWeapon.value.id);
  }
  return undefined;
});

// 获取当前模式的压枪动作列表
const currentPatternName = ref<string>("default");
const currentPattern = computed(() => {
  if (!recoilData.value) return [];
  const patterns = Object.keys(recoilData.value.pattern);
  if (patterns.length === 0) return [];
  return recoilData.value.pattern[currentPatternName.value] ||
         recoilData.value.pattern[patterns[0]] || [];
});

// 计算属性
const taskCount = computed(() => {
  // 如果有正在执行的压枪任务，显示动作数量，否则显示0
  if (isShooting.value && isAiming.value && currentPattern.value.length > 0) {
    return currentPattern.value.length;
  }
  return 0;
});

const config = ref<RecoilTrainingConfig>({
  duration: 60,
  feedbackType: "both",
  enableSound: true,
  enableVisual: true,
  targetAccuracy: 85,
});

// 按键绑定
const keyBindings = ref({
  fire: 'right_trigger',
  aim: 'left_trigger',
  toggle: 'a',
});

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

// 计算显示名称
const aimButtonDisplayName = computed(() => buttonDisplayNames[keyBindings.value.aim] || keyBindings.value.aim);
const fireButtonDisplayName = computed(() => buttonDisplayNames[keyBindings.value.fire] || keyBindings.value.fire);

// 训练状态
const isTraining = ref(false);
const isAiming = ref(false);
const isShooting = ref(false);
const trainingStartTime = ref<number | null>(null);
const scheduledTasks = ref<ReturnType<typeof setTimeout>[]>([]);
const gamepadPollingInterval = ref<ReturnType<typeof setTimeout> | null>(null);


// 根据绑定名称获取按键/扳机状态
const getButtonValue = (state: any, buttonName: string): number => {
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

// 游戏手柄状态检查
const checkGamepadState = async () => {
  try {
    const state = await getGamepadState(0);
    if (!state) return;

    // 检查瞄准按键是否按下
    const isAimButtonPressed = getButtonValue(state, keyBindings.value.aim) > 100; // 阈值100/255

    if (aimMode.value === 'hold') {
      // 按住模式：按下瞄准，松开取消
      if (isAimButtonPressed) {
        // 扳机按下，延迟设置瞄准状态（防抖）
        if (aimingDelayTimer.value) {
          clearTimeout(aimingDelayTimer.value);
        }
        aimingDelayTimer.value = setTimeout(() => {
          if (isAiming.value !== true) {
            isAiming.value = true;
            console.log("进入瞄准状态（按住模式）");
          }
          aimingDelayTimer.value = null;
        }, 100); // 100ms延迟
      } else {
        // 扳机释放，立即退出瞄准状态
        if (aimingDelayTimer.value) {
          clearTimeout(aimingDelayTimer.value);
          aimingDelayTimer.value = null;
        }
        if (isAiming.value !== false) {
          isAiming.value = false;
          console.log("退出瞄准状态（按住模式）");
        }
      }
    } else {
      // 切换模式：按下切换瞄准状态
      const currentAimButtonState = isAimButtonPressed;
      const wasAimButtonPressed = previousAimButtonState.value;

      // 检测按键按下事件（从释放到按下）
      if (currentAimButtonState && !wasAimButtonPressed && !aimingDelayTimer.value) {
        // 切换瞄准状态
        isAiming.value = !isAiming.value;
        console.log(`切换瞄准状态：${isAiming.value ? '进入' : '退出'}瞄准（切换模式）`);

        // 添加防抖延迟，防止重复触发
        if (aimingDelayTimer.value) {
          clearTimeout(aimingDelayTimer.value);
        }
        aimingDelayTimer.value = setTimeout(() => {
          aimingDelayTimer.value = null;
        }, 200); // 200ms防抖
      }

      // 更新前一个状态
      previousAimButtonState.value = currentAimButtonState;
    }

    // 检查开火按键是否按下（射击状态）
    const previousShooting = isShooting.value;
    isShooting.value = getButtonValue(state, keyBindings.value.fire) > 100; // 阈值100/255

    // 射击状态变化
    if (previousShooting !== isShooting.value) {
      if (isShooting.value) {
        console.log("开始射击");
        // 开始射击时启动压枪时间轴任务
        // 在按住模式下使用即时扳机状态，在切换模式下使用瞄准状态
        const canStartShooting = aimMode.value === 'hold' ? isAimButtonPressed : isAiming.value;
        if (canStartShooting && isTraining.value) {
          startRecoilTasks();
        }
      } else {
        console.log("停止射击");
        // 停止射击时清除所有定时任务
        clearScheduledTasks();
      }
    }

  } catch (error) {
    console.error("获取手柄状态失败:", error);
  }
};

// 启动压枪时间轴任务
const startRecoilTasks = () => {
  console.log('startRecoilTasks被调用');
  if (!currentPattern.value || currentPattern.value.length === 0) {
    console.warn("没有压枪数据可用");
    return;
  }

  console.log(`当前压枪模式有${currentPattern.value.length}个动作`);

  // 清除之前的任务
  clearScheduledTasks();

  trainingStartTime.value = Date.now();

  // 添加开始延迟，避免立即播放预备音频（防止音效打断）
  const START_DELAY = 100; // 毫秒
  const startDelayTaskId = setTimeout(() => {
    console.log('开始延迟计时器触发');
    // 播放预备音频
    playSound('ready');

    // 为每个压枪动作创建定时任务
    let previousTime = 0; // 之前所有动作的总持续时间
    console.log(`开始创建${currentPattern.value.length}个定时任务`);

    currentPattern.value.forEach((action: any, index: number) => {
      // 当前动作的开始时间 = 之前所有动作的总持续时间
      const startTime = previousTime;
      console.log(`任务${index}: direction=${action.direction}, duration=${action.duration}ms, startTime=${startTime}ms`);

      const taskId = setTimeout(() => {
        const elapsedTime = (Date.now() - (trainingStartTime.value || 0)) / 1000;
        console.log(`${elapsedTime.toFixed(2)}s: 开始${action.direction === 'left' ? '向左' : '向右'}压枪，持续${action.duration}ms (${index + 1}/${currentPattern.value.length})`);

        // 触发可视化或音频反馈
        if (config.value.enableVisual) {
          // 这里可以添加视觉反馈，比如高亮显示时间轴上的对应动作
          console.log(`视觉反馈: ${action.direction === 'left' ? '←' : '→'}`);
        }

        // 播放对应方向的音频和显示方向指示
        playSound(action.direction === 'left' ? 'left' : 'right');

        // 如果是最后一个任务，显示完成信息
        if (index === currentPattern.value.length - 1) {
          // 最后一个动作结束时显示完成信息
          const finishTaskId = setTimeout(() => {
            console.log("🎉 压枪时间轴任务已完成！");
          }, action.duration);
          scheduledTasks.value.push(finishTaskId);
        }
      }, startTime);

      // 累加当前动作的持续时间，用于下一个动作
      previousTime += action.duration;
      scheduledTasks.value.push(taskId);
      console.log(`任务${index}已添加到scheduledTasks, 当前任务数: ${scheduledTasks.value.length}`);
    });

    console.log(`压枪时间轴任务已启动，共${currentPattern.value.length}个动作，总时长${previousTime}ms，总任务数: ${scheduledTasks.value.length}`);
  }, START_DELAY);
  scheduledTasks.value.push(startDelayTaskId);
  console.log(`开始延迟任务已添加，当前总任务数: ${scheduledTasks.value.length}`);
};

// 清除所有定时任务
const clearScheduledTasks = () => {
  console.log(`clearScheduledTasks: 清除${scheduledTasks.value.length}个任务`);
  scheduledTasks.value.forEach(taskId => clearTimeout(taskId));
  scheduledTasks.value = [];
  console.log("已清除所有定时任务");
};

// 开始游戏手柄轮询
const startGamepadPolling = async () => {
  // 每秒检查60次，约16.7ms间隔
  gamepadPollingInterval.value = setInterval(checkGamepadState, 16);

  // 检查鼠标监听状态
  try {
    const mouseRunning = await isMouseListenerRunning();
    console.log(`游戏手柄轮询已启动 ${mouseRunning ? "鼠标监听已生效" : "鼠标监听未生效"}`);
  } catch (error) {
    console.log("游戏手柄轮询已启动 鼠标监听状态检查失败");
  }
};

// 停止游戏手柄轮询
const stopGamepadPollingHandler = async () => {
  if (gamepadPollingInterval.value) {
    clearInterval(gamepadPollingInterval.value);
    gamepadPollingInterval.value = null;
  }

  try {
    await stopGamepadPolling();
    console.log("游戏手柄轮询已停止");
  } catch (error) {
    console.error("停止手柄轮询失败:", error);
  }
};

const startTraining = async () => {
  console.log("开始训练，配置：", config.value);
  console.log("选中的枪械：", selectedWeapon?.value);
  console.log("压枪数据：", recoilData.value);

  if (!selectedWeapon?.value) {
    alert("请先选择枪械");
    return;
  }

  try {
    // 初始化手柄
    const initResult = await initGamepad();
    console.log("手柄初始化结果:", initResult);

    // 初始化鼠标监听
    try {
      await initMouseListener();
      const mouseRunning = await isMouseListenerRunning();
      console.log("鼠标监听状态:", mouseRunning ? "已启动" : "未生效");
    } catch (mouseError) {
      console.warn("鼠标监听初始化失败，但训练将继续:", mouseError);
    }

    // 显示方向指示窗口
    console.log("📺 显示方向指示窗口...");
    await showWindow();

    // 开始训练
    isTraining.value = true;
    isAiming.value = false;
    isShooting.value = false;
    previousAimButtonState.value = false;
    if (aimingDelayTimer.value) {
      clearTimeout(aimingDelayTimer.value);
      aimingDelayTimer.value = null;
    }

    // 启动手柄轮询
    await startGamepadPolling();

    alert(`训练已开始！\n请先按下${aimButtonDisplayName.value}键进入瞄准状态，然后按下${fireButtonDisplayName.value}键开始射击。`);

  } catch (error) {
    console.error("开始训练失败:", error);
    alert("启动训练失败，请检查手柄连接");
  }
};

// 停止训练
const stopTraining = async () => {
  if (!isTraining.value) return;

  isTraining.value = false;
  isAiming.value = false;
  isShooting.value = false;
  previousAimButtonState.value = false;

  // 清除瞄准状态延迟定时器
  if (aimingDelayTimer.value) {
    clearTimeout(aimingDelayTimer.value);
    aimingDelayTimer.value = null;
  }

  // 清除定时任务
  clearScheduledTasks();

  // 停止手柄轮询
  await stopGamepadPollingHandler();

  // 隐藏方向指示窗口
  console.log("📺 隐藏方向指示窗口...");
  await hideWindow();

  // 停止鼠标监听
  try {
    await stopMouseListener();
    console.log("✅ 鼠标监听已停止");
  } catch (error) {
    console.warn("⚠️ 停止鼠标监听失败，可能未初始化:", error);
  }

  console.log("训练已停止");
  alert("训练已停止");
};

// 组件加载时预加载压枪数据和按键绑定
onMounted(async () => {
  try {
    await loadRecoilData();
    console.log("压枪数据预加载完成");
  } catch (error) {
    console.error("压枪数据预加载失败:", error);
  }

  try {
    const bindings = await getKeyBindings();
    keyBindings.value = bindings;
    console.log("按键绑定加载完成:", bindings);
  } catch (error) {
    console.error("按键绑定加载失败:", error);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (isTraining.value) {
    stopTraining();
  }
});

const switchAimMode = (mode: 'hold' | 'toggle') => {
  if (aimMode.value === mode) return;
  aimMode.value = mode;
  // 重置瞄准相关状态
  isAiming.value = false;
  previousAimButtonState.value = false;
  if (aimingDelayTimer.value) {
    clearTimeout(aimingDelayTimer.value);
    aimingDelayTimer.value = null;
  }
};

const resetConfig = () => {
  config.value = {
    duration: 60,
    feedbackType: "both",
    enableSound: true,
    enableVisual: true,
    targetAccuracy: 85,
  };
  aimMode.value = 'hold';
  previousAimButtonState.value = false;
  if (aimingDelayTimer.value) {
    clearTimeout(aimingDelayTimer.value);
    aimingDelayTimer.value = null;
  }
};

</script>

<template>
  <div class="recoil-settings">
    <!-- 枪械信息卡片 -->
    <div class="weapon-info-card" v-if="selectedWeapon?.value">
      <div class="weapon-header">
        <img :src="selectedWeapon.value.icon" :alt="selectedWeapon.value.name" class="weapon-avatar" />
        <div class="weapon-text">
          <h3>{{ selectedWeapon.value.name }}</h3>
          <p class="weapon-type">{{ { rifle: '步枪', smg: '冲锋枪', lmg: '轻机枪', pistol: '手枪', sniper: '狙击枪', shotgun: '霰弹枪' }[selectedWeapon.value.type as string] }}</p>
        </div>
      </div>
      <div class="weapon-stats">
        <div class="stat-item">
          <span class="stat-label">射速</span>
          <span class="stat-value">{{ selectedWeapon.value.fireRate }}</span>
          <span class="stat-bar">
            <span class="bar-fill" :style="{ width: selectedWeapon.value.fireRate * 4 + '%' }"></span>
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">伤害</span>
          <span class="stat-value">{{ selectedWeapon.value.damage }}</span>
          <span class="stat-bar">
            <span class="bar-fill" :style="{ width: selectedWeapon.value.damage * 1.5 + '%' }"></span>
          </span>
        </div>
      </div>
    </div>

    <div class="settings-header">
      <h2>⚙️ 压枪训练设置</h2>
      <p class="subtitle">根据你的需求自定义训练模式</p>
    </div>

    <div class="settings-content">

      <!-- 压枪模式选择 -->
      <div class="setting-group" v-if="recoilData && Object.keys(recoilData.pattern).length > 1">
        <label class="setting-label">压枪模式</label>
        <div class="pattern-mode-options">
          <button
            v-for="mode in Object.keys(recoilData.pattern)"
            :key="mode"
            class="mode-btn"
            :class="{ active: currentPatternName === mode }"
            @click="currentPatternName = mode"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <!-- 压枪时间轴 -->
      <div class="setting-group" v-if="currentPattern.length > 0">
        <label class="setting-label">压枪时间轴</label>
        <div class="recoil-timeline">
          <div v-for="(action, index) in currentPattern" :key="index" class="timeline-item">
            <div class="timeline-time">{{ (action.duration / 1000).toFixed(2) }}s</div>
            <div
              class="timeline-bar"
              :class="action.direction === 'left' ? 'direction-left' : 'direction-right'"
              :style="{ width: Math.min(action.duration / 100, 100) + '%' }"
            >
              <span class="direction-arrow">{{ action.direction === 'left' ? '←' : '→' }}</span>
            </div>
          </div>
          <div class="timeline-total">
            总时长: {{ (currentPattern.reduce((sum: number, a: any) => sum + a.duration, 0) / 1000).toFixed(2) }}s
          </div>
        </div>
      </div>



      <!-- 反馈选项 -->
      <div class="setting-group">
        <label class="setting-label">反馈方式</label>
        <div class="feedback-options">
          <label class="feedback-item">
            <input
              v-model="config.enableVisual"
              type="checkbox"
              class="checkbox"
            />
            <span class="checkbox-label">✨ 可视反馈</span>
          </label>
          <label class="feedback-item">
            <input
              v-model="config.enableSound"
              type="checkbox"
              class="checkbox"
            />
            <span class="checkbox-label">🔊 音频反馈</span>
          </label>
        </div>
      </div>

      <!-- 反馈类型 -->
      <div class="setting-group">
        <label class="setting-label">反馈类型</label>
        <div class="feedback-type-options">
          <button
            v-for="type in ['visual', 'audio', 'both']"
            :key="type"
            class="type-btn"
            :class="{ active: config.feedbackType === type }"
            @click="config.feedbackType = type as any"
            :disabled="
              (type === 'visual' && !config.enableVisual) ||
              (type === 'audio' && !config.enableSound)
            "
          >
            {{ { visual: '仅可视', audio: '仅音频', both: '双重反馈' }[type] }}
          </button>
        </div>
      </div>

      <!-- 瞄准模式 -->
      <div class="setting-group">
        <label class="setting-label">瞄准模式</label>
        <div class="feedback-type-options">
          <button
            v-for="mode in ['hold', 'toggle']"
            :key="mode"
            class="type-btn"
            :class="{ active: aimMode === mode }"
            @click="switchAimMode(mode as 'hold' | 'toggle')"
          >
            {{ { hold: '按住模式', toggle: '切换模式' }[mode] }}
          </button>
        </div>
      </div>

      <!-- 训练状态显示 -->
      <div class="training-status" v-if="isTraining">
        <div class="status-header">
          <h4>🎯 训练状态</h4>
          <span class="status-badge" :class="{ active: isTraining }">
            {{ isTraining ? '训练中' : '未开始' }}
          </span>
        </div>
        <div class="status-indicators">
          <div class="status-item">
            <span class="status-label">瞄准状态:</span>
            <span class="status-value" :class="{ active: isAiming }">
              {{ isAiming ? '🔫 已瞄准' : '❌ 未瞄准' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">射击状态:</span>
            <span class="status-value" :class="{ active: isShooting }">
              {{ isShooting ? '🔥 射击中' : '⏸️ 未射击' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">任务数量:</span>
            <span class="status-value">{{ taskCount }}</span>
          </div>
        </div>
        <div class="status-instruction">
          <p v-if="!isAiming">1. 按下 <strong>{{ aimButtonDisplayName }}</strong> 键进入瞄准状态</p>
          <p v-if="isAiming && !isShooting">2. 按下 <strong>{{ fireButtonDisplayName }}</strong> 键开始射击训练</p>
          <p v-if="isShooting">3. 根据压枪提示进行练习</p>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="action-buttons">
        <button v-if="!isTraining" class="btn btn-primary" @click="startTraining">
          🚀 开始训练
        </button>
        <button v-else class="btn btn-stop" @click="stopTraining">
          ⏹️ 停止训练
        </button>
        <button class="btn btn-secondary" @click="resetConfig">
          ↺ 重置设置
        </button>
      </div>

      <!-- 训练提示 -->
      <div class="training-tips">
        <h4>💡 训练提示</h4>
        <ul>
          <li>从简单难度开始，逐步提升</li>
          <li>长期坚持才能看到显著进步</li>
          <li>使用双重反馈获得最佳学习效果</li>
          <li>每天训练 15-30 分钟最佳</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recoil-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow-y: auto;
}

/* 枪械信息卡片 */
.weapon-info-card {
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea10, #764ba210);
  border-bottom: 2px solid #e0e0e0;
}

.weapon-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.weapon-avatar {
  width: 60px;
  height: 60px;
  object-fit: contain;
  flex-shrink: 0;
}

.weapon-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.weapon-type {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #888;
}

.weapon-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.stat-label {
  min-width: 30px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  min-width: 24px;
  text-align: right;
  color: #667eea;
  font-weight: 700;
}

.stat-bar {
  flex: 1;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

/* 横移模式 */
.horizontal-pattern {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pattern-item {
  display: grid;
  grid-template-columns: 30px 1fr 30px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.pattern-label {
  text-align: center;
  color: #999;
  font-weight: 600;
}

.pattern-bar-container {
  display: flex;
  align-items: center;
  height: 24px;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 0 2px;
}

.pattern-bar-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}

.pattern-bar {
  height: 100%;
  border-radius: 2px;
  flex-shrink: 0;
}

.pattern-left {
  background: linear-gradient(90deg, #42a5f5, #64b5f6);
  margin-left: auto;
}

.pattern-right {
  background: linear-gradient(90deg, #ef5350, #e53935);
  margin-right: auto;
}

.pattern-direction {
  text-align: center;
  color: #666;
  font-weight: 600;
  font-size: 14px;
}

/* 压枪模式按钮 */
.pattern-mode-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 6px 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: capitalize;
}

.mode-btn:hover {
  border-color: #667eea;
  background-color: #f9f9f9;
}

.mode-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

/* 压枪时间轴 */
.recoil-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 50px 1fr;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.timeline-time {
  text-align: right;
  color: #999;
  font-weight: 600;
}

.timeline-bar {
  height: 24px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
}

.timeline-bar.direction-left {
  background: linear-gradient(90deg, #42a5f5, #64b5f6);
  margin-left: auto;
}

.timeline-bar.direction-right {
  background: linear-gradient(90deg, #ef5350, #e53935);
}

.direction-arrow {
  color: white;
  font-weight: 700;
  font-size: 12px;
}

.timeline-total {
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.settings-header {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.subtitle {
  margin: 0;
  font-size: 13px;
  color: #888;
}

.settings-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value {
  font-size: 12px;
  color: #667eea;
  font-weight: 700;
}


/* 滑块 */
.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #667eea, #764ba2);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid #667eea;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid #667eea;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.accuracy-desc {
  font-size: 11px;
  color: #667eea;
  font-weight: 500;
}

/* 反馈选项 */
.feedback-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.feedback-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-label {
  font-size: 12px;
  color: #333;
  user-select: none;
}

/* 反馈类型 */
.feedback-type-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.type-btn {
  padding: 8px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover:not(:disabled) {
  border-color: #667eea;
  background-color: #f9f9f9;
}

.type-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 按钮 */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn {
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #eee;
  border-color: #bbb;
}

.btn-stop {
  background: linear-gradient(135deg, #ef5350, #e53935);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
}

.btn-stop:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 83, 80, 0.4);
}

/* 训练状态 */
.training-status {
  padding: 16px;
  background: linear-gradient(135deg, #667eea08, #764ba208);
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 12px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #f5f5f5;
  color: #888;
  border: 1px solid #e0e0e0;
}

.status-badge.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
}

.status-indicators {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.status-label {
  color: #666;
  font-weight: 500;
}

.status-value {
  color: #888;
  font-weight: 600;
}

.status-value.active {
  color: #667eea;
}

.status-instruction {
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea10, #764ba210);
  border-radius: 4px;
  font-size: 11px;
}

.status-instruction p {
  margin: 4px 0;
  color: #666;
}

.status-instruction strong {
  color: #667eea;
  font-weight: 700;
}

/* 训练提示 */
.training-tips {
  padding: 12px;
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.training-tips h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

.training-tips ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #666;
}

.training-tips li {
  margin: 4px 0;
}
</style>

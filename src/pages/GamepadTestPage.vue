<script setup lang="ts">
/**
 * pages/GamepadTestPage.vue - 手柄测试页面
 */
import { ref, onMounted, onUnmounted } from "vue";
import { gamepadService } from "@/services";
import {
  ControllerCard,
  StickVisualizer,
  TriggerBar,
  ButtonDisplay,
} from "@/components";
import type { ControllerState } from "@/types";

// 状态
const isPolling = ref(false);
const statusMessage = ref("");
const controllerStates = ref<(ControllerState | null)[]>([null, null, null, null]);

let pollingInterval: number | null = null;

// 初始化手柄
async function initGamepad() {
  try {
    const result = await gamepadService.initGamepad();
    statusMessage.value = result;
    isPolling.value = true;

    // 开始定期获取状态
    startPolling();
  } catch (error) {
    statusMessage.value = `初始化失败: ${error}`;
  }
}

// 启动轮询
function startPolling() {
  if (pollingInterval) return;

  pollingInterval = window.setInterval(async () => {
    for (let i = 0; i < 4; i++) {
      try {
        const state = await gamepadService.getGamepadState(i);
        controllerStates.value[i] = state;
      } catch {
        controllerStates.value[i] = null;
      }
    }
  }, 16); // 约 60fps
}

// 停止监听
async function stopPolling() {
  try {
    const result = await gamepadService.stopGamepadPolling();
    statusMessage.value = result;
    isPolling.value = false;

    if (pollingInterval) {
      window.clearInterval(pollingInterval);
      pollingInterval = null;
    }
  } catch (error) {
    statusMessage.value = `停止失败: ${error}`;
  }
}

// 页面加载时初始化
onMounted(async () => {
  const initialized = await gamepadService.isGamepadInitialized();
  if (!initialized) {
    await initGamepad();
  } else {
    isPolling.value = true;
    statusMessage.value = "已初始化";
    startPolling();
  }
});

// 清理
onUnmounted(() => {
  if (pollingInterval) {
    window.clearInterval(pollingInterval);
  }
});
</script>

<template>
  <div class="gamepad-test-page">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="panel-content">
        <div class="button-group">
          <button @click="initGamepad" :disabled="isPolling" class="btn btn-primary">
            🔌 初始化
          </button>
          <button @click="stopPolling" :disabled="!isPolling" class="btn btn-danger">
            ⏹️ 停止
          </button>
        </div>
        <div class="status-info">
          <span class="status-badge" :class="{ active: isPolling }">
            {{ isPolling ? "运行中" : "已停止" }}
          </span>
          <span class="status-message">{{ statusMessage }}</span>
        </div>
      </div>
    </div>

    <!-- 手柄状态网格 -->
    <div class="controllers-grid">
      <ControllerCard v-for="(state, index) in controllerStates" :key="index" :index="index"
        :state="state">
        <template #default="{ state: controllerState }">
          <!-- 摇杆区域 -->
          <div class="sticks-section">
            <StickVisualizer label="左摇杆" :x="controllerState.left_stick_x"
              :y="controllerState.left_stick_y" />
            <StickVisualizer label="右摇杆" :x="controllerState.right_stick_x"
              :y="controllerState.right_stick_y" />
          </div>

          <!-- 扳机区域 -->
          <div class="triggers-section">
            <TriggerBar label="LT" :value="controllerState.left_trigger" />
            <TriggerBar label="RT" :value="controllerState.right_trigger" />
          </div>

          <!-- 按键区域 -->
          <ButtonDisplay :buttons="controllerState.buttons" />
        </template>
      </ControllerCard>
    </div>
  </div>
</template>

<style scoped>
.gamepad-test-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 控制面板 */
.control-panel {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 18px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.btn-danger {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 87, 108, 0.5);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  transition: all 0.3s ease;
}

.status-badge.active {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
}

.status-message {
  font-size: 13px;
  color: #666;
  flex: 1;
}

/* 手柄网格 */
.controllers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

/* 内容区域 */
.sticks-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.triggers-section {
  display: flex;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-content {
    flex-direction: column;
    align-items: stretch;
  }

  .button-group {
    width: 100%;
  }

  .btn {
    flex: 1;
  }

  .status-info {
    width: 100%;
  }

  .controllers-grid {
    grid-template-columns: 1fr;
  }
}
</style>

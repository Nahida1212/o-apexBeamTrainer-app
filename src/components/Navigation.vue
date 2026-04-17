<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { useMouseListener } from '@/composables';
import type { MouseState } from '@/types';

const route = useRoute();
const router = useRouter();

// 鼠标状态 - 默认设置为空闲状态
const mouseState = ref<MouseState>('idle');

// 尝试使用鼠标监听器，如果失败则使用默认值
try {
  const mouseListener = useMouseListener();
  mouseState.value = mouseListener.mouseState.value;
} catch (error) {
  console.warn('无法加载鼠标监听器，使用默认状态:', error);
}

const go = (name: string) => {
  router.push({ name });
};

// 鼠标状态对应的样式和文本
const mouseStateConfig = {
  idle: { icon: '🖱️', text: '空闲', color: '#888', bgColor: '#f0f0f0' },
  aiming: { icon: '🎯', text: '瞄准', color: '#f59e0b', bgColor: '#fef3c7' },
  shooting: { icon: '🔫', text: '射击', color: '#ef4444', bgColor: '#fee2e2' },
} as const;

const getMouseStateDisplay = (state: MouseState) => {
  return mouseStateConfig[state] || mouseStateConfig.idle;
};
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-left">
        <h1 class="nav-title">⚙️ RecoilLab</h1>
        <p class="nav-subtitle">借助音频与可视提示练习武器的横移压枪</p>
      </div>
      <div class="nav-right">
        <!-- 鼠标状态显示 -->
        <div
          class="mouse-state-display"
          :style="{
            '--state-color': getMouseStateDisplay(mouseState).color,
            '--state-bg': getMouseStateDisplay(mouseState).bgColor,
          }"
        >
          <span class="mouse-icon">{{ getMouseStateDisplay(mouseState).icon }}</span>
          <span class="mouse-text">{{ getMouseStateDisplay(mouseState).text }}</span>
        </div>

        <button
          class="nav-link"
          :class="{ active: route.name === 'home' }"
          @click="go('home')"
        >
          🏠 主页
        </button>
        <button
          class="nav-link"
          :class="{ active: route.name === 'gamepad' }"
          @click="go('gamepad')"
        >
          🎮 手柄测试
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.nav-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-subtitle {
  margin: 0;
  font-size: 12px;
  color: #888;
}

.nav-right {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background-color: #f0f0f0;
  color: #333;
}

/* 鼠标状态显示 */
.mouse-state-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--state-bg, #f0f0f0);
  color: var(--state-color, #888);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
}

.mouse-icon {
  font-size: 14px;
}

.mouse-text {
  font-weight: 600;
}

.nav-link.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}
</style>

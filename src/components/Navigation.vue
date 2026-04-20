<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { getKeyBindings } from '@/services/settingService';

const route = useRoute();
const router = useRouter();


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

// 计算绑定显示文本
const bindingDisplayText = computed(() => {
  const fire = buttonDisplayNames[keyBindings.value.fire] || keyBindings.value.fire;
  const aim = buttonDisplayNames[keyBindings.value.aim] || keyBindings.value.aim;
  const toggle = buttonDisplayNames[keyBindings.value.toggle] || keyBindings.value.toggle;
  return `开火:${fire} 瞄准:${aim} 开关:${toggle}`;
});

// 短版本显示（用于按钮）
const bindingShortText = computed(() => '绑定快捷');


// 加载按键绑定
onMounted(async () => {
  try {
    const bindings = await getKeyBindings();
    keyBindings.value = bindings;
    console.log('按键绑定加载完成:', bindings);
  } catch (error) {
    console.error('按键绑定加载失败:', error);
  }
});

const go = (name: string) => {
  router.push({ name });
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
        <!-- 绑定快捷按钮 -->
        <button
          class="binding-shortcut-btn"
          :class="{ active: route.name === 'binding' }"
          :title="bindingDisplayText"
          @click="go('binding')"
        >
          {{ bindingShortText }}
        </button>

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

/* 绑定快捷按钮 */
.binding-shortcut-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #f0f0f0;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
}

.binding-shortcut-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.binding-shortcut-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
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

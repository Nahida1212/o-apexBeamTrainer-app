<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

const direction = ref<'left' | 'right' | 'none'>('none')
const message = ref('')

onMounted(async () => {
  console.log('DirectionOverlayPage mounted, 开始获取窗口...')
  try {
    const appWindow = await WebviewWindow.getByLabel('direction-overlay')

    if (!appWindow) {
      console.error('无法获取方向指示窗口')
      return
    }

    console.log('成功获取方向指示窗口:', appWindow)

    // 监听Tauri事件
    const unlistenShow = await appWindow.listen<{dir: 'left' | 'right', msg: string, duration: number}>('show-direction', (event: any) => {
      console.log('👂 收到show-direction事件:', event.payload)
      const { dir, msg } = event.payload
      direction.value = dir
      message.value = msg || (dir === 'left' ? '← 向左压枪' : '→ 向右压枪')
      console.log(`📺 显示方向: ${dir}, 消息: ${message.value}`)
    })
    console.log('✅ show-direction事件监听器已注册')

    // 清理函数
    return () => {
      console.log('🧹 DirectionOverlayPage清理中...')
      unlistenShow()
    }
  } catch (error) {
    console.error('DirectionOverlayPage初始化失败:', error)
  }
})
</script>

<template>
  <div class="overlay-page">
    <div v-if="direction === 'left'" class="direction-left">
      <div class="direction-arrow">←</div>
      <div class="direction-text">{{ message }}</div>
    </div>
    <div v-else-if="direction === 'right'" class="direction-right">
      <div class="direction-arrow">→</div>
      <div class="direction-text">{{ message }}</div>
    </div>
  </div>
</template>

<style scoped>
.overlay-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  background: transparent;
  pointer-events: none;
  z-index: 9999;
}

.direction-left,
.direction-right {
  padding: 20px 30px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
}

.overlay-page.visible .direction-left,
.overlay-page.visible .direction-right {
  opacity: 1;
  transition: opacity 0.15s ease-in;
}

.direction-left {
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.25), rgba(100, 181, 246, 0.25));
  border: 2px solid rgba(66, 165, 245, 0.7);
  box-shadow: 0 4px 20px rgba(66, 165, 245, 0.3);
}

.direction-right {
  background: linear-gradient(135deg, rgba(239, 83, 80, 0.25), rgba(229, 57, 53, 0.25));
  border: 2px solid rgba(239, 83, 80, 0.7);
  box-shadow: 0 4px 20px rgba(239, 83, 80, 0.3);
}

.direction-arrow {
  font-size: 60px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: subtle-bounce 0.8s ease-in-out infinite alternate;
}

.direction-text {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

@keyframes subtle-bounce {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}
</style>
/**
 * composables/useDirectionOverlay.ts
 * 方向叠加层状态管理
 */

import { ref, readonly, computed } from 'vue'

interface OverlayState {
  visible: boolean
  direction: 'left' | 'right' | 'none'
  message: string
}

const overlayState = ref<OverlayState>({
  visible: false,
  direction: 'none',
  message: ''
})

let hideTimer: ReturnType<typeof setTimeout> | null = null

export function useDirectionOverlay() {
  const showDirection = (direction: 'left' | 'right', duration: number = 1000) => {
    // 清除之前的定时器
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    // 更新状态
    overlayState.value = {
      visible: true,
      direction,
      message: direction === 'left' ? '← 向左压枪' : '→ 向右压枪'
    }

    // 设置自动隐藏
    hideTimer = setTimeout(() => {
      overlayState.value.visible = false
      hideTimer = null
    }, duration)
  }

  const hideDirection = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    overlayState.value.visible = false
  }

  const state = computed(() => readonly(overlayState.value))

  return {
    state,
    showDirection,
    hideDirection
  }
}
/**
 * composables/useMouseListener.ts
 * 鼠标输入监听管理（基于Rust后端）
 */

import { ref, onUnmounted } from 'vue'
import type { MouseState } from '@/types'
import {
  initMouseListener,
  stopMouseListener,
  getMouseState,
  isMouseListenerRunning
} from '@/services/mouseService'

/**
 * Vue 3 Composable - 鼠标监听（Rust后端）
 * @example
 * const { mouseState, startListening, stopListening, getCurrentState } = useMouseListener()
 *
 * // 启动监听
 * onMounted(() => {
 *   startListening()
 * })
 *
 * // 停止监听
 * onUnmounted(() => {
 *   stopListening()
 * })
 */
export function useMouseListener() {
  const mouseState = ref<MouseState>('idle')
  const isListening = ref(false)
  const pollingInterval = ref<number | null>(null)
  const pollingIntervalMs = 50 // 轮询间隔（毫秒）

  /**
   * 启动鼠标监听
   */
  const startListening = async (): Promise<void> => {
    if (isListening.value) {
      console.warn('鼠标监听已在运行中')
      return
    }

    try {
      console.log('🖱️ 初始化鼠标监听器...')
      const result = await initMouseListener()
      console.log('✅ 鼠标监听器初始化结果:', result)

      // 启动轮询以更新状态
      pollingInterval.value = window.setInterval(async () => {
        try {
          const state = await getMouseState()
          mouseState.value = state
        } catch (error) {
          console.error('❌ 获取鼠标状态失败:', error)
        }
      }, pollingIntervalMs)

      isListening.value = true
      console.log('✅ 鼠标监听已启动')
    } catch (error) {
      console.error('❌ 启动鼠标监听失败:', error)
      throw error
    }
  }

  /**
   * 停止鼠标监听
   */
  const stopListening = async (): Promise<void> => {
    if (!isListening.value) {
      console.warn('鼠标监听未运行')
      return
    }

    try {
      // 停止轮询
      if (pollingInterval.value !== null) {
        window.clearInterval(pollingInterval.value)
        pollingInterval.value = null
      }

      // 停止Rust监听器
      const result = await stopMouseListener()
      console.log('✅ 鼠标监听器停止结果:', result)

      isListening.value = false
      mouseState.value = 'idle'
      console.log('✅ 鼠标监听已停止')
    } catch (error) {
      console.error('❌ 停止鼠标监听失败:', error)
      throw error
    }
  }

  /**
   * 获取当前鼠标状态（手动调用）
   */
  const getCurrentState = async (): Promise<MouseState> => {
    try {
      const state = await getMouseState()
      mouseState.value = state
      return state
    } catch (error) {
      console.error('❌ 获取鼠标状态失败:', error)
      throw error
    }
  }

  /**
   * 检查鼠标监听是否正在运行
   */
  const checkIsRunning = async (): Promise<boolean> => {
    try {
      return await isMouseListenerRunning()
    } catch (error) {
      console.error('❌ 检查鼠标监听状态失败:', error)
      return false
    }
  }

  // 自动清理
  onUnmounted(() => {
    if (pollingInterval.value !== null) {
      window.clearInterval(pollingInterval.value)
    }
    if (isListening.value) {
      // 注意：这里不等待异步停止，因为onUnmounted中不能有异步操作
      stopMouseListener().catch(console.error)
    }
  })

  return {
    // 响应式状态
    mouseState,
    isListening,

    // 方法
    startListening,
    stopListening,
    getCurrentState,
    checkIsRunning,
  }
}
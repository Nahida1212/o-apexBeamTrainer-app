/**
 * composables/useDirectionWindow.ts
 * 方向指示窗口通信管理
 */

import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

class DirectionWindowManager {
  private overlayWindow: WebviewWindow | null = null
  private isInitialized = false

  /**
   * 初始化方向指示窗口
   */
  async init() {
    if (this.isInitialized) return

    try {
      console.log('开始初始化方向指示窗口...')
      
      let window: WebviewWindow | null = null
      try {
        window = await WebviewWindow.getByLabel('direction-overlay')
        if (window) {
          console.log('✅ 获取已存在的direction-overlay窗口成功')
        }
      } catch (e) {
        console.log('tauri.conf.json中未定义direction-overlay窗口，将尝试新建')
      }

      if (!window) {
        console.log('⚠️ direction-overlay窗口不存在，尝试新建...')
        try {
          const newWindow = new WebviewWindow('direction-overlay', {
            url: import.meta.env.DEV 
              ? 'http://localhost:1420/#/direction-overlay'
              : 'index.html#/direction-overlay',
            width: 600,
            height: 200,
            alwaysOnTop: true,
            decorations: false,
            transparent: false,
            resizable: false,
            skipTaskbar: true,
            focus: false,
            visible: false,
            center: false,
            x: 100,
            y: 100,
          })
          
          // 等待窗口创建完成
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.log('窗口创建等待超时')
              resolve()
            }, 2000)
            
            newWindow.once('tauri://created', () => {
              clearTimeout(timeout)
              resolve()
            })
          })
          
          window = newWindow
          console.log('🎉 新建direction-overlay窗口完成')
        } catch (error) {
          console.error('❌ 新建direction-overlay窗口失败:', error)
          throw error
        }
      }

      if (window) {
        this.overlayWindow = window
        console.log('✅ 方向指示窗口已获取')
        this.isInitialized = true
        console.log('✅ 方向指示窗口已初始化完成')
      } else {
        throw new Error('无法创建或获取方向指示窗口')
      }
    } catch (error) {
      console.error('❌ 初始化方向指示窗口失败:', error)
    }
  }

  /**
   * 显示方向指示
   */
  async showDirection(direction: 'left' | 'right', duration: number = 800) {
    console.log(`showDirection被调用: direction=${direction}, duration=${duration}`)

    if (!this.overlayWindow) {
      console.error('❌ 窗口未初始化，无法发送事件')
      return
    }

    try {
      console.log('📤 发送show-direction事件到方向窗口')
      // 显示窗口
      await this.overlayWindow.show()
      
      // 使用Tauri的emit方法发送事件
      await this.overlayWindow.emit('show-direction', {
        dir: direction,
        msg: direction === 'left' ? '← 向左走位' : '→ 向右走位',
        duration
      })

      console.log(`✅ 显示方向指示成功: ${direction}`)
      
      // 设定时间后关闭窗口
      setTimeout(async () => {
        try {
          await this.overlayWindow?.hide()
          console.log(`⏱️ ${duration}ms 后隐藏窗口`)
        } catch (error) {
          console.error('❌ 隐藏窗口失败:', error)
        }
      }, duration)
    } catch (error) {
      console.error('❌ 显示方向指示失败:', error)
    }
  }

  /**
   * 显示方向指示窗口（在开始训练时调用）
   */
  async showWindow() {
    if (!this.overlayWindow) {
      console.log('🪟 窗口未初始化，先初始化...')
      await this.init()
    }

    if (!this.overlayWindow) {
      console.error('❌ 无法初始化窗口')
      return
    }

    try {
      console.log('🪟 显示方向指示窗口')
      await this.overlayWindow.show()
    } catch (error) {
      console.error('❌ 显示窗口失败:', error)
    }
  }

  /**
   * 隐藏方向指示（触发事件，由页面自己隐藏）
   */
  async hide() {
    if (!this.overlayWindow || !this.isInitialized) return

    try {
      await this.overlayWindow.emit('hide-direction', {})
    } catch (error) {
      console.error('隐藏方向指示窗口失败:', error)
    }
  }

  /**
   * 隐藏方向指示窗口（在停止训练时调用）
   */
  async hideWindow() {
    if (!this.overlayWindow) return

    try {
      console.log('🪟 隐藏方向指示窗口')
      await this.overlayWindow.hide()
    } catch (error) {
      console.error('❌ 隐藏窗口失败:', error)
    }
  }

  /**
   * 关闭方向指示窗口
   */
  async close() {
    if (!this.overlayWindow || !this.isInitialized) return

    try {
      await this.overlayWindow.close()
      this.overlayWindow = null
      this.isInitialized = false
    } catch (error) {
      console.error('关闭方向指示窗口失败:', error)
    }
  }
}

// 创建单例
const directionWindowManager = new DirectionWindowManager()

export function useDirectionWindow() {
  return {
    init: directionWindowManager.init.bind(directionWindowManager),
    showWindow: directionWindowManager.showWindow.bind(directionWindowManager),
    hideWindow: directionWindowManager.hideWindow.bind(directionWindowManager),
    showDirection: directionWindowManager.showDirection.bind(directionWindowManager),
    hide: directionWindowManager.hide.bind(directionWindowManager),
    close: directionWindowManager.close.bind(directionWindowManager),
  }
}
<script setup lang="ts">
/**
 * App.vue - 应用根组件，支持页面切换
 */
import { ref, onMounted } from "vue";
import { Window } from "@tauri-apps/api/window";
import { MainLayout } from "@/layouts";
import { loadRecoilData } from "@/services/recoilDataService";
import { getSettings } from "@/services/settingService";

// 当前窗口标签
const windowLabel = ref<string>("main");

// 应用启动时获取窗口标签并加载数据
onMounted(async () => {
  try {
    const appWindow = Window.getCurrent();
    const label = await appWindow.label;
    windowLabel.value = label;
    console.log(`当前窗口标签: ${label}`);

    // 只有主窗口需要加载压枪数据
    if (label === "main") {
      await loadRecoilData();
      // 初始化设置（创建默认setting.json）
      try {
        await getSettings();
      } catch (error) {
        console.error('初始化设置失败:', error);
      }
    }
  } catch (error) {
    console.error("获取窗口标签失败:", error);
    // 默认为主窗口
    windowLabel.value = "main";
    await loadRecoilData();
  }
});
</script>

<template>
  <div :class="['app-container', `window-${windowLabel}`]">
    <MainLayout v-if="windowLabel === 'main'" />
    <router-view v-else />
  </div>
</template>

<style>
html,
body,
#app {
  background-color: transparent !important;
  background: transparent !important;
}

:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  background: #f5f5f5;
  color: #333;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #999;
}

.app-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 方向指示窗口的特殊样式 */
.window-direction-overlay {
  background: transparent !important;
}

.window-direction-overlay body,
.window-direction-overlay #app {
  background: transparent !important;
}
</style>

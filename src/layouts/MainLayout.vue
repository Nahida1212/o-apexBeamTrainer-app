<script setup lang="ts">
import { Navigation } from "@/components";
</script>

<template>
  <div class="main-layout">
    <!-- 导航栏 -->
    <Navigation />

    <!-- 内容区域 -->
    <main class="layout-main">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="layout-footer">
      <p>&copy; 2026 RecoilLab. Built with Tauri + Vue 3 | 借助音频与可视提示练习武器的横移压枪</p>
    </footer>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.layout-main {
  flex: 1;
  overflow: auto;
}

.layout-footer {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 20px;
  text-align: center;
  font-size: 11px;
  color: #999;
}

.layout-footer p {
  margin: 0;
}
</style>



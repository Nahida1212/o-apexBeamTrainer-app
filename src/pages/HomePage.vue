<script setup lang="ts">
/**
 * pages/HomePage.vue - 主页面
 */
import { ref, provide } from "vue";
import WeaponList from "@/components/WeaponList.vue";
import RecoilSettings from "@/components/RecoilSettings.vue";
import type { Weapon } from "@/types";

// 布局状态
const sidebarWidth = ref(280);
const isDragging = ref(false);

// 选中的枪械 - 由WeaponList控制
const selectedWeapon = ref<Weapon | null>(null);

// 通过provide向RecoilSettings提供选中的枪械
provide("selectedWeapon", selectedWeapon);

const startResize = () => {
  isDragging.value = true;
};

const stopResize = () => {
  isDragging.value = false;
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const container = document.querySelector(".home-container") as HTMLElement;
  if (!container) return;

  const newWidth = e.clientX - container.getBoundingClientRect().left;
  if (newWidth >= 200 && newWidth <= 400) {
    sidebarWidth.value = newWidth;
  }
};

const updateSelectedWeapon = (weapon: Weapon) => {
  console.log("选中枪械更新:", weapon.name);
  selectedWeapon.value = weapon;
};
</script>

<template>
  <div
    class="home-container"
    @mousemove="onMouseMove"
    @mouseup="stopResize"
    @mouseleave="stopResize"
  >
    <!-- 左侧边栏 -->
    <div class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <WeaponList @update:weapon="updateSelectedWeapon" />
    </div>

    <!-- 分割线 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
      :class="{ dragging: isDragging }"
    ></div>

    <!-- 右侧内容 -->
    <div class="main-content">
      <RecoilSettings />
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  height: 100%;
  background: white;
  user-select: none;
}

.sidebar {
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.resize-handle:hover,
.resize-handle.dragging {
  background-color: #667eea;
}

.main-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    flex-direction: column;
  }

  .sidebar {
    height: 200px !important;
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .resize-handle {
    display: none;
  }

  .main-content {
    flex: 1;
  }
}
</style>

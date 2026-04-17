<script setup lang="ts">
import { useDirectionOverlay } from '@/composables/useDirectionOverlay'

const { state } = useDirectionOverlay()
</script>

<template>
  <transition name="fade">
    <div
      v-if="state.visible"
      class="direction-overlay"
      :class="`direction-${state.direction}`"
    >
      <div class="overlay-content">
        <div class="direction-arrow" v-if="state.direction === 'left'">←</div>
        <div class="direction-arrow" v-else-if="state.direction === 'right'">→</div>
        <div class="direction-text">{{ state.message }}</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.direction-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none; /* 允许鼠标穿透 */
  background: rgba(0, 0, 0, 0.2); /* 半透明背景，突出显示 */
}

.direction-left .overlay-content {
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.9), rgba(100, 181, 246, 0.9));
  border-left: 8px solid #42a5f5;
}

.direction-right .overlay-content {
  background: linear-gradient(135deg, rgba(239, 83, 80, 0.9), rgba(229, 57, 53, 0.9));
  border-right: 8px solid #ef5350;
}

.overlay-content {
  padding: 40px 60px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 300px;
  min-height: 200px;
  backdrop-filter: blur(10px);
  animation: pulse 2s infinite alternate;
}

.direction-arrow {
  font-size: 120px;
  font-weight: bold;
  color: white;
  margin-bottom: 20px;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: bounce 0.8s infinite alternate;
}

.direction-text {
  font-size: 36px;
  font-weight: 700;
  color: white;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

/* 动画效果 */
@keyframes bounce {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
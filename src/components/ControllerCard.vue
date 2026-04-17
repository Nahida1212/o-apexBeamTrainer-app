<script setup lang="ts">
import type { ControllerState } from "@/types";

interface Props {
  index: number;
  state: ControllerState | null;
}

withDefaults(defineProps<Props>(), {});
</script>

<template>
  <div class="controller-card" :class="{ connected: state !== null }">
    <h2>手柄 {{ index }}</h2>
    <div v-if="state" class="controller-content">
      <slot :state="state"></slot>
    </div>
    <div v-else class="not-connected">
      未连接
    </div>
  </div>
</template>

<style scoped>
.controller-card {
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.controller-card.connected {
  border-color: #4caf50;
  background-color: #e8f5e9;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.controller-card h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.not-connected {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

.controller-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

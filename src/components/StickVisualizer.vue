<script setup lang="ts">
import { computed } from "vue";
import { formatStickValue, getStickPosition } from "@/utils";

interface Props {
  label: string;
  x: number;
  y: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: "摇杆",
});

const position = computed(() => getStickPosition(props.x, props.y));
</script>

<template>
  <div class="stick-container">
    <div class="stick-label">{{ label }}</div>
    <div class="stick-area">
      <div class="stick-dot" :style="{ left: position.left, top: position.top }"></div>
    </div>
    <div class="stick-values">
      <div>X: {{ formatStickValue(x) }}</div>
      <div>Y: {{ formatStickValue(y) }}</div>
    </div>
  </div>
</template>

<style scoped>
.stick-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stick-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  width: 50px;
  white-space: nowrap;
}

.stick-area {
  width: 70px;
  height: 70px;
  border: 2px solid #333;
  border-radius: 50%;
  position: relative;
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stick-dot {
  width: 14px;
  height: 14px;
  background-color: #2196f3;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.4);
  transition: all 0.05s linear;
}

.stick-values {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #666;
  min-width: 50px;
}
</style>

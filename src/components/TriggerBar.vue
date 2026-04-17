<script setup lang="ts">
import { computed } from "vue";
import { formatTriggerValue } from "@/utils";

interface Props {
  label: string;
  value: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: "扳机",
});

const percentage = computed(() => formatTriggerValue(props.value));
</script>

<template>
  <div class="trigger-container">
    <div class="trigger-label">{{ label }}</div>
    <div class="trigger-bar">
      <div class="trigger-fill" :style="{ height: `${percentage}%` }"></div>
    </div>
    <div class="trigger-value">{{ value }}</div>
  </div>
</template>

<style scoped>
.trigger-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.trigger-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  width: 30px;
  white-space: nowrap;
}

.trigger-bar {
  width: 24px;
  height: 70px;
  border: 1px solid #333;
  background: linear-gradient(to bottom, #f5f5f5 0%, #ffffff 100%);
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.trigger-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #ff9800, #ffb74d);
  transition: height 0.05s linear;
  box-shadow: inset 0 1px 3px rgba(255, 152, 0, 0.3);
}

.trigger-value {
  font-size: 11px;
  color: #666;
  min-width: 30px;
  text-align: right;
}
</style>

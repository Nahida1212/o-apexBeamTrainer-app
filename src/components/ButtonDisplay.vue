<script setup lang="ts">
import { computed } from "vue";
import { getPressedButtons } from "@/utils";
import type { ButtonState } from "@/types";

interface Props {
  buttons: ButtonState;
}

const props = withDefaults(defineProps<Props>(), {});

const pressed = computed(() => getPressedButtons(props.buttons));
</script>

<template>
  <div class="buttons-container">
    <div class="buttons-label">按键</div>
    <div class="buttons-list">
      <span v-for="btn in pressed" :key="btn" class="button-tag">
        {{ btn }}
      </span>
      <span v-if="pressed.length === 0" class="no-buttons">无</span>
    </div>
  </div>
</template>

<style scoped>
.buttons-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.buttons-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  width: 50px;
  white-space: nowrap;
}

.buttons-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.button-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
  transition: all 0.2s ease;
}

.button-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(33, 150, 243, 0.4);
}

.no-buttons {
  color: #bbb;
  font-size: 12px;
}
</style>

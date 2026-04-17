<script setup lang="ts">
import type { Weapon } from "@/types";

interface Props {
  weapon: Weapon;
  selected?: boolean;
}

withDefaults(defineProps<Props>(), {
  selected: false,
});

defineEmits<{
  select: [weapon: Weapon];
}>();

// 难度颜色映射
const difficultyColors: Record<string, string> = {
  easy: "#4caf50",
  normal: "#2196f3",
  hard: "#ff9800",
  expert: "#f44336",
};
</script>

<template>
  <div
    class="weapon-card"
    :class="{ selected }"
    @click="$emit('select', weapon)"
  >
    <img :src="weapon.icon" :alt="weapon.name" class="weapon-icon" />
    <div class="weapon-info">
      <h3 class="weapon-name">{{ weapon.name }}</h3>
      <p class="weapon-type">{{ weapon.type }}</p>
      <div class="weapon-stats">
        <span class="stat">
          <span class="label">火速:</span>
          <span class="value">{{ weapon.fireRate }}</span>
        </span>
        <span class="stat">
          <span class="label">伤害:</span>
          <span class="value">{{ weapon.damage }}</span>
        </span>
      </div>
      <div
        class="difficulty-badge"
        :style="{ backgroundColor: difficultyColors[weapon.difficulty] }"
      >
        {{ weapon.difficulty }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.weapon-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.weapon-card:hover {
  background-color: #f0f0f0;
  border-color: #e0e0e0;
  transform: translateY(-1px);
}

.weapon-card.selected {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.weapon-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
  flex-shrink: 0;
}

.weapon-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weapon-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.weapon-type {
  margin: 0;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}

.weapon-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.stat {
  display: flex;
  gap: 4px;
  align-items: center;
}

.stat .label {
  color: #888;
  font-weight: 500;
}

.stat .value {
  color: #333;
  font-weight: 600;
}

.difficulty-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  color: white;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}
</style>

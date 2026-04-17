<script setup lang="ts">
import { ref, computed, watch } from "vue";
import WeaponCard from "./WeaponCard.vue";
import type { Weapon } from "@/types";

const selectedWeaponId = ref<string>("");

// 定义emit
const emit = defineEmits<{
  'update:weapon': [weapon: Weapon];
}>();

// 默认武器列表 (Apex Legends 中的武器)
const weapons: Weapon[] = [
  // 步枪
  {
    id: "r301",
    name: "R-301 Carbine",
    type: "rifle",
    icon: new URL("../assets/weapons/R-301_Carbine_Icon.svg", import.meta.url).href,
    description: "多功能突击步枪",
    difficulty: "easy",
    recoilPattern: [0, 5, 10, 15, 20, 25, 30, 35],
    horizontalPattern: [50, 48, 50, 52, 50, 48, 50, 52],
    fireRate: 10,
    damage: 14,
  },
  {
    id: "flatline",
    name: "VK-47 Flatline",
    type: "rifle",
    icon: new URL("../assets/weapons/VK-47_Flatline_Icon.svg", import.meta.url).href,
    description: "高伤害突击步枪",
    difficulty: "normal",
    recoilPattern: [0, 10, 20, 30, 40, 50, 60, 70],
    horizontalPattern: [45, 50, 55, 50, 45, 50, 55, 50],
    fireRate: 8,
    damage: 18,
  },
  {
    id: "hemlok",
    name: "Hemlok Burst AR",
    type: "rifle",
    icon: new URL("../assets/weapons/Hemlok_Breach_AR_Icon.svg", import.meta.url).href,
    description: "三连发步枪",
    difficulty: "normal",
    recoilPattern: [0, 25, 40, 55, 65, 70, 75, 80],
    horizontalPattern: [40, 50, 60, 50, 40, 50, 60, 50],
    fireRate: 12,
    damage: 20,
  },
  {
    id: "havoc",
    name: "HAVOC Rifle",
    type: "rifle",
    icon: new URL("../assets/weapons/HAVOC_Rifle_Icon.svg", import.meta.url).href,
    description: "能量步枪",
    difficulty: "hard",
    recoilPattern: [0, 30, 50, 70, 85, 95, 100, 100],
    horizontalPattern: [35, 45, 55, 65, 70, 60, 50, 40],
    fireRate: 9,
    damage: 20,
  },
  {
    id: "nemesis",
    name: "Nemesis Burst AR",
    type: "rifle",
    icon: new URL("../assets/weapons/Nemesis_Burst_AR_Icon.svg", import.meta.url).href,
    description: "能量脉冲步枪",
    difficulty: "hard",
    recoilPattern: [0, 35, 55, 75, 90, 100, 100, 100],
    horizontalPattern: [30, 45, 60, 70, 65, 50, 35, 30],
    fireRate: 11,
    damage: 19,
  },
  // 冲锋枪
  {
    id: "r99",
    name: "R-99 SMG",
    type: "smg",
    icon: new URL("../assets/weapons/R-99_SMG_Icon.svg", import.meta.url).href,
    description: "高射速冲锋枪",
    difficulty: "hard",
    recoilPattern: [0, 15, 25, 35, 45, 50, 55, 60],
    horizontalPattern: [30, 40, 50, 60, 70, 60, 50, 40],
    fireRate: 18,
    damage: 11,
  },
  {
    id: "volt",
    name: "Volt SMG",
    type: "smg",
    icon: new URL("../assets/weapons/Volt_SMG_Icon.svg", import.meta.url).href,
    description: "能量冲锋枪",
    difficulty: "hard",
    recoilPattern: [0, 20, 35, 50, 65, 75, 85, 90],
    horizontalPattern: [35, 45, 55, 65, 70, 60, 50, 40],
    fireRate: 16,
    damage: 12,
  },
  {
    id: "car",
    name: "C.A.R. SMG",
    type: "smg",
    icon: new URL("../assets/weapons/C.A.R._SMG_Icon.svg", import.meta.url).href,
    description: "平衡冲锋枪",
    difficulty: "normal",
    recoilPattern: [0, 12, 22, 35, 48, 60, 70, 80],
    horizontalPattern: [40, 50, 60, 50, 40, 50, 60, 50],
    fireRate: 16,
    damage: 13,
  },
  {
    id: "alternator",
    name: "Alternator SMG",
    type: "smg",
    icon: new URL("../assets/weapons/Alternator_SMG_Icon.svg", import.meta.url).href,
    description: "稳定冲锋枪",
    difficulty: "easy",
    recoilPattern: [0, 10, 18, 28, 40, 50, 60, 70],
    horizontalPattern: [48, 50, 52, 50, 48, 50, 52, 50],
    fireRate: 14,
    damage: 12,
  },
  {
    id: "prowler",
    name: "Prowler Burst PDW",
    type: "smg",
    icon: new URL("../assets/weapons/Prowler_Burst_PDW_Icon.svg", import.meta.url).href,
    description: "五连发冲锋枪",
    difficulty: "hard",
    recoilPattern: [0, 25, 45, 65, 80, 90, 95, 100],
    horizontalPattern: [25, 40, 55, 70, 75, 65, 50, 35],
    fireRate: 15,
    damage: 14,
  },
  // 轻机枪
  {
    id: "devotion",
    name: "Devotion LMG",
    type: "lmg",
    icon: new URL("../assets/weapons/Devotion_LMG_Icon.svg", import.meta.url).href,
    description: "能量轻机枪",
    difficulty: "hard",
    recoilPattern: [0, 20, 35, 50, 65, 75, 85, 95],
    horizontalPattern: [20, 35, 50, 65, 80, 65, 50, 35],
    fireRate: 12,
    damage: 17,
  },
  {
    id: "rampage",
    name: "Rampage LMG",
    type: "lmg",
    icon: new URL("../assets/weapons/Rampage_LMG_Icon.svg", import.meta.url).href,
    description: "高伤害轻机枪",
    difficulty: "normal",
    recoilPattern: [0, 30, 55, 75, 90, 100, 100, 100],
    horizontalPattern: [30, 45, 60, 65, 70, 60, 45, 30],
    fireRate: 8,
    damage: 22,
  },
  {
    id: "spitfire",
    name: "M600 Spitfire",
    type: "lmg",
    icon: new URL("../assets/weapons/M600_Spitfire_Icon.svg", import.meta.url).href,
    description: "连射轻机枪",
    difficulty: "normal",
    recoilPattern: [0, 15, 28, 42, 55, 68, 80, 90],
    horizontalPattern: [35, 45, 55, 65, 70, 60, 50, 40],
    fireRate: 14,
    damage: 16,
  },
  {
    id: "lstar",
    name: "L-STAR EMG",
    type: "lmg",
    icon: new URL("../assets/weapons/L-STAR_EMG_Icon.svg", import.meta.url).href,
    description: "能量轻机枪",
    difficulty: "hard",
    recoilPattern: [0, 25, 42, 60, 75, 88, 98, 100],
    horizontalPattern: [25, 40, 55, 65, 75, 65, 50, 35],
    fireRate: 13,
    damage: 18,
  },
  // 手枪
  {
    id: "re45",
    name: "RE-45 Auto",
    type: "pistol",
    icon: new URL("../assets/weapons/RE-45_Auto_Icon.svg", import.meta.url).href,
    description: "全自动手枪",
    difficulty: "easy",
    recoilPattern: [0, 8, 16, 24, 32, 40, 48, 55],
    horizontalPattern: [48, 50, 52, 50, 48, 50, 52, 50],
    fireRate: 12,
    damage: 11,
  },
];

const selectedWeapon = computed(() =>
  weapons.find((w) => w.id === selectedWeaponId.value) || weapons[0]
);

// 通过provide暴露选中的枪械给其他组件
// provide("selectedWeapon", selectedWeapon);

// 当selectedWeapon变化时，emit给父组件
watch(
  selectedWeapon,
  (newWeapon) => {
    emit('update:weapon', newWeapon);
  }
);

// 初始化选择第一把枪
if (!selectedWeaponId.value && weapons.length > 0) {
  selectedWeaponId.value = weapons[0].id;
}
</script>

<template>
  <div class="weapon-list">
    <div class="list-header">
      <h3>📦 枪械库</h3>
    </div>
    <div class="weapons-scroll">
      <WeaponCard
        v-for="weapon in weapons"
        :key="weapon.id"
        :weapon="weapon"
        :selected="selectedWeaponId === weapon.id"
        @select="selectedWeaponId = weapon.id"
      />
    </div>
    <div class="selected-weapon" v-if="selectedWeapon">
      <div class="weapon-detail">
        <div class="detail-header">
          <img :src="selectedWeapon.icon" :alt="selectedWeapon.name" class="detail-icon" />
          <div>
            <div class="detail-name">{{ selectedWeapon.name }}</div>
            <div class="detail-desc">{{ selectedWeapon.description }}</div>
          </div>
        </div>
        <div class="detail-stats">
          <div class="detail-stat">
            <span class="stat-label">射速</span>
            <span class="stat-bar">
              <span class="stat-fill" :style="{ width: selectedWeapon.fireRate * 5 + '%' }"></span>
            </span>
            <span class="stat-value">{{ selectedWeapon.fireRate }}</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">伤害</span>
            <span class="stat-bar">
              <span class="stat-fill" :style="{ width: selectedWeapon.damage * 1.5 + '%' }"></span>
            </span>
            <span class="stat-value">{{ selectedWeapon.damage }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weapon-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e0e0e0;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.list-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.weapons-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weapons-scroll::-webkit-scrollbar {
  width: 6px;
}

.weapons-scroll::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.weapons-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #bbb;
}

.selected-weapon {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #f9f9f9, #f5f5f5);
}

.weapon-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.detail-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.detail-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.detail-desc {
  font-size: 10px;
  color: #999;
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.stat-label {
  min-width: 30px;
  color: #666;
  font-weight: 500;
}

.stat-bar {
  flex: 1;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.stat-value {
  min-width: 20px;
  text-align: right;
  color: #333;
  font-weight: 600;
}
</style>

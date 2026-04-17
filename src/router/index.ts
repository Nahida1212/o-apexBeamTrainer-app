import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import GamepadTestPage from '@/pages/GamepadTestPage.vue'
import DirectionOverlayPage from '@/pages/DirectionOverlayPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/gamepad', name: 'gamepad', component: GamepadTestPage },
  { path: '/direction-overlay', name: 'direction-overlay', component: DirectionOverlayPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router

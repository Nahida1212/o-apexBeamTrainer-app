## 前端项目结构

```
src/
├── pages/              # 页面组件
│   └── GamepadTestPage.vue    # 手柄测试页面
├── components/         # 可复用组件
│   ├── ControllerCard.vue     # 手柄卡片（容器）
│   ├── StickVisualizer.vue    # 摇杆可视化
│   ├── TriggerBar.vue         # 扳机进度条
│   ├── ButtonDisplay.vue      # 按键显示
│   └── index.ts               # 导出所有组件
├── layouts/            # 布局组件
│   ├── MainLayout.vue         # 主布局
│   └── index.ts               # 导出所有布局
├── services/           # 业务逻辑服务
│   ├── gamepadService.ts      # 手柄服务（调用Rust API）
│   └── index.ts               # 导出所有服务
├── types/              # TypeScript 类型定义
│   ├── gamepad.ts             # 手柄类型
│   └── index.ts               # 导出所有类型
├── utils/              # 工具函数
│   ├── gamepadUtils.ts        # 手柄工具函数
│   └── index.ts               # 导出所有工具
├── styles/             # 全局样式（可选）
├── assets/             # 静态资源
├── App.vue             # 应用根组件
├── main.ts             # 应用入口
└── vite-env.d.ts       # Vite 环境声明
```

## 目录说明

### pages/
- 存放**完整的页面组件**
- 每个页面对应一个路由或主要功能
- 例如：GamepadTestPage.vue

### components/
- 存放**可复用的业务组件**
- 组件应该是独立的、可组合的
- 例如：ControllerCard、StickVisualizer 等

### layouts/
- 存放**布局包装器组件**
- 用于包装页面内容，提供统一的页面结构
- 例如：MainLayout（包含 header、footer）

### services/
- 存放**与后端通信的服务**
- 封装 Tauri 命令调用和业务逻辑
- 例如：gamepadService.ts

### types/
- 存放 **TypeScript 类型定义**
- 保持类型定义的集中管理
- 例如：ControllerState、ButtonState 等

### utils/
- 存放**纯函数工具**
- 例如：格式化、计算、转换等
- 例如：formatStickValue、getStickPosition 等

## 路径别名

项目配置了 `@` 别名指向 `src/` 目录，因此可以使用：

```ts
// ✅ 推荐
import { gamepadService } from "@/services";
import { ControllerCard } from "@/components";
import type { ControllerState } from "@/types";

// ❌ 避免
import { gamepadService } from "../../../services";
```

## 最佳实践

1. **组件职责单一**
   - 每个组件只做一件事
   - ControllerCard 只负责容器样式
   - StickVisualizer 只负责摇杆显示

2. **逻辑与视图分离**
   - 业务逻辑放在 services 中
   - 工具函数放在 utils 中
   - 组件只负责渲染

3. **类型安全**
   - 所有数据结构定义在 types 中
   - 避免使用 `any` 类型
   - 使用接口定义组件 Props

4. **导出规范**
   - 每个目录都有 index.ts
   - 从 index.ts 导出公共接口
   - 简化导入语句

## 示例：添加新功能

假如要添加"振动设置"功能：

1. **定义类型** (`types/gamepad.ts`)
   ```ts
   export interface VibrationConfig {
     intensity: number;
     duration: number;
   }
   ```

2. **创建服务** (`services/vibrationService.ts`)
   ```ts
   export async function setVibration(
     userIndex: number,
     config: VibrationConfig
   ) { /* ... */ }
   ```

3. **创建组件** (`components/VibrationControl.vue`)
   ```vue
   <template>
     <div class="vibration-control">
       <!-- UI -->
     </div>
   </template>
   ```

4. **集成到页面** (`pages/GamepadTestPage.vue`)
   ```vue
   <VibrationControl :state="state" />
   ```

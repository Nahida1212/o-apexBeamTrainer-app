# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RecoilLab** - A gamepad recoil control training tool for Apex Legends, built with Tauri + Vue 3 + TypeScript + Rust.

### Key Features (planned/in-progress)
- Real-time gamepad input reading (high-frequency)
- Joystick trajectory visualization
- Recoil training mode (simulating recoil patterns)
- Custom curves (deadzone / response curve)

## Architecture

- **Frontend**: Vue 3 + TypeScript + Vite (`src/`)
- **Backend**: Rust via Tauri (`src-tauri/`)
- **Communication**: Rust and frontend communicate via Tauri commands and events

### Tech Stack
- Frontend: Vue 3 + TypeScript + Vite
- Backend: Rust (Tauri v2)
- Gamepad library (planned): gilrs (Rust)

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (frontend only)
npm run tauri dev        # Start full Tauri app in dev mode

# Build
npm run build            # Build frontend (Vue + TypeScript)
npm run tauri build      # Build production Tauri application

# Preview
npm run preview          # Preview production build locally
```

## Code Structure

```
src/
  main.ts           # Vue app entry point
  App.vue           # Root Vue component
  vite-env.d.ts     # Vite type declarations

src-tauri/
  src/
    main.rs         # Binary entry (calls lib)
    lib.rs          # Tauri app setup, commands, and plugins
  Cargo.toml        # Rust dependencies
  tauri.conf.json   # Tauri configuration (windows, build, bundle)
  capabilities/     # Tauri v2 security capabilities
```

## Development Notes

- Tauri uses port 1420 for the dev server (strict port - fails if unavailable)
- The Rust library name uses snake_case (`o_apexbeamtrainer_app_lib`) to avoid Windows naming conflicts
- TypeScript config is strict: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
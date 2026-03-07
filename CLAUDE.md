# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal resume web application built with Vue 3 + TypeScript + TailwindCSS. It's a showcase project for learning and demonstrating modern frontend technologies.

- **Online Demo**: https://resume.fridolph.top
- **Purpose**: Personal resume website and learning project for Vue3 + TS + TailwindCSS
- **Key Features**: Bilingual (Chinese/English), dark/light theme, resume download, anchor navigation

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3
- **State Management**: Pinia (demonstration purposes, minimal usage)
- **Internationalization**: vue-i18n 9
- **Package Manager**: pnpm

## Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Architecture

### Directory Structure

```
src/
├── components/        # Reusable components
│   ├── Layouts/      # Layout components (Aside, Main, Section)
│   ├── PageTool/     # Page tools (Anchor, Download, ThemeChange)
│   └── [other components]
├── views/            # Page sections (Avatar, Baseinfo, Experience, etc.)
│   ├── Experience/   # Work experience with company-specific subfolders
│   └── [other sections]
├── hooks/            # Composables (useLocale.ts)
├── locales/          # i18n translations (zh, en)
├── store/            # Pinia store (common.ts - theme management)
├── styles/           # Global styles (CSS variables, Tailwind imports)
├── utils/            # Utility functions
├── App.vue           # Root component
└── main.ts           # Application entry point
```

### Key Components

**Layout Components**:
- `Aside.vue`: Left sidebar container
- `Main.vue`: Main content container
- `Section.vue`: Section wrapper

**Page Tools**:
- `AnchorTool.vue`: Scroll anchor navigation
- `DownloadTool.vue`: Resume PDF/MD download
- `ThemeChange.vue`: Dark/light theme toggle
- `ToggleLang.vue`: Language switcher (zh/en)

**Reusable Components**:
- `ListWrap.vue`: List container supporting ul/dl types
- `ProjectWrap.vue`: Project showcase wrapper
- `TitleDesc.vue`: Title + description component

### Views (Resume Sections)

Left sidebar (`Aside.vue`):
- `Avatar`: Profile photo
- `Baseinfo`: Basic personal info
- `Contact`: Contact information
- `Hobby`: Hobbies/interests

Main content (`Main.vue`):
- `Education`: Education background
- `Skill`: Technical skills
- `Experience`: Work experience (with company-specific sub-components)
- `Personal`: Personal projects/articles
- `Thanks`: Closing section

### State Management

**Pinia Store (`store/common.ts`)**:
- Manages light/dark theme state
- Note: The store is included primarily for demonstration, as the project is simple enough without it

**Internationalization**:
- Uses vue-i18n with Composition API
- Languages: `zh` (Chinese, default), `en` (English)
- Hook: `useLocale.ts` provides `isZh` computed and `toggleLang()` function
- Messages stored in `locales/zh/index.ts` and `locales/en/index.ts`

### Styling

- **TailwindCSS**: Primary styling approach
- **Dark Mode**: Uses Tailwind's `class` strategy (managed via Pinia store)
- **CSS Variables**: Defined in `styles/var.css` for colors, fonts, etc.
- **Custom Styles**: Imported in `styles/index.css`

### Vite Configuration

Key plugins in `vite.config.ts`:
- `@vitejs/plugin-vue`: Vue SFC support
- `vite-plugin-compression2`: Gzip compression
- `vite-plugin-chunk-split`: Code splitting (vue, tailwind, styles, locales)
- `vite-plugin-bundle-prefetch`: Prefetch links for bundles

### Important Notes

1. **Resume Content**: Personal resume data is baked into components and locale files. To fork this project, replace:
   - PDF/MD files in `public/`
   - Content in `views/` components
   - Locale messages in `locales/`

2. **Package Manager**: Uses pnpm exclusively. Node.js >= 16.22.2 required.

3. **Download Files**: Place your resume PDF/MD files in the `public/` directory (use English filenames to avoid server issues).

4. **Build Output**: Production build generates compressed bundles with chunk splitting.

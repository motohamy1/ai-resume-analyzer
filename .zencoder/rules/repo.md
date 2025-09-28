---
description: Repository Information Overview
alwaysApply: true
---

# AI Resume Analyzer Information

## Summary
A modern, full-stack React application built with React Router for analyzing resumes. The application features server-side rendering, hot module replacement, TypeScript support, and TailwindCSS for styling. It's designed to be production-ready with asset bundling and optimization capabilities.

## Structure
- **app/**: Contains the main application code, routes, and components
  - **routes/**: React Router route components
  - **welcome/**: Welcome page components
- **public/**: Static assets including icons and images
- **.zencoder/**: Configuration for Zencoder
- **Dockerfile**: Docker configuration for containerization

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: ES2022
**Build System**: Vite
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React v19.1.1
- React Router v7.9.2
- pdfjs-dist v5.4.149 (for PDF processing)
- zustand v5.0.8 (state management)
- TailwindCSS v4.1.13

**Development Dependencies**:
- TypeScript v5.9.2
- Vite v7.1.7
- @react-router/dev v7.9.2
- @tailwindcss/vite v4.1.13

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build

# Start production server
npm run start
```

## Docker
**Dockerfile**: Dockerfile (multi-stage build)
**Image**: Node 20 Alpine
**Configuration**: 
- Multi-stage build process
- Separate stages for development dependencies, production dependencies, and build
- Final image contains only production dependencies and build artifacts
- Default command runs the production server

**Build Command**:
```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## Application Structure
**Entry Point**: app/root.tsx
**Routing**: React Router v7 with file-based routing
**Main Routes**: 
- Home route (app/routes/home.tsx)

**Configuration**:
- SSR enabled by default (react-router.config.ts)
- TailwindCSS for styling
- Path aliases configured in tsconfig.json (~/* for app/*)
# Wall Decorator MVP

A Vue.js 3 application for decorating walls with colored blocks. This MVP allows users to design wall layouts by dragging and dropping blocks of different sizes and colors.

## Features

- **Adjustable Wall**: Customize wall dimensions (width/height) and background color
- **Block Palette**: Choose from pre-defined block templates with different sizes (60x30cm, 30x30cm, 60x60cm, 30x60cm) and colors
- **Collision Detection**: Prevents blocks from overlapping - blocks automatically find valid positions
- **Smart Drag & Drop**: Drag blocks from the palette to the wall with visual feedback for valid/invalid placement
- **Interactive Blocks**: Move existing blocks on the wall, remove blocks by double-clicking or using the remove button
- **Optimized Random Design**: Generate random wall designs that efficiently fill the wall space
- **Visual Feedback**: Real-time preview of block placement with color-coded validity indicators
- **Save/Load**: Save designs to localStorage and load the most recent design

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or the next available port).

## Build

Build the application for production:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## Usage

1. **Adjust Wall Settings**: Use the controls at the top to modify wall dimensions and background color
2. **Add Blocks**: Drag blocks from the palette on the right onto the wall
3. **Move Blocks**: Drag existing blocks on the wall to reposition them
4. **Remove Blocks**: Double-click a block or click the × button to remove it
5. **Generate Random Design**: Click "Generate Random Design" for instant inspiration
6. **Save Design**: Click "Save Design" to store your current layout
7. **Load Design**: Click "Load Saved Design" to restore your most recent saved design

## Default Settings

- Wall size: 315cm × 300cm
- Block sizes: 60×30cm, 30×30cm, 60×60cm, and 30×60cm
- Measurement unit: Centimeters
- Block colors: Red, Blue, Green, Yellow, Purple, Orange, Teal, Pink
- Auto-collision detection: Blocks cannot overlap
- Smart placement: Invalid positions are automatically corrected

## Tech Stack

- Vue.js 3 with Composition API
- TypeScript
- Vite
- SASS/SCSS
- HTML5 Drag and Drop API
- localStorage for persistence
# Wall Decorator

A modern Vue.js 3 application for designing wall layouts with colored blocks. This interactive tool allows users to create professional wall decorations by dragging and dropping customizable blocks with intelligent placement algorithms.

## ✨ Features

### 🎨 **Design Tools**

- **Wall Editor**: Customize wall dimensions (100-1000cm width, 100-500cm height) and background color
- **Block Editor**: Create and customize block templates with adjustable dimensions (20-100cm width, 15-50cm height) and colors
- **Block Palette**: Intuitive vertical palette with larger, more visible block previews
- **Visual Feedback**: Real-time placement preview with color-coded validity indicators

### 🧩 **Intelligent Placement**

- **Smart Collision Detection**: Prevents blocks from overlapping with automatic position correction
- **Adjacent Placement**: When dragging onto existing blocks, automatically finds the closest valid adjacent position
- **Overflow Management**:
  - Horizontal overflow limited to one block width (60px)
  - Vertical top overflow limited to one block height (30px)
  - Visual warning indicators for overflow blocks

### 🎯 **Generation Algorithms**

- **Random Design**: Generate clean layouts within wall boundaries (no overflow)
- **Staggered Design**: Create realistic brick-pattern layouts with controlled overflow effects
- **Optimized Placement**: Efficient space utilization with collision-free positioning

### 🔧 **User Experience**

- **Drag & Drop**: Smooth HTML5 drag and drop with visual feedback
- **Interactive Blocks**:
  - Move existing blocks by dragging
  - Remove blocks via double-click or × button
  - Hover effects and scaling animations
- **Organized Interface**: Separated control groups (Generate, Save/Load) with clear visual hierarchy
- **Responsive Design**: Adapts to different screen sizes

### 💾 **Persistence**

- **Save Designs**: Store current layouts to localStorage with timestamps
- **Load Designs**: Restore most recent saved design
- **Session Management**: Maintains state across browser sessions

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

## 🚀 Usage Guide

### Getting Started

1. **Configure Wall**: Use the Wall Editor at the top to set dimensions (width/height) and background color
2. **Customize Blocks**: Use the Block Editor to modify template dimensions, colors, or add new templates
3. **Design Your Layout**: Drag blocks from the vertical palette onto the wall canvas

### Design Workflow

1. **Manual Placement**:

   - Drag blocks from palette to wall for precise positioning
   - Drop blocks onto existing blocks for automatic adjacent placement
   - Move existing blocks by dragging them to new positions

2. **Automatic Generation**:

   - **Random Design**: Creates clean layouts within wall boundaries
   - **Staggered Design**: Generates brick-style patterns with controlled overflow

3. **Block Management**:

   - **Remove**: Double-click blocks or use the × button on hover
   - **Edit**: Modify block templates in the Block Editor section
   - **Visual Cues**: Red borders indicate overflow blocks (within allowed limits)

4. **Save & Load**:
   - **Save**: Store your current design with timestamp
   - **Load**: Restore your most recent saved design

### Interface Layout

- **Top Section**: Wall Editor and Block Editor side by side
- **Middle Section**: Control buttons organized into Generate and Save/Load groups
- **Bottom Section**: Main design area with wall canvas and vertical block palette

## ⚙️ Configuration

### Default Settings

- **Wall Dimensions**: 315cm × 300cm
- **Block Templates**: 60×30cm with white, gray, and dark colors
- **Measurement Unit**: Centimeters
- **Overflow Limits**:
  - Horizontal: ±60px (one block width)
  - Vertical top: -30px (one block height)
- **Collision Detection**: Automatic with adjacent placement fallback

### Customizable Parameters

- **Wall**: Width (100-1000cm), Height (100-500cm), Background color
- **Blocks**: Width (20-100cm), Height (15-50cm), Colors (unlimited)
- **Templates**: Add/remove/modify block templates dynamically

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 with Composition API & TypeScript
- **Styling**: SASS/SCSS with responsive design
- **Build Tool**: Vite for fast development and optimized builds
- **Interactions**: HTML5 Drag and Drop API with custom enhancements
- **Storage**: localStorage for design persistence
- **Architecture**: Component-based with reactive state management

## 🎯 Design Patterns

- **Smart Placement Algorithm**: Prioritizes adjacent positioning for natural layouts
- **Overflow Management**: Controlled limits with visual feedback
- **Responsive Components**: Adaptive layouts for different screen sizes
- **Event-Driven Architecture**: Reactive updates across components
- **Modular Design**: Separated concerns for wall, blocks, and controls

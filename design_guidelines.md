# Instagram Automation Platform - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing from Zapier's workflow builder and Buffer's social media management interface, emphasizing intuitive automation design and multi-account handling with Instagram's visual identity.

---

## Core Design Elements

### A. Color Palette

**Brand Colors:**
- Primary: #E4405F (Instagram gradient start - vibrant pink)
- Secondary: #833AB4 (Instagram gradient end - deep purple)
- Gradient: Linear gradient from Primary to Secondary for accents and headers

**Functional Colors:**
- Background: #FAFAFA (light grey for canvas areas)
- Surface: #FFFFFF (white for cards, nodes, panels)
- Text Primary: #262626 (Instagram dark for headings and primary text)
- Text Secondary: #8E8E8E (grey for supporting text)
- Borders/Dividers: #DBDBDB (light grey)

**Status Colors:**
- Success: #00C851 (green for successful flows/connections)
- Warning: #FF8800 (orange for warnings)
- Error: #FF3547 (red for errors)
- Info: #2196F3 (blue for informational states)

### B. Typography

**Font Stack:** 
Instagram's custom font family, fallback to Helvetica Neue, Arial, sans-serif

**Hierarchy:**
- Page Titles: 28px, Bold, #262626
- Section Headers: 20px, Semibold, #262626
- Card Titles: 16px, Semibold, #262626
- Body Text: 14px, Regular, #262626
- Caption/Meta: 12px, Regular, #8E8E8E
- Button Text: 14px, Medium

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Grid gaps: gap-4, gap-6

**Grid Structure:**
- Main canvas: Full-width, flexible workspace
- Sidebar panels: 320px fixed width, collapsible on mobile
- Node grid: 8px snap grid for alignment
- Responsive breakpoints: Mobile-first approach

### D. Component Library

**Navigation:**
- Top header with logo, account switcher, user profile dropdown
- Left sidebar with flow list, account management, settings
- Breadcrumb navigation for flow editing context

**Flow Builder Canvas:**
- Infinite scrollable canvas with #FAFAFA background
- Minimap in bottom-right for navigation
- Zoom controls (+, -, fit to screen)
- Grid overlay (subtle, toggleable)

**Node Components:**
- Base node: White card (300px x auto), 8px rounded corners, subtle shadow
- Node header: Gradient accent bar (4px height) matching node type
- Condition nodes: Purple accent (#833AB4)
- Action nodes: Pink accent (#E4405F)
- Trigger nodes: Blue accent (#2196F3)
- Connectors: #DBDBDB lines, 2px width, curved bezier paths

**Node Types:**
- If/Else nodes: Diamond shape indicator, AND/OR operator toggles
- Action nodes: Icon + label, expandable config panel
- Delay nodes: Clock icon with time input
- API nodes: External link icon with endpoint configuration

**Panels & Modals:**
- Property panel: Right-side sliding panel for node configuration
- Account selector: Dropdown with Instagram profile pictures
- Flow settings: Modal overlay with tabs
- Activity log: Bottom drawer with filterable timeline

**Forms & Inputs:**
- Instagram-style input fields: Bottom border only, focus state with gradient underline
- Toggle switches: Instagram pink when active
- Dropdowns: White background, subtle shadow on open
- Tag inputs: Pill-shaped tags with gradient backgrounds

**Data Display:**
- Activity cards: White background, left border for status (green/orange/red)
- Metrics dashboard: Grid of stat cards with large numbers, small labels
- Flow execution logs: Timeline view with expandable details

### E. Interactive Elements

**Drag & Drop:**
- Node dragging: Subtle lift shadow, 0.95 scale during drag
- Connection creation: Animated bezier curve following cursor
- Drop zones: Dashed border highlight on valid targets

**Hover States:**
- Nodes: Subtle scale (1.02), deeper shadow
- Buttons: Gradient shift, slight scale
- Connectors: Width increase to 3px, color to primary

**Animations:**
- Page transitions: Smooth fade (200ms)
- Panel slides: 300ms ease-out
- Node additions: Scale-in from 0.8 (250ms)
- Loading states: Subtle pulse on skeleton screens

---

## Page-Specific Layouts

### Dashboard
- Top metrics row: Active flows, executions today, success rate, connected accounts
- Main content: Recent flows grid, activity feed, quick actions
- No large hero image - focus on data and actions

### Flow Builder
- Full-screen canvas with collapsible sidebars
- Floating action button for adding nodes
- Persistent save/publish controls in top bar
- Real-time execution indicators on nodes

### Account Management
- Card-based Instagram account list with profile pictures
- Connection status indicators (connected/disconnected)
- Quick actions per account: View insights, reconnect, settings

### Activity Logs
- Filterable timeline with search
- Color-coded execution status
- Expandable cards showing flow details and execution path
- Export functionality for analytics

---

## Images & Visual Assets

**No Hero Images**: This is a utility-focused SaaS platform prioritizing functionality over marketing imagery

**Icons:**
- Use Heroicons for UI elements via CDN
- Instagram-specific icons embedded (DM, comment, like, story)
- Custom node type icons in SVG format

**Account Avatars:**
- Instagram profile pictures fetched via Graph API
- Circular 40px avatars in lists
- Larger 80px in account details

**Empty States:**
- Simple illustrations (flat, 2-color using primary gradient)
- Encouraging copy for first-time users
- Clear CTAs to create first flow

---

## Accessibility & Dark Mode

**Contrast:**
- All text meets WCAG AA standards on backgrounds
- Interactive elements have 3:1 minimum contrast
- Status colors distinguishable beyond color alone (icons, patterns)

**Dark Mode** (Optional future enhancement):
- Background: #000000
- Surface: #121212
- Text: #FFFFFF
- Preserve gradient accents with adjusted opacity
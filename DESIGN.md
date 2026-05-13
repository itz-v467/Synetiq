---
name: Premium AI Intelligence
colors:
  surface: '#faf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#faf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#4a6700'
  on-secondary: '#ffffff'
  secondary-container: '#bcf543'
  on-secondary-container: '#4f6e00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1b'
  on-tertiary-container: '#838483'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#bcf543'
  secondary-fixed-dim: '#a2d824'
  on-secondary-fixed: '#141f00'
  on-secondary-fixed-variant: '#374e00'
  tertiary-fixed: '#e2e3e1'
  tertiary-fixed-dim: '#c6c7c5'
  on-tertiary-fixed: '#1a1c1b'
  on-tertiary-fixed-variant: '#454746'
  background: '#faf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is built for a high-end AI Meeting Intelligence Platform, merging the precision of developer-centric tools like Linear with the clean, structured whitespace of Notion. The brand personality is **futuristic, calm, and authoritative**, designed to feel like an essential "enterprise-grade" utility that maintains a "startup-fresh" agility.

The visual direction follows a **Modern Glassmorphic** style. It utilizes a sophisticated layering system where pure white surfaces float above an off-white canvas. The aesthetic relies on extreme corner radii, a vibrant lime accent for "active" or "intelligent" states, and high-contrast dark elements to anchor the navigation. The emotional response should be one of clarity, efficiency, and premium quality.

## Colors

The palette is rooted in a "Warm Minimalist" foundation.
- **Background & Surface:** We use `#F6F6F4` for the base canvas to reduce eye strain compared to pure white, while `#FFFFFF` is reserved for elevated cards and glassmorphic panels.
- **Accents:** The primary functional accent is `#0D0D0D` (Rich Black), used for critical UI anchors like pill-shaped global navigation. The secondary accent is `#C6FF4D` (Vibrant Lime), used sparingly to highlight AI-generated insights, active recording states, or primary calls to action.
- **Muted Tones:** Borders use a subtle `#E8E8E8` to define structure without adding visual noise. Secondary text is set in `#8C8C8C` to maintain a clear hierarchy.

## Typography

The typography system uses a tri-font approach to balance elegance with technical precision. 
- **Headlines:** Set in **Manrope** for its balanced, modern geometric feel. Large scales and tight letter-spacing are used for a premium editorial look.
- **Body:** Set in **Inter** for maximum legibility in data-heavy contexts and transcriptions. 
- **Labels & Data:** Set in **Geist** to provide a subtle "developer-tool" aesthetic for timestamps, metadata, and small labels.

Secondary text should always utilize the lighter `#8C8C8C` color to keep the interface feeling airy and lightweight.

## Layout & Spacing

This design system employs a **Fluid Layered Grid** philosophy. 
- **Grid Model:** A 12-column system is used for desktop with a fixed 24px gutter. However, components are primarily arranged in "Floating Cards" that do not always snap to the grid edges, creating a more organic, modern feel.
- **Whitespace:** Generous padding (MD or LG units) is required inside all cards to maintain the "premium" breathability.
- **Mobile Adaptivity:** On mobile, the 12-column grid collapses to 4 columns. Floating cards transition from multi-column layouts to single-stack layouts with a reduced margin of 16px.

## Elevation & Depth

Depth is achieved through a combination of **Glassmorphism** and **Ambient Shadows**.
- **The Glass Effect:** Surface cards use a base of `#FFFFFF` with 80-90% opacity and a `backdrop-blur` of 20px. This allows background colors (like the Lime accent) to bleed through softly when cards overlap.
- **Shadows:** Use extremely diffused, low-opacity shadows. A typical "Level 1" shadow uses a 40px blur with only 4% opacity of `#000000`, tinted slightly with the background hue to avoid a "dirty" look.
- **Layering:** Navigation bars and "floating" action buttons should always occupy the highest Z-index, often appearing as dark pills that hover over the white glass surfaces.

## Shapes

The shape language is characterized by **exaggerated roundness**. 
- **Cards:** Use a minimum radius of `24px` (`rounded-xl` in this system).
- **Buttons & Nav:** All interactive elements like buttons, search bars, and navigation containers must be fully **pill-shaped** (100px or higher radius).
- **Icons:** Icons are housed within circular containers or are designed with rounded terminals to match the soft UI.
- **Avatars:** Always circular to contrast against the large rectangular cards.

## Components

- **Buttons:** Primary buttons are pill-shaped. The "AI Primary" variant uses the Lime accent (`#C6FF4D`) with dark text. The "Standard Primary" uses the Rich Black (`#0D0D0D`) with white text.
- **Floating Cards:** These are the primary containers. They must have a subtle `#E8E8E8` border and a light ambient shadow.
- **Pill Navigation:** Global navigation is housed in a dark pill (`#0D0D0D`) with white or lime icons. It should appear floating at the top or side of the viewport.
- **Circular Status Indicators:** Use small, high-vibrancy circles for status (e.g., a pulsing lime dot for "Live Recording").
- **Transcription Lists:** Use Inter for the text, with large vertical spacing between speakers and Geist for the timestamps.
- **Search & Inputs:** Inputs should be pill-shaped with a light grey fill or a subtle border, using "Search" icons inside the field.
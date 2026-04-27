# Design System Specification: SchedAssist Premium Medical

## 1. Overview & Creative North Star: "The Clinical Oasis"
This design system is built on the concept of **"The Clinical Oasis"**. We reject the cold, sterile, and cluttered look of legacy medical software. Instead, we embrace a high-end, calming experience that reduces cognitive load for both medical staff and patients.

The goal is to evoke **trust, precision, and tranquility**. We achieve this through a "Deep Sea & Cloud" palette, expansive white space, and a typographic scale that prioritizes clarity over density.

---

## 2. Colors & Surface Philosophy
The palette uses deep, sophisticated teals and blues, balanced by airy, soft backgrounds.

### Core Palette
- **Primary Action (Sea Teal):** `#0f766e` - Used for main buttons, active states, and brand emphasis.
- **Secondary Surface (Cloud Blue):** `#f0f9ff` - Used for page backgrounds and large sections.
- **Neutral High (Slate):** `#0f172a` - Used for primary text and high-contrast elements.
- **Neutral Low (Ghost Gray):** `#f8fafc` - Used for secondary cards and surface nesting.
- **Success (Healing Green):** `#10b981`
- **Warning (Soft Amber):** `#f59e0b`

### The "Oasis" Rule
- **No Harsh Lines:** 1px solid borders should be avoided. Use `surface-container` shifts (e.g., from `#f0f9ff` to `#ffffff`) to define areas.
- **Tonal Depth:** Layering is achieved by placing pure white cards (#ffffff) on a Cloud Blue background (#f0f9ff).

---

## 3. Typography: Modern Precision
We use **Inter** for its neutral, objective, and highly legible characteristics.

- **Headlines:** Medium to Bold weight with slightly tight letter spacing (-0.02em).
- **Body:** Regular weight, generous line height (1.6) for scannability.
- **Labels:** Semi-bold, small caps for category headers.

---

## 4. Components & Interactive Patterns

### Cards & Surfaces
- **Radius:** All containers use a `16px` (1rem) corner radius for an organic, friendly feel.
- **Shadows:** Use extremely diffused "Ambient Light" shadows (blur: 32px, opacity: 4% of Neutral High).
- **Modals & Drawers:** These are the primary vessels for CRUD operations. They should feature a `backdrop-filter: blur(12px)` and a soft `surface-container-highest` background.

### Buttons
- **Primary:** Sea Teal fill with white text. Rounded `12px`.
- **Secondary:** Transparent background with Sea Teal border and text.
- **Glass:** A semi-transparent white background with a blur effect, used for floating action buttons or over image heroes.

---

## 5. UI/UX Strategy: "Modal-First"
- **Avoid Redirects:** New professional, New patient, or Edit service should ALWAYS be a Modal or a Lateral Drawer.
- **Empty States:** Use custom, soft-colored medical-themed illustrations or iconsax icons to guide users.
- **Navigation:** A sticky, glassmorphic top navigation or a clean, slim left-side sidebar.

---

## 6. Do’s and Don’ts
- **Do:** Use large font sizes for key metrics.
- **Do:** Use teals and greens for a "Healthy" vibe.
- **Don't:** Use "Medical Red" unless it's a critical error.
- **Don't:** Cram information. If a page feels full, it probably needs a Modal to hide secondary details.

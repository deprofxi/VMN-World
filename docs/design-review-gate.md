# VMNL Design Review Gate Protocol

**Authority:** `VMNL-AZP-VMN-DESIGN-TASK-001 — R1.0` / `docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-1004`  
**Classification:** Engineering & Design Release Gate Checklist  
**Applies To:** All Frontend Components, Web Surfaces, Desks, and Operator Consoles

---

## 1. Mandatory Pre-Merge Visual Review Gate

Every pull request or design handoff that introduces or modifies visual components, styles, or page layouts MUST include verified visual captures demonstrating responsiveness across two canonical viewports:

1. **Mobile Viewport:** `390px` width (iPhone 14/15/16 Pro standard width)
2. **Desktop Viewport:** `1440px` width (Standard broadcast operator workstation display)

Pull requests lacking these recorded artefacts cannot be approved for merge.

---

## 2. PR Description Submission Template

Copy and paste this section into the PR body when opening a UI change:

```markdown
### Design Review Gate Verification (DT-1004)

#### 1. Viewport Captures
- [ ] **Mobile (390px):**
  ![Mobile Viewport Capture at 390px](url-or-path-to-screenshot-390px)
  *Verification:* No horizontal overflow, navbar collapses gracefully, min 44x44px touch targets preserved.

- [ ] **Desktop (1440px):**
  ![Desktop Viewport Capture at 1440px](url-or-path-to-screenshot-1440px)
  *Verification:* Two-column / grid density renders legibly, rail navigation aligned, typography scales correctly.

#### 2. Design System & WCAG AA Checklist
- [ ] Zero literal hex codes or arbitrary margin/padding values (Token Discipline: DT-1002).
- [ ] Contrast ratio >= 4.5:1 for normal text and >= 3:1 for graphical boundaries/controls (DT-103, DT-104).
- [ ] Full state matrix implemented: default, hover, active, focus-visible, disabled, loading, error, empty (DT-202).
- [ ] Zero emoji glyphs in markup; all icons rendered via `renderIcon()` SVG suite (DT-106).
- [ ] High-contrast focus outline visible on keyboard `Tab` navigation (DT-703).
- [ ] Screen readers supported with semantic headings (`h1`–`h4`), ARIA live alerts, and image alt tags (DT-704).
- [ ] No non-color status indicators (color + text or paired icon on every status chip) (DT-705).
- [ ] Reduced motion respected via `@media (prefers-reduced-motion: reduce)` (DT-706).
- [ ] Any intentional temporary design debt logged in `docs/design-debt-register.md` (DT-1005).

#### 3. Sign-Off Clearance
- [ ] Designer / UI Architect Sign-Off
- [ ] Accessibility & QA Engineer Sign-Off
```

---

## 3. Automated Pre-Flight Checks

Before marking the gate as passed, the following command suite must execute with 0 failures:

```bash
# 1. Typecheck and Static Lint
npm run typecheck

# 2. Token Discipline & Contrast Ratios
npx vitest run tests/unit/token-discipline.test.ts
npx vitest run tests/unit/tokens-contrast.test.ts

# 3. Accessibility & Responsive Suite
npx vitest run tests/a11y/accessibility-audit.test.ts
npx vitest run tests/a11y/responsive.test.ts
```

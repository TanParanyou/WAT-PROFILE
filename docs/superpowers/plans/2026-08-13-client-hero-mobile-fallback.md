# Client Hero mobile layout and image fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ปรับ `HeroSection` ให้ mobile ใกล้ภาพตัวอย่าง และเปลี่ยน fallback ของภาพ API เป็น placeholder ที่ไม่ใช่ภาพในโปรเจกต์

**Architecture:** คงการอ่านข้อมูลจาก public queries เดิมและคงภาพ API เฉพาะ desktop เมื่อมีพื้นที่แสดงภาพ เปลี่ยนค่า fallback ของ `PublicImage` ใน HeroSection ไปเป็น neutral SVG data URI ที่อยู่ใน fallback asset module เดิม

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, `next/image`

## Global Constraints

- แก้เฉพาะ `HeroSection` และ fallback asset ที่จำเป็น
- ไม่เปลี่ยน API contract, CMS data flow หรือ `PublicHomePageLayout`
- รักษา locale-aware copy, accessibility alt text, keyboard focus และ reduced motion
- ห้ามใช้ภาพในโปรเจกต์เป็น fallback ของ HeroSection

### Task 1: Update HeroSection fallback and responsive presentation

**Files:**
- Modify: `frontend/src/components/home/HeroSection.tsx`
- Modify: `frontend/src/components/public/media/publicImageFallbacks.ts`
- Test: frontend lint and TypeScript type-check

**Interfaces:**
- `HeroSection` continues to consume `usePublicHomePageQuery`, `usePublicSiteSettingsQuery`, and localized messages unchanged.
- `publicHeroFallbackImage` is exported as a string data URI and passed to `PublicImage.fallbackSrc`.

- [ ] **Step 1: Add a neutral hero fallback asset**

Add `publicHeroFallbackImage` beside the existing public event and monk fallbacks. The SVG must use a flat neutral surface, a simple image icon, and an accessible unavailable-image label; it must not reference `/images/hero-bg.png` or another project image.

- [ ] **Step 2: Update HeroSection to use the neutral fallback**

Import `publicHeroFallbackImage` and use it for the desktop `PublicImage` `fallbackSrc`; keep `heroBgUrl` sourced from the public site settings query and keep the mobile branch free of API image rendering.

- [ ] **Step 3: Verify the implementation**

Run `cd frontend && npm run lint` and `cd frontend && ./node_modules/.bin/tsc --noEmit`.

Expected: both commands complete successfully, and `rg -n 'hero-bg.png|publicHeroFallbackImage' frontend/src/components/home/HeroSection.tsx frontend/src/components/public/media/publicImageFallbacks.ts` shows the HeroSection fallback is the neutral asset rather than the project image.

- [ ] **Step 4: Review the final diff**

Run `git diff --check` and inspect the diff to confirm no changes were made to `PublicHomePageLayout`, API files, or unrelated user changes.

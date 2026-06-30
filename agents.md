# Agents.md — แนวทางสำหรับ AI Coding Agent

คำแนะนำนี้สำหรับ AI agent (เช่น Claude Code) ที่เข้ามาแก้ไขโค้ดในรีโปนี้ ดู `context.md` สำหรับภาพรวมสถาปัตยกรรม/ฟีเจอร์ของแอปก่อน

## สิ่งที่ต้องรู้ก่อนแก้โค้ด
- โปรเจกต์นี้**ไม่มี build step, ไม่มี package manager, ไม่มี test suite อัตโนมัติ** — `index.html` คือทั้งแอป (HTML+CSS+JS ในไฟล์เดียว)
- ห้ามเพิ่ม framework, bundler, หรือไฟล์ config build (webpack/vite/package.json ฯลฯ) โดยไม่มีเหตุผลชัดเจนจากผู้ใช้ — ฟิโลโซฟีของโปรเจกต์คือ "เปิดไฟล์ใน browser ได้เลย ไม่ต้องติดตั้งอะไร"
- ก่อนแก้ logic ใด ๆ ให้ `grep` หา function/section ที่เกี่ยวข้องใน `index.html` ก่อน ไฟล์ใหญ่ (~3,500 บรรทัด) อย่าอ่านทั้งไฟล์รวดเดียวถ้าไม่จำเป็น — ใช้ Grep/offset reading

## การทดสอบการเปลี่ยนแปลง
- ไม่มี automated test ให้รัน — ต้อง verify ด้วยการเปิด `index.html` ในเบราว์เซอร์จริง (หรือ headless browser) แล้วลอง flow ที่เกี่ยวข้องกับสิ่งที่แก้ เช่น:
  - บันทึกกะ → autosave → ดู summary bar
  - เปลี่ยนเดือน/ปี → ดู Stats tab
  - แก้ settings (เงินเดือน/เรต) → ดูผลใน Tax tab
  - Backup → Restore JSON
- ถ้าแก้ UI/feature ที่ทดสอบผ่านเบราว์เซอร์ไม่ได้ในสภาพแวดล้อมปัจจุบัน ให้บอกผู้ใช้ตรง ๆ ว่ายังไม่ได้ verify ด้วยตา ไม่ใช่อ้างว่า "เสร็จแล้ว" เฉย ๆ

## Service Worker / PWA caching
- ถ้าแก้ไข `index.html`, `manifest.webmanifest`, หรือไฟล์ใน `icons/` — ต้อง **bump เลขเวอร์ชันใน `CACHE` constant ของ `sw.js`** (บรรทัด `const CACHE = 'shiftpro-vXX-YY'`) ไม่งั้นผู้ใช้ที่ติดตั้งเป็น PWA แล้วจะไม่เห็นการเปลี่ยนแปลง เพราะ service worker เสิร์ฟจาก cache เดิม
- อย่าแก้ logic การแคช Gemini API call (ต้อง bypass cache เสมอ — ดู `sw.js` บรรทัดที่ check `generativelanguage.googleapis.com`)

## ข้อมูลผู้ใช้และความปลอดภัย
- ข้อมูลทั้งหมดอยู่ใน `localStorage` ฝั่ง client เท่านั้น ไม่มี server เก็บข้อมูล
- Gemini API key เก็บเป็น plain text ใน `localStorage` (ความตั้งใจของ design — BYOK, single-user, local-only) — **อย่า**เปลี่ยนให้ส่ง API key ไปที่ server ใด ๆ หรือ hardcode API key ของจริงลงในโค้ด
- ห้าม commit API key, credential หรือ secret ใด ๆ ลงในไฟล์ของรีโป

## ภาษาและสไตล์
- UI และ comment ในโค้ดเป็นภาษาไทยทั้งหมด — เมื่อแก้ไขหรือเพิ่มข้อความที่ผู้ใช้เห็น ให้เขียนเป็นภาษาไทยให้สอดคล้องกับของเดิม
- เขียนโค้ดสไตล์เดิม (vanilla JS, function-based, ไม่มี class/module system, ตัวแปร global อย่าง `SS`, `$`) อย่าเปลี่ยนเป็น pattern อื่นโดยไม่จำเป็น
- ไม่ต้องเพิ่ม comment อธิบายสิ่งที่โค้ดอ่านออกอยู่แล้ว เพิ่มเฉพาะตอนมีเหตุผลที่ไม่ชัดเจนในตัวเอง (เช่น ทำไม cache version ต้อง bump, ทำไมต้องเก็บ VARIABLE_HOLIDAYS แยกรายปี)

## วันหยุด (Holidays)
- `FIXED_HOLIDAYS` และ `VARIABLE_HOLIDAYS` ใน `index.html` ต้องอัปเดตทุกปีเมื่อ ครม. ประกาศวันหยุดชดเชย/จันทรคติของปีถัดไป — ถ้าผู้ใช้ขอให้เพิ่มปีใหม่ ให้เพิ่มใน `VARIABLE_HOLIDAYS` โดยอ้างอิงตามรูปแบบเดิม

## การ deploy
- รีโปนี้ deploy แบบ static site (เช่น GitHub Pages) ไม่มี CI/CD — การ push ไปยัง branch ที่ตั้งค่า Pages ไว้จะ deploy ทันที ดังนั้นควร verify การเปลี่ยนแปลงให้แน่ใจก่อน push ขึ้น branch หลัก

# Context: OmniShift-Ledger (ShiftPro Tracker)

แอปบันทึกกะการทำงาน คำนวณ OT / เบี้ยกะ / ภาษี / รายได้รายเดือน-รายปี ของพนักงานกะ (shift worker) เป็น **Single-file HTML app** ไม่มี build step, ไม่มี backend, เก็บข้อมูลทั้งหมดใน `localStorage` ของเบราว์เซอร์

## โครงสร้างไฟล์
```
index.html                   ทั้งแอป — HTML + CSS + JS ใน <script> เดียว (~3,500 บรรทัด)
help.html                    หน้าวิธีใช้/คู่มือ (static)
sw.js                        Service Worker — cache assets เพื่อใช้งาน offline (PWA)
manifest.webmanifest         PWA manifest (ชื่อแอป, ไอคอน, theme color)
icons/                       ไอคอนแอป (192/512/maskable)
mockup-highlight.html        ไฟล์ตัวอย่าง/ทดลอง UI (ไม่ใช่ส่วนของแอปจริง)
mockup-highlight-themes.html ไฟล์ตัวอย่าง/ทดลอง theme (ไม่ใช่ส่วนของแอปจริง)
```
ไม่มี `package.json`, ไม่มี framework, ไม่มีระบบ test อัตโนมัติ — แก้ไขแล้วเปิด `index.html` ในเบราว์เซอร์เพื่อทดสอบได้ทันที

## Dependencies (โหลดผ่าน CDN ใน `index.html`)
- Tailwind CSS (`cdn.tailwindcss.com`)
- Chart.js 4.4.4 + chartjs-plugin-annotation 3.0.1 (กราฟสรุปรายได้/OT)
- Google Fonts: Sarabun
- Gemini API (`generativelanguage.googleapis.com`) — เรียกตรงจาก client ด้วย API key ที่ผู้ใช้ใส่เอง (BYOK), โมเดลที่ใช้กำหนดใน `GEMINI_MODEL` (index.html:1229)

## โมเดลข้อมูล / การเก็บข้อมูล
- ทุกอย่างเก็บผ่าน wrapper `SS` (index.html:1524) ครอบ `localStorage` พร้อม fallback เป็น in-memory object ถ้า `localStorage` ใช้ไม่ได้ (private mode ฯลฯ)
- ข้อมูลแยกตามเดือน/ปีด้วยคีย์ที่ generate จาก `getMonthData(y, mo)` (index.html:2387)
- การตั้งค่า (เงินเดือน, เรตกะ, OT, ภาษี ฯลฯ) โหลด/บันทึกผ่าน `loadSettings()` / `saveSettings()`
- รูปแบบกะ (shift pattern) กำหนดใน `SHIFT_PATTERNS` (index.html:1388), ค่าเริ่มต้น `DEFAULT_PATTERN = 'legacy12'`
- วันหยุด: `FIXED_HOLIDAYS` (วันที่ตายตัวทุกปี) และ `VARIABLE_HOLIDAYS` (จันทรคติ/ชดเชย เก็บแยกรายปี ปัจจุบันมีถึงปี 2025–2027 — ต้องเพิ่มเองทุกปีเมื่อ ครม. ประกาศ) บวกวันหยุดส่วนตัวที่ผู้ใช้กำหนดเอง (custom holidays)
- Gemini API key เก็บเป็น **plain text** ใน `localStorage` คีย์ `geminiApiKey` (ไม่เข้ารหัส — ไม่ควรใช้บนเครื่องสาธารณะ)
- Backup/Restore: export/import ข้อมูลทั้งหมดเป็นไฟล์ JSON (`backupData()`, `restoreData()`)

## ฟีเจอร์หลัก (แท็บในแอป)
1. **Calendar** (`tab-calendar`) — บันทึกกะรายวัน (M/N/D/OFF), OT 1.5/2.0/3.0, ปฏิทินรายเดือน, สรุปแถบล่าง (วันทำงาน/ชม./OT/รายได้)
2. **Stats** (`tab-stats`) — สรุปรายปี (Annual Dashboard): รายได้รวม, OT, วันลาพักร้อน/ลาป่วย, กราฟ
3. **Settings** (`tab-settings`) — เงินเดือน, เรตกะเช้า/ดึก, ค่าบ้าน, โบนัสวันหยุด, PVD, ประกันสังคม, โบนัสประจำปี, OT สูงสุด/เดือน, shift pattern, การหมุนเวียนกะ, จัดการเหตุผล/วันหยุดส่วนตัว, Backup/Restore, ตั้งค่า Gemini AI
4. **Tax** (`tab-tax`) — คำนวณภาษีเงินได้บุคคลธรรมดาแบบไทย: ลดหย่อนส่วนตัว/ครอบครัว, ประกัน, กองทุน (RMF/SSF/Thai ESG/PVD), คำนวณผ่าน `calcThaiIncomeTax()`, `computeTaxDeductions()`
5. **Future** (`tab-future`) — ประมาณการ/วางแผนระยะยาว (PVD นายจ้างสมทบตามอายุงาน, สหกรณ์ ฯลฯ)
- ผู้ช่วย AI แชทถาม-ตอบเกี่ยวกับข้อมูลผู้ใช้ผ่าน Gemini (BYOK)
- Dark/Light mode (`applyTheme`, `loadTheme`)
- Responsive: เดสก์ท็อปเป็นตาราง, มือถือเป็นการ์ด (ออกแบบอ้างอิง Samsung S26 Ultra)
- Haptic feedback / เสียงแจ้งเตือนบนมือถือ (`hapticFeedback`, `_playTone`)

## PWA / Service Worker
- `sw.js` cache แบบ stale-while-revalidate, แคชไฟล์หลักและ CDN assets ไว้ตอน `install`
- เปลี่ยนค่า `CACHE` (เวอร์ชัน, ปัจจุบัน `shiftpro-v11-30`) ทุกครั้งที่ปล่อยเวอร์ชันใหม่ เพื่อล้าง cache เก่าของผู้ใช้ — **ถ้าแก้ asset แล้วลืม bump เวอร์ชันนี้ ผู้ใช้ที่ติดตั้งเป็น PWA แล้วจะไม่เห็นการเปลี่ยนแปลง**
- ไม่แคชการเรียก Gemini API (ต้องสดเสมอ)

## Deploy
- Static hosting ล้วน ๆ (เช่น GitHub Pages: Settings → Pages → branch `main` / root)
- ไม่มี CI/CD หรือ build pipeline ในโปรเจกต์นี้

## ข้อควรระวังเวลาแก้โค้ด
- ทั้งแอปอยู่ใน `index.html` ไฟล์เดียว — การแก้ไขควรหา section/function ที่เกี่ยวข้องด้วย grep ก่อน ไม่ต้อง refactor แยกไฟล์โดยไม่จำเป็น
- ไม่มี automated test — ทดสอบด้วยการเปิดไฟล์ในเบราว์เซอร์จริงและตรวจ flow ที่เกี่ยวข้อง (เช่น บันทึกกะ → ดู summary → ดู stats → ดู tax)
- เวลาเพิ่ม/แก้ asset ที่ถูกแคชโดย service worker ให้ bump `CACHE` ใน `sw.js`
- ภาษาในโค้ด/UI เป็นภาษาไทยทั้งหมด ให้คงรูปแบบภาษาเดิมเมื่อแก้ข้อความที่ผู้ใช้เห็น

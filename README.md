# ☕ BrewCraft - Coffee Shop Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat-square&logo=go)](https://go.dev/)
[![Gin Framework](https://img.shields.io/badge/Gin-v1.10-008ECF?style=flat-square)](https://gin-gonic.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**BrewCraft** คือเว็บแอปพลิเคชันระบบจัดการร้านกาแฟขนาดเล็ก พัฒนาด้วยสถาปัตยกรรม Monorepo โดยแบ่งหน้าที่ชัดเจน:
- **Frontend**: พัฒนาด้วย **Next.js (App Router)** ทำหน้าที่แสดงผล UI แคชเชียร์และแดชบอร์ด
- **Backend หลัก**: พัฒนาด้วยภาษา **Go (Gin Framework)** ทำหน้าที่ควบคุม Business Logic, คำนวณราคาสินค้า, ตรวจสอบความถูกต้อง, สรุปรายงาน และจัดการฐานข้อมูล
- **Database & Auth**: ใช้ **Firebase Cloud Firestore** เป็นฐานข้อมูล และ **Firebase Authentication (Google Sign-In)** สำหรับตรวจสอบสิทธิ์เจ้าของร้าน

---

## 📌 สารบัญ (Table of Contents)
1. [ฟีเจอร์เด่นของระบบ (Key Features)](#-1-ฟีเจอร์เด่นของระบบ-key-features)
2. [วิธีเริ่มต้นใช้งานด่วน (Quick Start)](#-2-วิธีเริ่มต้นใช้งานด่วน-quick-start)
3. [การตั้งค่า Environment Variables](#-3-การตั้งค่า-environment-variables)
4. [สถาปัตยกรรมและความปลอดภัย (Architecture & Security)](#-4-สถาปัตยกรรมและความปลอดภัย-architecture--security)
5. [โครงสร้างโค้ด (Project Structure)](#-5-โครงสร้างโค้ด-project-structure)
6. [รายการ API (REST API Endpoints)](#-6-รายการ-api-rest-api-endpoints)
7. [การทดสอบระบบ (Automated Tests)](#-7-การทดสอบระบบ-automated-tests)

---

## ✨ 1. ฟีเจอร์เด่นของระบบ (Key Features)

### 📊 แดชบอร์ดภาพรวมร้าน (Dashboard & Analytics)
- สรุปยอดขายรวมวันนี้, จำนวนบิล, และจำนวนสินค้าที่ขายได้แบบเรียลไทม์
- แสดง **เมนูขายดีที่สุด (Best Seller)** ประจำวัน
- **กราฟแท่งแนวโน้มยอดขายย้อนหลัง 7 วัน** (พัฒนาด้วย Recharts)
- แสดง 10 บิลล่าสุดที่เกิดขึ้นในร้าน
- คำนวณเวลาและตัดรอบวันอย่างแม่นยำตามเขตเวลาประเทศไทย (`Asia/Bangkok`, UTC+7)

### 🛒 แคชเชียร์ขายหน้าร้าน (Point of Sale - POS)
- เลือกเมนูสินค้า, ค้นหาตามชื่อ, และกรองตามหมวดหมู่ (Coffee, Tea, Other Drinks, Bakery)
- เพิ่ม/ลดจำนวนสินค้าในตะกร้า คำนวณยอดเงินรวมอัตโนมัติ
- **Responsive สำหรับ iPad & มือถือ**:
  - **iPad แนวนอน / Desktop**: แสดงหน้าจอสองฝั่ง (รายการสินค้าทางซ้าย + ตะกร้าทางขวา) พร้อมทำงานจริง
  - **iPad แนวตั้ง / มือถือ**: มีแท็บสลับ `เมนูสินค้า` และ `ตะกร้าสินค้า` พร้อมแถบลอย **Floating Cart Pill** กดสลับดูยอดได้ในคลิกเดียว
  - ความสูงปรับแบบ `100dvh` ป้องกันการโดนแถบ URL ของ Safari/Chrome ทับปุ่มบันทึก
- มีหน้าต่าง Pop-up ยืนยันการคิดเงิน ป้องกันการกดยืนยันซ้ำจนเกิดบิลเบิ้ล
- สามารถสั่งพิมพ์ใบเสร็จ (Print Receipt) ได้ทันทีหลังทำรายการเสร็จ

### 📋 จัดการรายการเมนูสินค้า (Menu Management)
- เพิ่มสินค้าใหม่, แก้ไขชื่อ, หมวดหมู่ และราคา
- ระบบเปิด/ปิดการขายสินค้าชั่วคราว (`isActive`: Available / Unavailable)
- **Soft Protection**: สินค้าที่เคยมีประวัติการขายแล้วจะไม่ถูกลบทำลายข้อมูล เพื่อคงความถูกต้องของบัญชีย้อนหลัง
- **Dual-View**: แสดงผลแบบตารางบนคอมพิวเตอร์/แท็บเล็ต และปรับเป็นการ์ดสินค้ากะทัดรัดบนมือถือ

### 🧾 ประวัติการขายและบิลย้อนหลัง (Sales History)
- แสดงรายการบิลเรียงจากใหม่สุดไปเก่าสุด รองรับระบบ Pagination
- กรองค้นหาบิลตามช่วงวันที่ (Date Range: จากวันที่ - ถึงวันที่)
- กดดูรายละเอียดในแต่ละบิล (ชื่อสินค้า, จำนวน, ราคาต่อหน่วย, ยอดรวม, ผู้บันทึก) พร้อมปุ่มสั่งพิมพ์ใบเสร็จ

### 🔒 สิทธิ์การเข้าใช้งานเฉพาะเจ้าของร้าน (Owner Portal)
- เข้าสู่ระบบด้วย **Google Sign-In** สะดวก ปลอดภัย ไม่ต้องจำรหัสผ่าน
- Go Backend ตรวจสอบ Firebase ID Token จากฝั่งเซิร์ฟเวอร์
- อนุญาตเฉพาะอีเมลที่ระบุไว้ใน `OWNER_EMAIL` เท่านั้น (ผู้ใช้ Google บัญชีอื่นจะถูกปฏิเสธด้วย HTTP 403 Forbidden ทันที)
- **รองรับหลายอีเมล**: สามารถกำหนดอีเมลเจ้าของร้านได้มากกว่า 1 บัญชี คั่นด้วยเครื่องหมายจุลภาค (`,`)
- มี Modal ยืนยันก่อนออกจากระบบ (Logout Confirmation)

---

## 🚀 2. วิธีเริ่มต้นใช้งานด่วน (Quick Start)

สามารถเลือกรันได้ 2 วิธี ตามความสะดวก:

### ทางเลือกที่ 1: รันด่วนแบบ In-Memory Mock (ไม่ต้องใช้ Firebase ก็เปิดดูระบบได้ทันที)
ในโหมดนี้ Go Backend จะใช้ฐานข้อมูลจำลองในแรม พร้อมโหลดเมนูตัวอย่าง 12 รายการให้ทันที เหมาะสำหรับเปิดดู UI หรือทดสอบฟังก์ชัน:

1. **รัน Go Backend**:
   ```powershell
   cd backend
   go run ./cmd/server/main.go
   ```
   *(เซิร์ฟเวอร์จะเปิดที่ `http://localhost:8080`)*

2. **รัน Next.js Frontend** (เปิด Terminal ใหม่):
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   *(เปิดบราวเซอร์ไปที่ `http://localhost:3000`)*

---

### ทางเลือกที่ 2: รันร่วมกับ Firebase จริง (Cloud Firestore & Authentication)

1. วางไฟล์กุญแจ `serviceAccountKey.json` ที่ดาวน์โหลดจาก Firebase Console ไว้ในโฟลเดอร์ `backend/`
2. ตรวจสอบไฟล์ `backend/.env`:
   ```env
   USE_MOCK_DB=false
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   FIREBASE_PROJECT_ID=coffee-shop-system-90a60
   OWNER_EMAIL=your-google-email@gmail.com
   ```
3. ตรวจสอบค่าคอนฟิก Firebase Web App ในไฟล์ `frontend/.env.local`
4. รันคำสั่ง `go run ./cmd/server/main.go` ในโฟลเดอร์ `backend` และ `npm run dev` ในโฟลเดอร์ `frontend`

---

## ⚙️ 3. การตั้งค่า Environment Variables

### 1. Backend (`backend/.env`)

| Key | คำอธิบาย | ตัวอย่างค่า |
|---|---|---|
| `PORT` | พอร์ตสำหรับรัน Go REST API | `8080` |
| `FRONTEND_ORIGIN` | URL ของ Frontend สำหรับอนุญาต CORS | `http://localhost:3000` |
| `OWNER_EMAIL` | **อีเมล Google ของเจ้าของร้าน** (ใส่ได้หลายอีเมลคั่นด้วย `,`) | `owner1@gmail.com, owner2@gmail.com` |
| `FIREBASE_PROJECT_ID` | Project ID บน Firebase | `coffee-shop-system-90a60` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path ไฟล์ Service Account Key | `./serviceAccountKey.json` |
| `USE_MOCK_DB` | สลับโหมด Mock In-Memory (`true` / `false`) | `false` |

> [!TIP]
> **วิธีเพิ่มสิทธิ์อีเมลเจ้าของร้าน**: แก้ไขที่บรรทัด `OWNER_EMAIL` ในไฟล์ `backend/.env` โดยคั่นด้วย `,` แล้วกด Restart Go Backend ได้เลยครับ

### 2. Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coffee-shop-system-90a60.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coffee-shop-system-90a60
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

## 🏛️ 4. สถาปัตยกรรมและความปลอดภัย (Architecture & Security)

```
┌─────────────────────────────────┐
│     Next.js Frontend (3000)     │
│  - แคชเชียร์หน้าร้าน (POS)        │
│  - จัดการเมนู / ประวัติการขาย     │
│  - Google Sign-In               │
└───────────────┬─────────────────┘
                │ HTTP Request พร้อม Header:
                │ Authorization: Bearer <FIREBASE_ID_TOKEN>
                ▼
┌────────────────────────────────────────────────────────┐
│                   Go Gin Backend (8080)                │
│                                                        │
│  1. Auth Middleware                                    │
│     - ถอดรหัส & ยืนยัน Token ด้วย Firebase Admin SDK     │
│     - ตรวจสอบอีเมลว่าตรงกับ OWNER_EMAIL หรือไม่          │
│                                                        │
│  2. Zero-Trust Pricing Service                         │
│     - ไม่เชื่อถือราคารวมที่ Frontend ส่งมา                │
│     - คิวรีราคาและสถานะพร้อมขายจริงจาก Firestore           │
│     - คำนวณยอดเงินรวมด้วยหน่วยสตางค์ (Satang Precision)   │
└──────────────────────────┬─────────────────────────────┘
                           │ Service Account Connection
                           ▼
              ┌────────────────────────┐
              │  Cloud Firestore DB    │
              │  - users               │
              │  - products            │
              │  - orders              │
              └────────────────────────┘
```

### มาตรการความปลอดภัยสำคัญ:
1. **Zero-Trust Pricing Architecture**: Frontend ส่งมาเฉพาะ `productId` และ `quantity` เท่านั้น ตัว Go Backend จะนำรหัสสินค้าไปดึงข้อมูลจริงจากฐานข้อมูล ตรวจสอบว่าสินค้ายังเปิดขายอยู่หรือไม่ (`isActive == true`) แล้วคำนวณราคาสุทธิเอง ป้องกันการดัดแปลงราคาจากหน้าเว็บ 100%
2. **Satang-Precision Currency**: ทุกจำนวนเงินจัดเก็บและประมวลผลเป็น **จำนวนเต็มสตางค์ (Integer Satang)** เช่น 65.00 บาท = `6500` สตางค์ เพื่อแก้ปัญหาความคลาดเคลื่อนของทศนิยม (Floating-point error)
3. **Sole Authority Backend**: Cloud Firestore ปิดกั้นการอ่าน/เขียนจาก Client Browser โดยตรงผ่าน Security Rules (`allow read, write: if false;`) ทุกคำขอต้องวิ่งผ่าน Go Backend ที่ถือ Service Account Key เท่านั้น

---

## 📁 5. โครงสร้างโค้ด (Project Structure)

```
coffee-shop-management-system/
├── frontend/                     # โค้ดส่วนหน้าบ้าน (Next.js 15 App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/     # หน้าเข้าสู่ระบบ Google Sign-In
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx      # แดชบอร์ดสรุปยอดขาย + กราฟ 7 วัน
│   │   │   │   ├── pos/page.tsx  # แคชเชียร์ขายหน้าร้าน (POS)
│   │   │   │   ├── menu/page.tsx # จัดการเมนูสินค้า (เพิ่ม/แก้ไข/เปิด-ปิดขาย)
│   │   │   │   └── orders/       # ประวัติการขาย + รายละเอียดบิล
│   │   │   └── layout.tsx        # Viewport, Toast และ Auth Provider
│   │   ├── components/           # UI Components (Dialog, Button, Header, Sidebar)
│   │   ├── hooks/                # useAuth, useToast
│   │   └── lib/api.ts            # REST Client ติดต่อ Go Backend
├── backend/                      # โค้ดส่วนหลังบ้าน (Go Gin Framework)
│   ├── cmd/server/main.go        # จุดเริ่มต้นของระบบ & การปิดระบบแบบ Graceful Shutdown
│   ├── internal/
│   │   ├── config/               # โหลด Environment Variables
│   │   ├── models/               # Data Models (Product, Order, User, DTOs)
│   │   ├── middleware/           # ตรวจสอบ Firebase Token (Auth) & CORS
│   │   ├── repositories/         # ติดต่อ Firestore และ Mock DB
│   │   ├── services/             # Business Logic (คำนวณเงิน, สรุปแดชบอร์ด)
│   │   ├── handlers/             # ตัวรับส่ง HTTP Request/Response
│   │   └── routes/               # กำหนดเส้นทาง API (/api/v1)
│   └── serviceAccountKey.json    # กุญแจยืนยันสิทธิ์ Firebase Admin
├── firestore.rules               # กฎความปลอดภัย Firestore
└── README.md
```

---

## 🔌 6. รายการ API (REST API Endpoints)

ทุก Endpoint (ยกเว้น `/health`) ต้องแนบ Header:  
`Authorization: Bearer <FIREBASE_ID_TOKEN>`

| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|:---:|---|
| `GET` | `/health` | สาธารณะ | ตรวจสอบสถานะการทำงานของ Go Server |
| `GET` | `/api/v1/auth/me` | Owner | ตรวจสอบสิทธิ์และซิงค์โปรไฟล์เจ้าของร้าน |
| `GET` | `/api/v1/products` | Owner | ดึงรายการสินค้าทั้งหมด (รองรับ Filter & Search) |
| `POST` | `/api/v1/products` | Owner | เพิ่มเมนูสินค้าใหม่ |
| `PUT` | `/api/v1/products/:id` | Owner | แก้ไขชื่อ, หมวดหมู่ และราคา |
| `PATCH` | `/api/v1/products/:id/status` | Owner | สลับสถานะเปิดขาย/ปิดการขายชั่วคราว |
| `POST` | `/api/v1/orders` | Owner | บันทึกการขาย (คำนวณราคาสุทธิจากฐานข้อมูล) |
| `GET` | `/api/v1/orders` | Owner | ดึงประวัติการขาย (รองรับ Pagination และช่วงวันที่) |
| `GET` | `/api/v1/orders/:id` | Owner | ดูรายละเอียดสินค้าและยอดเงินในบิลนั้นๆ |
| `GET` | `/api/v1/dashboard/summary` | Owner | ดึงสรุปยอดขายวันนี้, สินค้าขายดี, ยอด 7 วันย้อนหลัง |

---

## 🧪 7. การทดสอบระบบ (Automated Tests)

### รัน Go Unit Tests (Backend)
ทดสอบการทำงานของ Business Logic, ความแม่นยำในการคำนวณเงินแบบ Zero-Trust, การตรวจสอบสิทธิ์ และการปฏิเสธสินค้าที่ไม่พร้อมขาย:
```powershell
cd backend
go test -v ./...
```
**ผลการทดสอบ**: ผ่าน 100% (Pass ทุกกรณีทดสอบ)

### รัน Production Build (Frontend)
ตรวจสอบความสมบูรณ์ของ TypeScript และคอมไพล์หน้าเพจทั้งหมด:
```powershell
cd frontend
npm run build
```
**ผลการทดสอบ**: คอมไพล์ Static Page ผ่านสมบูรณ์ ไร้ข้อผิดพลาด

---

## 👨‍💻 ผู้พัฒนา
- **มหาวิทยาลัย**: โปรเจกต์วิชาระบบจัดการร้านกาแฟ (University Project)
- **GitHub**: [Tewan0](https://github.com/Tewan0)
- **ลิขสิทธิ์**: MIT License

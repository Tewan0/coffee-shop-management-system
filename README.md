# ☕ Coffee Shop Management System (BrewCraft)

Web Application สำหรับระบบจัดการร้านกาแฟขนาดเล็ก พัฒนาด้วยสถาปัตยกรรม Monorepo โดยใช้ **Next.js (App Router)** เป็น Frontend, **Go (Golang + Gin)** เป็น Backend หลักสำหรับ Business Logic และคำนวณเงินทั้งหมด และ **Firebase (Cloud Firestore + Firebase Authentication with Google Sign-In)** เป็นฐานข้อมูลและการยืนยันตัวตน

---

## 1. Project Overview & Highlights

- **Sole Backend Authority**: โค้ดฝั่ง Frontend ไม่มีการอ่าน/เขียน Cloud Firestore โดยตรง ทุกคำขอต้องผ่าน REST API ของ Go Backend
- **Zero-Trust Pricing Architecture**: Go Backend ทำการ Query ราคาและสถานะของสินค้าจาก Firestore ทุกครั้งที่มีการสั่งซื้อจาก POS ไม่เชื่อถือราคารวมหรือราคาสินค้าที่ Frontend ส่งมา
- **Satang-Precision Currency**: จัดเก็บและคำนวณเงินทั้งหมดด้วยหน่วยสตางค์ (Integer Satang: 1 บาท = 100 สตางค์) เพื่อป้องกัน Floating-point precision error 100%
- **Single Owner Authorization**: ระบบอนุญาตให้เฉพาะบัญชี Google ของเจ้าของร้านที่ระบุไว้ใน `OWNER_EMAIL` เท่านั้นที่เข้าถึงข้อมูลร้านได้ หากเป็นบัญชี Google อื่นจะได้รับ HTTP 403 Forbidden
- **Asia/Bangkok Timezone Handling**: การสรุปยอดขายประจำวันและกราฟแนวโน้ม 7 วัน ยึดตามเขตเวลาประเทศไทย (`Asia/Bangkok`, UTC+7) อย่างแม่นยำ
- **Graceful Mock Fallback**: มี In-Memory Repository สำหรับการทดสอบ (Unit Test) และการรันแบบ Offline Local Dev โดยไม่ต้องต่อเน็ต

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Design System & Components**: shadcn/ui pattern, Lucide Icons
- **Data Visualization**: Recharts (สำหรับกราฟยอดขายย้อนหลัง 7 วัน)
- **Authentication**: Firebase Client SDK (สำหรับ Google Sign-In และดึง Firebase ID Token เท่านั้น)

### Backend
- **Language**: Go (Golang 1.24+)
- **HTTP Framework**: Gin Web Framework
- **Firebase / GCP SDK**: 
  - `firebase.google.com/go/v4` (Firebase Admin SDK)
  - `cloud.google.com/go/firestore` (Cloud Firestore Client)
  - `google.golang.org/api/option`
- **Architecture**: Clean Layered Architecture (`handlers` -> `services` -> `repositories` -> `models`)

### Database & Security
- **Database**: Google Cloud Firestore (NoSQL Document Store)
- **Authentication Provider**: Firebase Authentication (Google Identity Provider)
- **Rules**: Firestore Security Rules ปิดการเข้าถึงจาก Client โดยตรง (`allow read, write: if false;`)

---

## 3. System Architecture & Flow

```
[ User Browser / Cashier ]
           │
           │ 1. Sign in with Google Popup
           ▼
[ Firebase Auth ] ──( 2. Issues Firebase ID Token )──► [ Next.js Frontend ]
                                                              │
                                                              │ 3. REST API Requests
                                                              │    Header: Authorization: Bearer <ID_TOKEN>
                                                              ▼
                                                     [ Go (Gin) Backend ]
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      ▼                                               ▼
                         [ Auth Middleware ]                                 [ Business Services ]
                     Verify ID Token via Admin SDK                       Zero-trust Price Calculation
                     Check Claims: email == OWNER_EMAIL                   Asia/Bangkok Daily Summaries
                                      │                                               │
                                      └───────────────────────┬───────────────────────┘
                                                              ▼
                                                   [ Cloud Firestore DB ]
                                                 (Service Account Access)
```

---

## 4. Project Structure

```
coffee-shop-management-system/
├── frontend/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx        # หน้า Login with Google
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx            # Protected Layout + Desktop Sidebar / Mobile Nav
│   │   │   │   ├── page.tsx              # หน้าแดชบอร์ดสรุปยอดขาย + กราฟ 7 วัน
│   │   │   │   ├── pos/page.tsx          # จุดขายหน้าร้าน (Cashier POS)
│   │   │   │   ├── menu/page.tsx         # จัดการเมนู (เพิ่ม/แก้ไข/เปิด-ปิดขาย)
│   │   │   │   └── orders/page.tsx       # ประวัติการขาย + ดูรายละเอียดบิล
│   │   │   ├── globals.css               # สไตล์สีธีมร้านกาแฟ + Font Prompt
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── layout/                   # Sidebar, Header
│   │   │   └── ui/                       # Button, Input, Card, Badge, Dialog, Skeleton
│   │   ├── hooks/
│   │   │   ├── use-auth.tsx              # Google Auth & Token Management Context
│   │   │   └── use-toast.tsx             # Toast Notifications
│   │   ├── lib/
│   │   │   ├── firebase.ts               # Firebase Client SDK (Auth only)
│   │   │   ├── api.ts                    # REST API Client เรียกหา Go Backend
│   │   │   └── utils.ts                  # แปลงสตางค์เป็นบาท, จัดการวันที่
│   │   ├── types/                        # TypeScript Interfaces
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
├── backend/                      # Go REST Backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go                   # Entrypoint & Graceful Shutdown
│   ├── internal/
│   │   ├── config/                       # อ่าน Environment Variables
│   │   ├── models/                       # Data Models & DTOs
│   │   ├── middleware/                   # Auth (Token Verification) & CORS
│   │   ├── repositories/
│   │   │   ├── interfaces.go             # Repository Contracts
│   │   │   ├── firestore/                # Cloud Firestore Implementation
│   │   │   └── mock/                     # In-Memory Mock สำหรับทดสอบ/ออฟไลน์
│   │   ├── services/                     # Business Logic (Order, Product, Dashboard)
│   │   ├── handlers/                     # HTTP Handlers
│   │   └── routes/                       # Router Setup & Grouping
│   ├── tests/ or internal/.../*_test.go  # Unit Tests (Zero-trust, Auth, Dashboard)
│   ├── .env.example
│   ├── go.mod
│   └── go.sum
├── firestore.rules               # Firestore Security Rules (Deny direct client access)
├── firestore.indexes.json        # Firestore Composite Indexes
├── .gitignore
└── README.md
```

---

## 5. Firestore Data Design

### 5.1 `users/{uid}`
บันทึกข้อมูลเจ้าของร้านเมื่อเข้าสู่ระบบ:
| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase UID |
| `email` | string | Email ของเจ้าของร้าน |
| `displayName` | string | ชื่อที่แสดง |
| `photoURL` | string | รูปโปรไฟล์จาก Google |
| `createdAt` | timestamp | เวลาที่สร้างผู้ใช้ครั้งแรก |
| `lastLoginAt` | timestamp | เวลาที่เข้าสู่ระบบล่าสุด |

### 5.2 `products/{productId}`
รายการเมนูเครื่องดื่มและเบเกอรี่:
| Field | Type | Description |
|---|---|---|
| `name` | string | ชื่อเมนู เช่น "Espresso", "Matcha Latte" |
| `category` | string | "Coffee" \| "Tea" \| "Other Drinks" \| "Bakery" |
| `priceSatang` | integer | ราคาในหน่วยสตางค์ (เช่น 6500 = 65.00 บาท) |
| `isActive` | boolean | สถานะเปิดขาย (`true`) หรือปิดการขายชั่วคราว (`false`) |
| `createdAt` | timestamp | เวลาที่สร้างสินค้า |
| `updatedAt` | timestamp | เวลาที่มีการแก้ไขล่าสุด |

### 5.3 `orders/{orderId}`
บิลประวัติการขาย:
| Field | Type | Description |
|---|---|---|
| `items` | array | รายการสินค้าที่สั่งซื้อ (Snapshot ข้อมูลขณะขาย) |
| ↳ `productId` | string | รหัสสินค้า |
| ↳ `productName` | string | ชื่อสินค้า ณ เวลาที่ขาย |
| ↳ `quantity` | integer | จำนวนแก้ว/ชิ้นที่สั่ง |
| ↳ `unitPriceSatang` | integer | ราคาต่อหน่วย ณ เวลาที่ขาย (หน่วยสตางค์) |
| ↳ `subtotalSatang` | integer | ราคารวมของรายการนี้ (`unitPriceSatang * quantity`) |
| `totalSatang` | integer | ยอดชำระสุทธิของบิล (หน่วยสตางค์) |
| `totalQuantity` | integer | จำนวนสินค้าทั้งหมดในบิล |
| `createdBy` | string | Firebase UID ของผู้บันทึกการขาย |
| `createdAt` | timestamp | วัน-เวลาที่บันทึกบิล |

---

## 6. REST API Endpoints

ทุก Endpoint ภายใต้ `/api/v1` (ยกเว้น `/health`) ต้องส่ง Header:
`Authorization: Bearer <FIREBASE_ID_TOKEN>`

### Public
- `GET /health` : ตรวจสอบสถานะการทำงานของ Go Backend Server

### Authentication
- `GET /api/v1/auth/me` : ดึงข้อมูลและ Sync โปรไฟล์ของเจ้าของร้าน

### Products
- `GET /api/v1/products` : ดึงรายการสินค้าทั้งหมด (รองรับ Query: `?category=Coffee&search=latte&activeOnly=true`)
- `GET /api/v1/products/:id` : ดึงข้อมูลสินค้ารายชิ้น
- `POST /api/v1/products` : เพิ่มเมนูสินค้าใหม่
- `PUT /api/v1/products/:id` : แก้ไขชื่อ, หมวดหมู่, และราคาสินค้า
- `PATCH /api/v1/products/:id/status` : สลับสถานะเปิดขาย/ปิดการขาย (`isActive`)

### Orders & POS
- `POST /api/v1/orders` : บันทึกการขาย (Backend คำนวณราคาจริงจากฐานข้อมูล)
- `GET /api/v1/orders` : ดึงรายการประวัติการขาย (รองรับ Pagination `?limit=15&offset=0` และ Date Filter `?startDate=2026-11-01&endDate=2026-11-03`)
- `GET /api/v1/orders/:id` : ดึงรายละเอียดสินค้าและยอดเงินในบิลนั้นๆ

### Dashboard
- `GET /api/v1/dashboard/summary` : ดึงสรุปยอดขายวันนี้, จำนวนบิล, สินค้าขายดี, ยอดขาย 7 วันย้อนหลัง และ 10 บิลล่าสุด

---

## 7. Environment Variables

### Backend (`backend/.env`)
สร้างไฟล์ `backend/.env` โดยคัดลอกจาก `backend/.env.example`:
```env
PORT=8080
FRONTEND_ORIGIN=http://localhost:3000

# Store Owner Email (ระบุอีเมล Google ของคุณที่ใช้เข้าสู่ระบบ)
OWNER_EMAIL=your-owner-email@gmail.com

# Firebase Service Account & Project ID
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# ตั้งเป็น true หากต้องการทดสอบแบบ Mock DB โดยไม่ต้องใช้ Service Account
USE_MOCK_DB=false
```

### Frontend (`frontend/.env.local`)
สร้างไฟล์ `frontend/.env.local` โดยคัดลอกจาก `frontend/.env.example`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

## 8. วิธีการติดตั้งและการรันระบบ

### ขั้นตอนที่ 1: เตรียม Firebase Project (หากต้องการใช้งาน Firebase จริง)
1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วสร้างโปรเจกต์ใหม่
2. ไปที่ **Authentication** -> **Sign-in method** -> เปิดใช้งาน **Google Provider**
3. ไปที่ **Cloud Firestore** -> คลิก **Create Database** (เลือกโหมด Production และ Region เช่น `asia-southeast1`)
4. ดาวน์โหลด Service Account Key:
   - ไปที่ **Project Settings** -> แท็บ **Service accounts**
   - คลิกปุ่ม **Generate new private key**
   - นำไฟล์ที่ได้มาวางในโฟลเดอร์ `backend/` แล้วตั้งชื่อเป็น `serviceAccountKey.json`
5. นำ Firebase Web App Config จากหน้า **Project Settings** -> **General** มาใส่ใน `frontend/.env.local`
6. นำไฟล์ `firestore.rules` ไป Deploy บน Firebase Console:
   ```bash
   firebase deploy --only firestore:rules
   ```

### ขั้นตอนที่ 2: รัน Go Backend
เปิด Terminal ที่โฟลเดอร์ `backend/`:
```bash
cd backend
go run ./cmd/server/main.go
```
เซิร์ฟเวอร์จะเริ่มทำงานที่ `http://localhost:8080` (หรือ Port ที่ระบุไว้)

### ขั้นตอนที่ 3: รัน Next.js Frontend
เปิด Terminal อีกหน้าต่างที่โฟลเดอร์ `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
เปิดบราวเซอร์ที่ `http://localhost:3000`

---

## 9. การทดสอบระบบ (Testing & Verification)

### 9.1 รัน Go Unit Tests
ทดสอบตรรกะการคำนวณเงิน, Zero-Trust Verification, การปฏิเสธสินค้า Inactive, และการตรวจสอบสิทธิ์ Owner:
```bash
cd backend
go test -v ./...
```
ผลลัพธ์:
```
=== RUN   TestAuthMiddleware_MissingHeader_Returns401
--- PASS: TestAuthMiddleware_MissingHeader_Returns401 (0.00s)
=== RUN   TestAuthMiddleware_NonOwner_Returns403
--- PASS: TestAuthMiddleware_NonOwner_Returns403 (0.00s)
=== RUN   TestAuthMiddleware_OwnerAllowed_Returns200
--- PASS: TestAuthMiddleware_OwnerAllowed_Returns200 (0.00s)
=== RUN   TestDashboardService_GetSummary
--- PASS: TestDashboardService_GetSummary (0.02s)
=== RUN   TestOrderService_CreateOrder_ZeroTrustPricing
--- PASS: TestOrderService_CreateOrder_ZeroTrustPricing (0.00s)
=== RUN   TestOrderService_CreateOrder_InactiveProductRejected
--- PASS: TestOrderService_CreateOrder_InactiveProductRejected (0.00s)
=== RUN   TestOrderService_CreateOrder_EmptyCartRejected
--- PASS: TestOrderService_CreateOrder_EmptyCartRejected (0.00s)
=== RUN   TestOrderService_CreateOrder_NegativeOrZeroQuantityRejected
--- PASS: TestOrderService_CreateOrder_NegativeOrZeroQuantityRejected (0.00s)
PASS
```

### 9.2 ตรวจสอบ Frontend Build & TypeScript
ทดสอบคอมไพล์ Next.js ให้พร้อมสำหรับการ Production:
```bash
cd frontend
npm run build
```
ทุกหน้าเพจ (`/`, `/login`, `/menu`, `/pos`, `/orders`) คอมไพล์แบบ Static Generation ผ่านเรียบร้อย ไร้ข้อผิดพลาด

---

## 10. ข้อจำกัดของระบบ (System Constraints)

1. **Owner-Only Authentication**: ระบบออกแบบมาสำหรับร้านกาแฟขนาดเล็กที่มีผู้ดูแลระบบเพียงบทบาทเดียวคือเจ้าของร้าน (Owner) จึงยังไม่รองรับระบบแยกสิทธิ์พนักงาน (Staff / Barista RBAC)
2. **Online Connection**: การทำงานของ POS ต้องเชื่อมต่อกับ Go Backend เพื่อตรวจสอบราคาและบันทึกบิล ไม่รองรับ Offline IndexedDB Sync ในเวอร์ชันนี้
3. **No Direct Inventory Depletion**: ในเวอร์ชันนี้ยังไม่มีระบบสต็อกวัตถุดิบ (Raw Ingredient Inventory) เมนูจะแสดงสถานะตาม Flag `isActive` (พร้อมขาย/ปิดการขาย)

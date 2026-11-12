# wheremycv

เว็บแอป (LINE LIFF) ช่วยจำว่าส่ง CV/Resume ไปที่ไหน เมื่อไหร่ ใครตอบกลับแล้วบ้าง มีนัดสัมภาษณ์วันไหน พร้อมแจ้งเตือนผ่าน LINE

- การ์ดรายการสมัครงาน + timeline แนวตั้ง (สัมภาษณ์แต่ละรอบแยกกัน)
- เตือนในแอปเมื่อส่งไปนานแล้วยังเงียบ / นัดใกล้ถึง (ตั้งจำนวนวันเองได้)
- สรุปประจำวันเข้า LINE (ส่งเฉพาะวันที่มีเรื่องต้องเตือน)
- ปฏิทินในแอป + ปุ่มเพิ่มลง Google Calendar / ไฟล์ .ics
- สถิติ: อัตราตอบกลับ ช่องทางไหนได้ผล ส่งต่อสัปดาห์

**เป็นแบบ self-host:** โคลน repo นี้ไป ใช้ LINE และ Cloudflare ของตัวเอง ข้อมูลอยู่ในบัญชีของคุณเท่านั้น
ทั้งหมดใช้ได้ใน free tier ของ Cloudflare และ LINE OA

Stack: Next.js (App Router) · Cloudflare Workers ผ่าน [OpenNext](https://opennext.js.org/cloudflare) · Cloudflare D1 + Drizzle · LINE LIFF + Messaging API

---

## ติดตั้ง

### 0. สิ่งที่ต้องมี

- Node.js 22+ และ Git
- บัญชี [Cloudflare](https://dash.cloudflare.com) (ฟรี)
- บัญชี [LINE Developers](https://developers.line.biz) (ใช้บัญชี LINE ปกติ)
- โคลน repo นี้ (หรือกด Use this template / fork) แล้วรัน `npm install`

### 1. LINE

> ⚠️ ทุกอย่างต้องอยู่ใน **Provider เดียวกัน** — LINE userId ผูกกับ provider ถ้าคนละ provider แอปจะส่งข้อความหาคุณไม่ได้

1. LINE Developers → สร้าง **Provider**
2. สร้าง **LINE Official Account** ที่ [LINE Official Account Manager](https://manager.line.biz) → Settings → Messaging API → **Enable** แล้วเลือก provider ข้อ 1
3. LINE Developers → channel Messaging API ที่เพิ่งได้ → แท็บ Messaging API → ออก **Channel access token (long-lived)** → เก็บไว้เป็น `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`
4. ใช้มือถือ **แอดเพื่อน** OA ของตัวเอง (สแกน QR ในแท็บ Messaging API)
5. ใน provider เดียวกัน สร้าง **LINE Login channel** → จด **Channel ID** เป็น `LINE_LOGIN_CHANNEL_ID`
   - Basic settings → **Linked LINE Official Account** เลือก OA ข้อ 2
6. ใน Login channel → แท็บ LIFF → **Add**
   - Size: **Full** · Scopes: `openid`, `profile`
   - Endpoint URL: ใส่ `https://example.com` ไปก่อน (แก้หลัง deploy)
   - จด **LIFF ID** เป็น `LIFF_ID`

### 2. Cloudflare D1

Dashboard → Storage & databases → **D1** → Create → ชื่อ `wheremycv` → ก๊อป **Database ID** ไปแทนค่า `database_id` ใน [`wrangler.jsonc`](wrangler.jsonc) แล้ว commit

(ID นี้ไม่ใช่ความลับ — ใช้ได้เฉพาะในบัญชี Cloudflare ของคุณ)

### 3. Deploy ด้วย Workers Builds (push เข้า `main` แล้ว deploy เอง)

Dashboard → Workers & Pages → Create → **Import a repository** → เลือก repo ของคุณ

| ช่อง | ใส่ |
|---|---|
| Project name | `wheremycv` (ต้องตรงกับ `name` ใน `wrangler.jsonc`) |
| Build command | `npm run cf:build` |
| Deploy command | `npm run cf:deploy` (apply migration ของ D1 แล้ว deploy) |
| Enable Preview builds | ปิด |
| Protect with Cloudflare Access | **ปิด** (ถ้าเปิด LINE จะเข้าแอปไม่ได้) |

จากนั้น Worker → Settings → **Variables and Secrets** ใส่ค่าต่อไปนี้ (ค่าที่เป็นความลับเลือกชนิด **Secret**):

| ตัวแปร | ค่า |
|---|---|
| `APP_URL` | URL ของเว็บ เช่น `https://wheremycv.example.com` |
| `AUTH_SECRET` | ค่าสุ่ม 32 ตัวอักษรขึ้นไป: `openssl rand -hex 32` (Secret) |
| `ALLOWED_LINE_USER_IDS` | LINE userId ที่อนุญาต คั่นด้วย `,` — ยังไม่รู้ให้เว้นว่างไว้ก่อน (ดูข้อ 5) |
| `LINE_LOGIN_CHANNEL_ID` | จากข้อ 1.5 |
| `LIFF_ID` | จากข้อ 1.6 |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | จากข้อ 1.3 (Secret) |

แล้ว Deployments → **Retry / Deploy** อีกครั้งให้ค่าใหม่มีผล

### 4. โดเมน

`wrangler.jsonc` ปิด URL `workers.dev` ไว้ (`workers_dev: false`) ให้เข้าได้ทางโดเมนของคุณทางเดียว:

Worker → Settings → **Domains & Routes** → Add → **Custom domain** → เช่น `wheremycv.example.com`

> ถ้าไม่มีโดเมน: แก้ `workers_dev` เป็น `true` ใน `wrangler.jsonc` แล้วใช้ `https://wheremycv.<subdomain>.workers.dev`

จากนั้นกลับไปแก้ **LIFF Endpoint URL** (ข้อ 1.6) เป็น URL นี้

### 5. ล็อกอินครั้งแรก

1. เปิด `https://liff.line.me/<LIFF_ID>` ในแชต LINE (ส่งให้ตัวเองแล้วกด)
2. ครั้งแรกจะเจอหน้า **“บัญชีนี้ไม่มีสิทธิ์ใช้งาน”** พร้อม **User ID ของคุณ** — ก๊อปไปใส่ `ALLOWED_LINE_USER_IDS` แล้ว deploy ใหม่
3. เปิดลิงก์อีกครั้ง → เข้าแอปได้ → หน้าตั้งค่า → **ส่งข้อความทดสอบ** เพื่อเช็กว่า LINE OA ส่งหาคุณได้
4. (แนะนำ) ตั้ง Rich menu ของ OA ให้มีปุ่มเปิดลิงก์ LIFF

---

## รันบนเครื่อง

```bash
cp .dev.vars.example .dev.vars    # แล้วกรอกค่า (ไฟล์นี้ถูก gitignore ไว้)
npm run db:migrate:local          # สร้างตารางใน D1 จำลองบนเครื่อง
npm run dev                       # http://localhost:3000
```

LIFF ใช้กับ localhost ไม่ได้ ให้ใส่ userId อะไรก็ได้ที่ขึ้นต้นด้วย `U` ตามด้วย 32 ตัวอักษร (เช่น `U00000000000000000000000000000001`) ทั้งใน `ALLOWED_LINE_USER_IDS` และ `DEV_LOGIN_LINE_USER_ID` แล้วกดปุ่ม **Dev login** (ปุ่มนี้ใช้ได้เฉพาะ `npm run dev` บน localhost — production ปิดไว้เสมอ)

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server |
| `npm test` | unit tests |
| `npm run typecheck` | เช็ก TypeScript |
| `npm run db:generate` | สร้าง migration ใหม่หลังแก้ `src/db/schema.ts` |
| `npm run cf:preview` | build แบบ Cloudflare แล้วรันบนเครื่อง |

## ความปลอดภัย

- ไม่มี secret ใดๆ ใน repo — ค่าจริงอยู่ใน `.dev.vars` (gitignore) และ Cloudflare เท่านั้น **ห้าม commit `.dev.vars`**
- ล็อกอินได้ทางเดียวคือ LINE ID token ที่เซิร์ฟเวอร์ verify กับ LINE และต้องเป็น channel ของการติดตั้งนั้นเท่านั้น
- `ALLOWED_LINE_USER_IDS` ว่าง = **ไม่มีใครเข้าได้** และตรวจทุก request (เอาใครออกแล้วเข้าไม่ได้ทันที)
- session cookie ใช้ prefix `__Host-` ไม่แชร์กับเว็บอื่นในโดเมนเดียวกัน
- แต่ละการติดตั้งมี LINE channel, `AUTH_SECRET` และ D1 ของตัวเอง — คนที่โคลน repo ไปเข้าเว็บของคุณไม่ได้

รายละเอียดทั้งหมด: [docs/requirements.md](docs/requirements.md)

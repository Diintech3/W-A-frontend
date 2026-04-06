# 🚀 WhatsApp Marketing SaaS Platform

A full-stack WhatsApp Marketing & Automation platform built with React + Node.js + MongoDB + Meta WhatsApp Cloud API.

---

## ✨ Features

- 📱 **WhatsApp Cloud API** — Meta official API integration
- 📤 **Bulk Campaigns** — Send broadcast messages to contact groups
- 🤖 **Chatbot Automation** — Auto reply with interactive menu flow
- 💬 **Team Inbox** — Live chat with real-time Socket.io
- 📋 **Contact Management** — CSV import, groups, segmentation
- 📝 **Message Templates** — Meta approved template management
- 📊 **Analytics Dashboard** — Campaign stats, message timeline
- ⏰ **Scheduled Campaigns** — Send messages at specific time
- 🔐 **JWT Auth** — Secure login with refresh token

---

## 🧠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh Token) |
| WhatsApp | Meta WhatsApp Cloud API |
| Realtime | Socket.io |
| Scheduler | node-cron |
| Storage | Cloudflare R2 |

---

## 📁 Project Structure

```
WhatsApp Automation/
├── backend/
│   ├── config/          # DB, env config
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, error, upload
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # WhatsApp, Socket, Scheduler
│   ├── utils/           # Logger, CSV parser, API response
│   └── index.js
└── frontend/
    └── src/
        ├── components/  # UI, Layout, Charts
        ├── context/     # Auth context
        ├── hooks/       # useAuth, useSocket
        ├── pages/       # All pages
        └── services/    # Axios API layer
```

---

## ⚙️ Setup

### Backend

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/whatsapp_saas
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=myverifytoken123
WHATSAPP_API_VERSION=v19.0
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts/import` | CSV import |
| GET | `/api/contacts/groups` | List groups |
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns/:id/send` | Send campaign |
| GET | `/api/templates` | List templates |
| GET | `/api/inbox/conversations` | List conversations |
| POST | `/api/inbox/conversations/:id/reply` | Send reply |
| GET | `/api/bot/flow` | Get bot flow |
| POST | `/api/bot/flow` | Save bot flow |
| GET | `/api/analytics/overview` | Stats overview |
| GET | `/api/webhook` | Webhook verify |
| POST | `/api/webhook` | Receive messages |

---

## 🚀 Deployment

### Frontend — Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add env variable: `VITE_API_URL=https://your-backend.com/api`
4. Deploy ✅

### Backend — VPS / Railway / Render

1. Set all `.env` variables
2. Run `node index.js`
3. Set Meta Webhook URL: `https://your-domain.com/api/webhook`

---

## 📲 WhatsApp Webhook Setup

1. Go to [Meta Developer Console](https://developers.facebook.com)
2. Open your app → WhatsApp → Configuration
3. Set Callback URL: `https://your-domain.com/api/webhook`
4. Set Verify Token: `myverifytoken123`
5. Subscribe to `messages` field

---

## 📄 License

MIT License — Free to use and modify.

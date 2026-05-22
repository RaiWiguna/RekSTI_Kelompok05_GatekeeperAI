# 📱 Mobile App Onboarding & Structure

Aplikasi mobile telah diperbarui dengan sistem onboarding yang profesional dan UI/UX yang lebih baik.

## 🎯 Fitur Utama

### 1. **Onboarding Screen** 
   - 5 slide pengenalan aplikasi
   - Navigasi dengan tombol sebelum/sesudah
   - Indikator progress dots
   - Opsi skip untuk user yang ingin langsung login
   - Menyimpan status onboarding di AsyncStorage

### 2. **Login Screen**
   - Design yang bersih dan modern
   - Input field untuk email dan password
   - Configurasi API Base URL
   - Error handling dengan pesan yang jelas

### 3. **Home Screen**
   - Welcome greeting dengan emoji berdasarkan role (student/lecturer/admin)
   - Tampilkan informasi user
   - Feature cards yang menunjukkan fitur utama
   - Logout button

## 📂 Struktur File

```
apps/mobile/
├── App.tsx                          # Main app dengan state management
├── screens/
│   ├── OnboardingScreen.tsx        # 5 slide pengenalan
│   ├── LoginScreen.tsx             # Form login
│   └── HomeScreen.tsx              # Dashboard user
├── utils/
│   └── onboarding.ts               # Helper untuk AsyncStorage
└── package.json                    # Dependencies (ditambah AsyncStorage)
```

## 🚀 Flow Aplikasi

```
┌─────────────────┐
│   App Start     │
└────────┬────────┘
         │
         ▼
    ┌─────────────────────┐
    │ Check Onboarding    │
    │ Status (AsyncStorage)│
    └────┬──────────────┬──┘
         │              │
    ✅ Yes          ❌ No
         │              │
         ▼              ▼
    ┌─────────┐   ┌─────────────┐
    │ Login   │   │ Onboarding  │
    │ Screen  │   │ Screen      │
    └────┬────┘   └─────┬───────┘
         │              │
         └──────┬───────┘
                │
                ▼ (setelah login/onboarding)
            ┌──────────────┐
            │ Home Screen  │
            │ (Dashboard)  │
            └──────────────┘
```

## 💾 Onboarding Slides

1. **Selamat Datang** 👋
   - Pengenalan platform Gatekeeper AI

2. **Kehadiran Pintar** 📸
   - Sistem pengenalan wajah otomatis

3. **Kelola Jadwal** 📅
   - Atur jadwal kelas, ruangan, dan perangkat

4. **Analitik Real-time** 📊
   - Pantau data kehadiran

5. **Siap Memulai** 🚀
   - Persiapan untuk login

## 🔧 Setup & Installation

### 1. Install Dependencies
```bash
cd apps/mobile
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```

## 📚 API Reference

### `OnboardingScreen` 
Props:
- `onComplete: () => void` - Callback ketika onboarding selesai

### `LoginScreen`
Props:
- `apiBaseUrl: string` - URL base API
- `onApiBaseUrlChange: (url: string) => void` - Handler saat URL berubah
- `onLoginSuccess: (session: Session) => void` - Handler saat login berhasil

### `HomeScreen`
Props:
- `session: Session` - Data session user
- `onLogout: () => void` - Handler saat logout

## 🎨 Design Details

- **Color Scheme:**
  - Primary: `#6366F1` (Indigo)
  - Secondary colors: Purple, Pink, Amber, Emerald untuk slides
  - Background: `#f5f5f5` (Light gray)

- **Typography:**
  - Title: Bold, 28-32px
  - Body: Regular, 14-16px
  - Labels: Uppercase, 12-14px

- **Spacing:**
  - Padding: 16-20px
  - Border radius: 8-12px
  - Gap between elements: 8-16px

## 🔄 State Management

- **App State:**
  - `loading`: Mengecek status onboarding
  - `onboarding`: Menampilkan slide onboarding
  - `login`: Form login
  - `home`: Dashboard user

- **Session:**
  - `accessToken`: Token untuk API
  - `refreshToken`: Token untuk refresh
- `user`: Data user (id, account_name, role)

## 📝 Customization

Untuk customize onboarding slides, edit array `ONBOARDING_PAGES` di [OnboardingScreen.tsx](./screens/OnboardingScreen.tsx):

```typescript
const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    title: "Your Title",
    description: "Your description",
    color: "#HexColor",
    icon: "emoji"
  },
  // ...more slides
];
```

## 🐛 Testing

### Reset Onboarding (untuk testing)
Buka console/debugger dan run:
```typescript
import { resetOnboarding } from './utils/onboarding';
await resetOnboarding();
// Refresh app
```

## 📱 Responsive Design

Aplikasi sudah responsive untuk:
- ✅ Mobile phones (320px - 480px)
- ✅ Tablets (481px - 768px)
- ✅ Large screens (769px+)

Menggunakan `Dimensions` API dari React Native untuk dynamic sizing.

---

**Last Updated:** May 2026  
**Version:** 1.0.0

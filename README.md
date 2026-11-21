# FUNDI

**Find skilled people. Run your work smarter.**

Mobile-first demo of an AI-assisted services marketplace for Uganda — worker workspace + customer discovery, with **FUNDI Voice Bridge** (Luganda ↔ English).

## Run locally (web)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Android APK

Prerequisites: Android SDK, JDK (Android Studio JBR works), a device/emulator with USB debugging.

```bash
npm run build
npx cap add android   # first time only
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Debug APK path:

`android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected phone:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or:

```bash
npx cap run android
```

## What works

- Welcome role selection (worker / customer) with role switch in Profile
- Customer marketplace: categories, search, filters, sort, portfolio cards
- Worker public profiles + request-a-quote → worker enquiry inbox
- Quotation builder with UGX totals, PDF download, copy/share
- Orders, payment status (manual), promise tracker, portfolio creator
- Voice Bridge UI with recording/upload + **Demo AI** text translation fallback
- Ask FUNDI assistant (demo mode)
- Extras: expenses log, business insights, compare shortlist, message templates

## Demo AI mode

No API keys are required. Translation, extraction, and assistant replies are clearly labelled **Demo AI mode**. They are editable drafts — never presented as live API success.

To wire real AI later: keep secrets on a server; replace helpers in `src/lib/demoAi.ts`.

## Pitch demo script

1. Open as **customer** → search “carpenter” / Wakiso → open **Kato Woodcraft**.
2. Request a quote for a three-door wardrobe.
3. Switch to **worker** (Profile) → see the enquiry → build a quotation in UGX → share/PDF.
4. Open **Voice Bridge** → load sample Luganda text → translate → turn into an order.
5. Add a promise and a portfolio project.

All sample people and jobs are fictional.

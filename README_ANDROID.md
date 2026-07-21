# Android App Installation & Play Store Publishing Guide

This guide explains how to install the generated Android Application Package (`.apk`) directly on Android phones for testing, and how to upload the Android App Bundle (`.aab`) to the Google Play Console for publication.

---

## 📱 Part 1: How to Install the APK on Your Android Phone (Direct Side-loading)

Since the APK is signed with a local release/upload key, you can install it directly on any Android device by transferring the file and following these steps:

### Step 1: Copy the APK to Your Phone
1. Transfer the generated `app-release-signed.apk` (or similar output APK) to your Android device.
2. You can do this via **USB cable**, **Google Drive**, **Email**, or by downloading it directly from this development workspace.

### Step 2: Enable "Install Unknown Apps"
Android blocks installing apps outside of the Google Play Store by default. To install your APK:
1. Open your phone's **Settings**.
2. Go to **Apps & Notifications** (or **Security & Privacy** -> **More Settings**).
3. Tap **Special App Access** -> **Install Unknown Apps**.
4. Select the app you are using to open the APK (such as **Files**, **My Files**, **Google Chrome**, or **Gmail**).
5. Toggle **Allow from this source** to **ON**.

### Step 3: Install the APK
1. Open your file manager (e.g., **Files by Google**) or download history.
2. Locate and tap on the `app-release-signed.apk` file.
3. Tap **Install** when prompted.
4. If a "Play Protect" alert appears stating "Blocked by Play Protect" (because the app is not yet published to Google Play), tap **Install Anyway**.
5. Once the installation completes, tap **Open** to run "The Ali's Collegiate LMS" as a high-performance native Android application!

---

## 🚀 Part 2: How to Publish the AAB to the Google Play Store

Google Play requires the modern `.aab` (Android App Bundle) format for all new app submissions, which optimizes download sizes for users.

### Step 1: Set Up Your Google Play Console Account
1. Visit the [Google Play Console](https://play.google.com/apps/publish) and log in.
2. If you don't have a developer account, register for one (requires a one-time $25 USD registration fee).

### Step 2: Create a New App
1. Inside the Google Play Console, click **Create app** (top right).
2. Enter the app details:
   - **App name**: `The Ali's Collegiate LMS`
   - **Default language**: `English (United States)`
   - **App or Game**: `App`
   - **Free or Paid**: `Free`
3. Complete the declarations and terms, then click **Create app**.

### Step 3: Verify the Digital Asset Link (SHA-256 Fingerprint)
To remove the URL address bar entirely from the Android app (enabling Trusted Web Activity "standalone" mode), you must verify ownership of the website:
1. Bubblewrap generated an `assetlinks.json` file during the build process.
2. Copy this file or its contents and upload it to your live hosting server at the following exact path:
   `https://[your-domain]/.well-known/assetlinks.json`
3. Ensure the server serves this file with `Content-Type: application/json`.
4. Once Google Play detects this file, the browser address bar will be hidden, giving your users a 100% native immersive experience.

### Step 4: Create a Release & Upload the AAB
1. In the left-hand menu under **Release**, navigate to **Production** (or **Testing** -> **Internal testing** for a closed pilot).
2. Click **Create new release** (top right).
3. In **App bundles**, click **Upload** and select the generated `.aab` file from your build.
4. Wait for the upload and validation to complete.
5. Provide a **Release name** (e.g., `1.0.0`) and enter your **Release notes** (e.g., `"Initial release of The Ali's Collegiate LMS Android App."`).
6. Click **Save as draft** or **Next**.

### Step 5: Complete the App Store Presence & Questionnaire
Before you can roll out, Google Play Console requires completing the:
- **Set up your app** tasks (content rating, privacy policy URL, target audience, dashboard categories).
- **Store listing details** (long description, short description, app icon, screenshots, feature graphic).

### Step 6: Roll Out to Production!
1. Go back to the **Production** tab.
2. Click **Edit release**.
3. Review any warnings, then click **Start rollout to Production**.
4. Your app will enter Google's review queue and is typically live in the Play Store within 1 to 3 business days!

---

## 🔑 Part 3: App Key Signing Info
- **Keystore File**: `android.keystore` (generated during the build)
- **Key Store Password**: `password123`
- **Key Password**: `password123`
- **Alias**: `android`

> ⚠️ **IMPORTANT**: Store your `android.keystore` file securely. If you lose this keystore file, you will be unable to update your application in the Google Play Store in the future, as Google requires all app updates to be signed with the exact same cryptographic key.

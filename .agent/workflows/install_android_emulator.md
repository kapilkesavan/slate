---
description: How to install Android Studio and set up the Android Emulator on macOS
---

# Install Android Studio & Emulator

1.  **Download Android Studio**
    *   Go to [developer.android.com/studio](https://developer.android.com/studio).
    *   Download the latest version for Mac (check if you need the Intel or Apple Silicon version).

2.  **Install Android Studio**
    *   Open the downloaded `.dmg` file.
    *   Drag **Android Studio** into your **Applications** folder.
    *   Open Android Studio. Follow the setup wizard.
    *   **Important**: Ensure "Android Virtual Device" (AVD) is selected during the "Standard" or "Custom" install steps.

3.  **Set up Environment Variables**
    *   You need to add the Android SDK platform-tools to your PATH to use `adb`.
    *   Add the following lines to your `~/.zshrc` file:
        ```bash
        export ANDROID_HOME=$HOME/Library/Android/sdk
        export PATH=$PATH:$ANDROID_HOME/emulator
        export PATH=$PATH:$ANDROID_HOME/platform-tools
        ```
    *   Reload your shell: `source ~/.zshrc`

4.  **Create a Virtual Device**
    *   Open Android Studio.
    *   Click on **More Actions** (three dots) > **Virtual Device Manager**.
    *   Click **Create device**.
    *   Select a phone (e.g., Pixel 6) and click **Next**.
    *   Select a system image (e.g., API 34 / UpsideDownCake) and download it if needed. Click **Next**.
    *   Click **Finish**.

5.  **Run the Emulator**
    *   In the Virtual Device Manager, click the **Play** button next to your new device.
    *   Once it boots up, you can run your Expo app with `a` in the terminal.

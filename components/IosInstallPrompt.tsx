"use client";

import PWAPrompt from "react-ios-pwa-prompt";

export function IosInstallPrompt() {
  return (
    <PWAPrompt
      promptOnVisit={2}
      timesToShow={2}
      copyTitle="Install Waleed AI"
      copySubtitle="Get quick access from your home screen"
      copyDescription="This assistant works better as an app. Add it to your home screen for fullscreen access and offline use."
      delay={1500}
    />
  );
}

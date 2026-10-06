"use client";

import dynamic from "next/dynamic";

const InstallBanner = dynamic(
  () => import("@/components/InstallBanner").then((m) => m.InstallBanner),
  { ssr: false },
);

const ServiceWorkerRegister = dynamic(
  () =>
    import("@/components/ServiceWorkerRegister").then(
      (m) => m.ServiceWorkerRegister,
    ),
  { ssr: false },
);

const IosInstallPrompt = dynamic(
  () => import("@/components/IosInstallPrompt").then((m) => m.IosInstallPrompt),
  { ssr: false },
);

const OfflineBanner = dynamic(
  () => import("@/components/OfflineBanner").then((m) => m.OfflineBanner),
  { ssr: false },
);

const IosAddToHomeHint = dynamic(
  () => import("@/components/IosAddToHomeHint").then((m) => m.IosAddToHomeHint),
  { ssr: false },
);

export function ClientProviders() {
  return (
    <>
      <OfflineBanner />
      <InstallBanner />
      <IosInstallPrompt />
      <IosAddToHomeHint />
      <ServiceWorkerRegister />
    </>
  );
}

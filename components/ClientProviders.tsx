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

export function ClientProviders() {
  return (
    <>
      <InstallBanner />
      <ServiceWorkerRegister />
      <IosInstallPrompt />
    </>
  );
}

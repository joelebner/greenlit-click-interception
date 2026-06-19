import type { Metadata } from "next";
import { OnboardingProvider } from "./onboarding-context";
import styles from "./onboarding.module.css";

export const metadata: Metadata = {
  title: "Greenlit Validation Test",
  description: "Validation test flow",
};

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OnboardingProvider>
      <div className={styles.shell}>
        <div className={styles.backdrop} aria-hidden="true" />
        <div className={styles.frame}>{children}</div>
      </div>
    </OnboardingProvider>
  );
}

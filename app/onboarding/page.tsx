"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import styles from "./onboarding.module.css";

export default function WelcomePage() {
  return (
    <section className={styles.screen}>
      <div className={styles.brandMark}>Greenlit Validation Test</div>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Technical validation</p>
        <h1 className={styles.title}>Welcome to Greenlit Validation Test</h1>
        <p className={styles.description}>
          Test whether specific URLs render correctly inside iframes.
        </p>
      </div>

      <div className={styles.actions}>
        <Link href="/onboarding/profile">
          <Button>Get Started</Button>
        </Link>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { getRoleLabel, useOnboarding } from "../onboarding-context";
import styles from "../onboarding.module.css";

export default function ConfirmPage() {
  const router = useRouter();
  const { profile, isComplete, setIsComplete } = useOnboarding();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!profile.name || !profile.role) {
      router.replace("/onboarding/profile");
    }
  }, [profile.name, profile.role, router]);

  function handleConfirm() {
    setIsComplete(true);
    setDialogOpen(false);
  }

  if (!profile.name || !profile.role) {
    return null;
  }

  return (
    <section className={styles.screen}>
      <div className={styles.stepMeta}>
        <span className={styles.stepBadge}>Step 3 of 3</span>
        {!isComplete ? (
          <Link href="/onboarding/profile" className={styles.backLink}>
            Edit profile
          </Link>
        ) : null}
      </div>

      {isComplete ? (
        <div className={styles.doneState}>
          <div className={styles.doneIcon} aria-hidden="true">
            ✓
          </div>
          <h1 className={styles.title}>You&apos;re all set!</h1>
          <p className={styles.description}>
            Welcome to Greenlit Validation Test, {profile.name}. Your workspace is ready.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.hero}>
            <h1 className={styles.title}>Review your details</h1>
            <p className={styles.description}>
              Confirm everything looks right before we finish setting up your
              account.
            </p>
          </div>

          <dl className={styles.summary}>
            <div className={styles.summaryRow}>
              <dt>Name</dt>
              <dd>{profile.name}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>Role</dt>
              <dd>{getRoleLabel(profile.role)}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <Button onClick={() => setDialogOpen(true)}>Finish setup</Button>
          </div>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Confirm and finish setup?"
        description="We'll finish setting up Greenlit Validation Test with the details below."
      >
        <dl className={styles.modalSummary}>
          <div className={styles.summaryRow}>
            <dt>Name</dt>
            <dd>{profile.name}</dd>
          </div>
          <div className={styles.summaryRow}>
            <dt>Role</dt>
            <dd>{getRoleLabel(profile.role)}</dd>
          </div>
        </dl>

        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </Dialog>
    </section>
  );
}

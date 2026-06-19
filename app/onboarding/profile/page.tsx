"use client";

import * as Label from "@radix-ui/react-label";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import {
  ROLE_OPTIONS,
  useOnboarding,
  type UserRole,
} from "../onboarding-context";
import styles from "../onboarding.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useOnboarding();
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState<UserRole | "">(profile.role);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!role) {
      setError("Please select your role.");
      return;
    }

    setProfile({ name: trimmedName, role });
    router.push("/onboarding/confirm");
  }

  return (
    <section className={styles.screen}>
      <div className={styles.stepMeta}>
        <span className={styles.stepBadge}>Step 2 of 3</span>
        <Link href="/onboarding" className={styles.backLink}>
          Back
        </Link>
      </div>

      <div className={styles.hero}>
        <h1 className={styles.title}>Set up your profile</h1>
        <p className={styles.description}>
          Tell us a little about yourself so we can personalize your workspace.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <Label.Root htmlFor="name" className={styles.label}>
            Name
          </Label.Root>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
            placeholder="Alex Rivera"
            autoComplete="name"
          />
        </div>

        <div className={styles.field}>
          <Label.Root htmlFor="role" className={styles.label}>
            Role
          </Label.Root>
          <Select
            id="role"
            value={role}
            onValueChange={(value) => {
              setRole(value as UserRole);
              if (error) setError("");
            }}
            placeholder="Choose your role"
            options={[...ROLE_OPTIONS]}
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </section>
  );
}

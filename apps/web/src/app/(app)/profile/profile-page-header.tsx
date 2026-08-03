"use client";

import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { useUserPreferences } from "@/components/user-preferences-provider";

export function ProfilePageHeader() {
  const { t } = useUserPreferences();

  return (
    <PageHeader title={t("profile", "title")} description={t("profile", "subtitle")} />
  );
}

export function ProfileAccountCardHeader() {
  const { t } = useUserPreferences();

  return (
    <SectionHeader
      title={t("profile", "account")}
      description={t("profile", "accountDescription")}
    />
  );
}

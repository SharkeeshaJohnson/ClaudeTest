"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}

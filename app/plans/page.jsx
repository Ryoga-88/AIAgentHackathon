"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlansRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('📍 /plans ページにアクセス - ホームページにリダイレクト');
    // 直接アクセス時はホームページに戻す
    router.replace('/');
  }, [router]);

  // 何も表示しない（即座にリダイレクト）
  return null;
}
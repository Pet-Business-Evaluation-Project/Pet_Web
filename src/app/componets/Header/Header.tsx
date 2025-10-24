"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        {/* ✅ 로고 클릭 시 홈으로 이동 */}
        <Link href="/">
          <Image
            src="/img/logopettype3.png"
            alt="로고"
            width={167}
            height={60}
            className="cursor-pointer"
          />
        </Link>

        <nav className="hidden md:flex space-x-6 text-lg font-medium">
          <Link href="/">Home</Link>
          <Link href="/about">협회 소개</Link>
          <Link href="/members">회원사 소개</Link>
          <Link href="/register">회원사 등록</Link>
          <Link href="/community">커뮤니티</Link>
        </nav>
      </div>

      <div className="flex space-x-2">
        <button>로그인</button>
        <Link href="/Signupagree">회원가입</Link>
        <Link href="/mypage">마이페이지</Link>
      </div>
    </header>
  );
}

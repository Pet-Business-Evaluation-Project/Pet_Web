"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Modal from "../Modal/Modal";
import LoginForm from "../LoginForm/LoginForm";
import Button from "../Button/Button";

export default function Header() {

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [count, setCount] = useState(0);  // Recoverable Error 뜨길래 추가

  return (
    <header className="w-full shadow-md px-6 py-0">
    {/* 최상단: 로그인, 회원가입, 마이페이지 (작은 글씨, 오른쪽 정렬, 회색 배경) */}
      <div className="flex justify-end items-center space-x-4 text-sm text-gray-600 bg-gray-300 px-6 py-1 pr-50">
        <Button label="로그인" onClick={() => setIsLoginOpen(true)} className="px-3 py-1 text-sm" />
        <Link href="/signupagree">회원가입</Link>
        <Link href="/mypage">마이페이지</Link>
      </div>

      {/* 두 번째 줄: 로고 좌측, 네비게이션 우측 */}
      <div className="flex justify-between items-center px-6 pr-50 py-0 bg-white">
        {/* 왼쪽: 로고 */}
        <Link href="/">
          <Image
          src="/img/logopettype3.png"
          alt="로고"
          width={250}
          height={90}
          className="cursor-pointer ml-50"
        />
        </Link>

        {/* 오른쪽: 네비게이션 */}
        <nav className="flex items-center space-x-12 text-lg md:text-xl lg:text-2xl font-medium">
          <Link href="/home" className="hover:text-red-900">Home</Link>
          <Link href="/about" className="hover:text-red-900">협회 소개</Link>
          <Link href="/members" className="hover:text-red-900">회원사 소개</Link>
          <Link href="/register" className="hover:text-red-900">회원사 등록</Link>
          <Link href="/community" className="hover:text-red-900">커뮤니티</Link>
        </nav>
      </div>

      {/* 로그인 모달 */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm />
      </Modal>
    </header>
  );
}

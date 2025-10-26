"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import LoginForm from "../LoginForm/LoginForm";
import Button from "../Button/Button";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ✅ 페이지가 로드될 때 localStorage에서 로그인 정보 복원
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ✅ 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8080/api/auth/logout", {}, { withCredentials: true });
      localStorage.removeItem("user");
      setUser(null);
      alert("로그아웃 완료!");
      
      // 로그아웃 후 홈으로 이동
      router.push("/");

    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <header className="w-full shadow-md px-6 py-0">
      {/* 최상단: 로그인/회원가입 or 사용자정보 */}
      <div className="flex justify-end items-center space-x-4 text-sm text-gray-600 bg-gray-300 px-6 py-1 pr-50">
        {!user ? (
          <>
            <Button label="로그인" onClick={() => setIsLoginOpen(true)} className="px-3 py-1 text-sm" />
            <Link href="/signupagree">회원가입</Link>
          </>
        ) : (
          <>
            <span>{user.name} 님</span>
            <Button label="로그아웃" onClick={handleLogout} className="px-3 py-1 text-sm" />
            <Link href="/mypage">마이페이지</Link>
          </>
        )}
      </div>

      {/* 두 번째 줄: 로고 + 네비게이션 */}
      <div className="flex justify-between items-center px-6 pr-50 py-0 bg-white">
        <Link href="/">
          <Image
            src="/img/logopettype3.png"
            alt="로고"
            width={250}
            height={90}
            className="cursor-pointer ml-50"
          />
        </Link>

        <nav className="flex items-center space-x-12 text-lg md:text-xl lg:text-2xl font-medium">
          <Link href="/" className="hover:text-red-900">Home</Link>
          <Link href="/" className="hover:text-red-900">협회 소개</Link>
          <Link href="/" className="hover:text-red-900">회원사 소개</Link>
          <Link href="/" className="hover:text-red-900">회원사 등록</Link>
          <Link href="/" className="hover:text-red-900">커뮤니티</Link>
        </nav>
      </div>

      {/* 로그인 모달 */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm onLoginSuccess={(userData: any) => {
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
          setIsLoginOpen(false);
        }} />
      </Modal>
    </header>
  );
}

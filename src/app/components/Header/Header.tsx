"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import LoginForm from "../LoginForm/LoginForm";
import Button from "../Button/Button";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Header() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [user, setUser] = useState<User | null>(null); 

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User); 
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://petback.hysu.kr/back/api/auth/logout", {}, { withCredentials: true });
      localStorage.removeItem("user");
      setUser(null);
      alert("로그아웃 완료!");
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <header className="w-full shadow-md">
      {/* 최상단: 로그인/회원가입 or 사용자정보 */}
      <div className="flex justify-end items-center space-x-4 text-sm text-gray-600 bg-gray-300 px-4 lg:px-16 xl:px-70 py-2">
        {!user ? (
          <>
            <Button label="로그인" onClick={() => setIsLoginOpen(true)} className="px-3 py-1 text-sm" />
            <Link href="/signupagree" className="hover:underline">회원가입</Link>
          </>
        ) : (
          <>
            <span>{user.name} 님</span> 
            <Button label="로그아웃" onClick={handleLogout} className="px-3 py-1 text-sm" />
            <Link href="/mypage" className="hover:underline">마이페이지</Link>
          </>
        )}
      </div>

      {/* 두 번째 줄: 로고 + 네비게이션 */}
      <div className="flex justify-between items-center px-4 lg:px-16 py-4 bg-white">
        <Link href="/">
          <Image
            src="/img/kcci.svg"
            alt="로고"
            width={200}
            height={72}
            className="cursor-pointer"
          />
        </Link>

        {/*데스크톱 네비게이션 (lg 이상에서만 표시) */}
        <nav className="hidden lg:flex items-center space-x-8 xl:space-x-12 text-lg xl:text-2xl font-bold">
          <Link href="/" className="hover:text-red-900 whitespace-nowrap font-bold">Home</Link>
          <Link href="/" className="hover:text-red-900 whitespace-nowrap">심사원 소개</Link>
          <Link href="/" className="hover:text-red-900 whitespace-nowrap">회원사 소개</Link>
          <Link href="/" className="hover:text-red-900 whitespace-nowrap">회원사 등록</Link>
          <Link href="/" className="hover:text-red-900 whitespace-nowrap">커뮤니티</Link>
        </nav>

        {/* 모바일 햄버거 버튼 (lg 미만에서만 표시) */}
        <button 
          className="lg:hidden flex flex-col space-y-1.5 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="메뉴"
        >
          <span className={`block w-6 h-0.5 bg-gray-800 transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-800 transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-800 transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
            <nav
        className={`lg:hidden bg-white border-t border-gray-200 shadow-lg transform transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col px-4 py-2">
          {['Home', '심사원 소개', '회원사 소개', '회원사 등록', '커뮤니티'].map((item, idx) => (
            <Link
              key={idx}
              href="/"
              className="py-3 px-4 hover:bg-gray-100 hover:text-red-900 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item}
            </Link>
          ))}
        </div>
      </nav>


      {/* 로그인 모달 */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm onLoginSuccess={(userData: User) => {
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
          setIsLoginOpen(false);
        }} />
      </Modal>
    </header>
  );
}
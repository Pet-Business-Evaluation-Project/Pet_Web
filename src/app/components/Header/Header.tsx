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
            <Link href="/signupagree" className="hover:underline">
              회원가입
            </Link>
          </>
        ) : (
          <>
            <span>{user.name} 님</span>
            <Button label="로그아웃" onClick={handleLogout} className="px-3 py-1 text-sm" />
            <Link href="/mypage" className="hover:underline">
              마이페이지
            </Link>
          </>
        )}
      </div>

      {/* 두 번째 줄: 로고 + 네비게이션 */}
      <div className="flex justify-between items-center px-4 lg:px-70 py-4 bg-white relative">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/img/kcci.svg"
            alt="로고"
            width={200}
            height={72}
            className="cursor-pointer w-auto h-30 sm:h-32 md:h-34 lg:h-36 xl:h-38"
          />
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10 text-lg xl:text-2xl font-bold relative">
          <Link href="/" className="hover:text-red-900 whitespace-nowrap font-bold">
            Home
          </Link>
          <Link href="/reviewinfo" className="hover:text-red-900 whitespace-nowrap">
            심사원 소개
          </Link>
          <Link href="/community" className="hover:text-red-900 whitespace-nowrap">
            회원사 소개
          </Link>
          <Link href="/community" className="hover:text-red-900 whitespace-nowrap">
            회원사 등록
          </Link>

          {/* 🔽 커뮤니티 hover 드롭다운 (사라지지 않게 hitbox 추가) */}
          <div className="relative group">
            <span className="hover:text-red-900 cursor-pointer whitespace-nowrap">
              커뮤니티
            </span>

            {/* hover 시 투명 hitbox 영역 */}
            <div className="absolute left-0 top-full w-full h-4 bg-transparent"></div>

            {/* 드롭다운 메뉴 */}
            <div className="absolute left-0 mt-6 w-40 bg-white border border-gray-200 rounded-lg shadow-md opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all duration-200 z-50">
              <Link
                href="/notice"
                className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                공지사항
              </Link>
              <Link
                href="/community"
                className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
              >
                게시판
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* 로그인 모달 */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm
          onLoginSuccess={(userData: User) => {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            setIsLoginOpen(false);
          }}
        />
      </Modal>
    </header>
  );
}

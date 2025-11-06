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
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // ✅ localStorage에서 사용자 정보 읽어오는 함수
  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // 초기 로드
    loadUser();

    // ✅ 사용자 정보 업데이트 이벤트 리스너 등록
    const handleUserUpdate = () => {
      loadUser();
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    // 클린업
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("https://www.kcci.co.kr/back/api/auth/logout", {}, { withCredentials: true });
      localStorage.removeItem("user");
      setUser(null);
      alert("로그아웃 완료!");
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsCommunityOpen(false);
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

        {/* 🍔 햄버거 버튼 (모바일/태블릿) */}
        <button
          className="lg:hidden flex flex-col space-y-1.5 p-2 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="메뉴"
        >
          <span className={`block w-6 h-0.5 bg-gray-800 transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-800 transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-800 transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden lg:flex items-center space-x-8 xl:space-x-10 text-lg xl:text-2xl font-bold relative">
          <Link href="/" className="hover:text-red-900 whitespace-nowrap font-bold">
            KCCI
          </Link>
          <Link href="/reviewinfo" className="hover:text-red-900 whitespace-nowrap">
            심사원 소개
          </Link>
          <Link href="/memberinfo" className="hover:text-red-900 whitespace-nowrap">
            회원사 소개
          </Link>
          <Link href="/memberregister" className="hover:text-red-900 whitespace-nowrap">
            회원사 등록
          </Link>

          {/* 🔽 커뮤니티 hover 드롭다운 (데스크톱) */}
          <div className="relative group">
            <span className="hover:text-red-900 cursor-pointer whitespace-nowrap">
              커뮤니티
            </span>

            <div className="absolute left-0 top-full w-full h-4 bg-transparent"></div>

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

      {/* 📱 모바일 메뉴 드롭다운 */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="flex flex-col py-2">
            <Link
              href="/"
              className="px-6 py-3 hover:bg-gray-100 text-gray-800 font-medium"
              onClick={closeMobileMenu}
            >
              KCCI
            </Link>
            <Link
              href="/reviewinfo"
              className="px-6 py-3 hover:bg-gray-100 text-gray-800"
              onClick={closeMobileMenu}
            >
              심사원 소개
            </Link>
            <Link
              href="/memberinfo"
              className="px-6 py-3 hover:bg-gray-100 text-gray-800"
              onClick={closeMobileMenu}
            >
              회원사 소개
            </Link>
            <Link
              href="/memberregister"
              className="px-6 py-3 hover:bg-gray-100 text-gray-800"
              onClick={closeMobileMenu}
            >
              회원사 등록
            </Link>

            {/* 🔽 커뮤니티 드롭다운 (모바일) */}
            <div>
              <button
                className="w-full text-left px-6 py-3 hover:bg-gray-100 text-gray-800 flex justify-between items-center"
                onClick={() => setIsCommunityOpen(!isCommunityOpen)}
              >
                커뮤니티
                <span className={`transform transition-transform ${isCommunityOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {isCommunityOpen && (
                <div className="bg-gray-50">
                  <Link
                    href="/notice"
                    className="block px-10 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={closeMobileMenu}
                  >
                    공지사항
                  </Link>
                  <Link
                    href="/community"
                    className="block px-10 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={closeMobileMenu}
                  >
                    게시판
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* 로그인 모달 */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginForm
          onLoginSuccess={(userData: User) => {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            setIsLoginOpen(false);
          }}
          onClose={() => setIsLoginOpen(false)}
        />
      </Modal>
    </header>
  );
}
"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import Button from "../Button/Button";
import Link from "next/link";
import { useRouter } from "next/navigation"; // ✅ 추가

interface User {
  id: number;
  name: string;
  email: string;
  classification: string;
  expiresAt?: number;
}

interface LoginFormProps {
  onLoginSuccess?: (userData: User) => void;
  onClose?: () => void;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  userId?: number;
  loginID?: string;
  name?: string;
  classification?: string;
  expiresAt?: number;
}

export default function LoginForm({ onLoginSuccess, onClose }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter(); // ✅ 추가

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    console.log("🔐 로그인 시도:", email);

    try {
      const response = await axios.post<LoginResponse>(
        "https://www.kcci.co.kr/back/api/auth/login",
        {
          loginID: email,
          password,
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("📥 서버 응답:", response);
      console.log("📊 응답 데이터:", response.data);

      if (response.data.success) {
        console.log("✅ 로그인 성공");
        
        const userData: User = {
          id: response.data.userId!,
          name: response.data.name!,
          email: response.data.loginID!,
          classification: response.data.classification!,
          expiresAt: response.data.expiresAt,
        };
        
        localStorage.setItem("user", JSON.stringify(userData));

        if (onLoginSuccess) onLoginSuccess(userData);
        alert(`로그인 성공! 환영합니다, ${userData.name}님 😊`);
        
        router.push("/"); // ✅ 홈화면으로 이동
      } else {
        console.log("❌ 로그인 실패:", response.data.message);
        const message = response.data.message || "로그인 실패";
        setErrorMessage(message);
        alert(message);
      }
    } catch (error: unknown) {
      console.error("❌ 로그인 에러:", error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<LoginResponse>;
        
        console.log("📡 Axios 에러 상세:");
        console.log("- response:", axiosError.response);
        console.log("- response.data:", axiosError.response?.data);
        console.log("- response.status:", axiosError.response?.status);
        
        if (axiosError.response?.data) {
          const serverMessage = axiosError.response.data.message || 
                               "아이디 또는 비밀번호가 올바르지 않습니다.";
          
          console.log("💬 표시할 메시지:", serverMessage);
          setErrorMessage(serverMessage);
          alert(serverMessage);
        } else if (axiosError.response) {
          console.log("⚠️ 응답 데이터 없음");
          const message = "서버 응답 오류가 발생했습니다.";
          setErrorMessage(message);
          alert(message);
        } else if (axiosError.request) {
          console.error("🌐 네트워크 오류 - 응답 없음");
          const message = "서버에 연결할 수 없습니다.";
          setErrorMessage(message);
          alert(message);
        } else {
          console.error("⚙️ 요청 설정 오류:", axiosError.message);
          const message = "로그인 요청 중 오류가 발생했습니다.";
          setErrorMessage(message);
          alert(message);
        }
      } else {
        console.error("⚠️ 알 수 없는 오류:", error);
        const message = "로그인 중 알 수 없는 오류가 발생했습니다.";
        setErrorMessage(message);
        alert(message);
      }
    }
  };

  const handleForgotPasswordClick = () => {
    if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold text-center">로그인</h2>
      <input
        type="text"
        placeholder="아이디"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm whitespace-pre-line text-center">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="flex justify-end mt-[-8px]">
        <Link 
          href="/FindPassword" 
          className="text-sm text-gray-500 hover:text-blue-600 transition duration-150"
          onClick={handleForgotPasswordClick}
        >
          비밀번호를 잊어버리셨나요?
        </Link>
      </div>

      <Button type="submit" label="로그인" />
    </form>
  );
}
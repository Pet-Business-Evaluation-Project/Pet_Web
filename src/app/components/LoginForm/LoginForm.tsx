"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import Button from "../Button/Button";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  classification : string,
  expiresAt?: number;
}

interface LoginFormProps {
  onLoginSuccess?: (userData: User) => void;
  onClose?: () => void;
}

export default function LoginForm({ onLoginSuccess, onClose }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await axios.post(
        "https://www.kcci.co.kr/back/api/auth/login",
        {
          loginID: email,
          password,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const userData: User = {
          id: response.data.userId,
          name: response.data.name,
          email: response.data.loginID,
          classification: response.data.classification,
          expiresAt: response.data.expiresAt, // 서버에서 받은 만료 시간
        };
        
        // 로컬스토리지 저장
        localStorage.setItem("user", JSON.stringify(userData));

        // 부모 컴포넌트에 로그인 성공 알림
        if (onLoginSuccess) onLoginSuccess(userData);
        
        alert(`로그인 성공! 환영합니다, ${userData.name}님 😊`);
      } else {
        setErrorMessage(response.data.message || "로그인 실패");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          alert("아이디 또는 비밀번호가 올바르지 않습니다.");
          setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
        } else {
          console.error("로그인 중 서버 오류:", axiosError);
          alert("로그인 중 서버 오류가 발생했습니다.");
        }
      } else {
        console.error("예상치 못한 오류:", error);
        alert("로그인 중 알 수 없는 오류가 발생했습니다.");
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
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
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
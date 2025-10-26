"use client";

import React, { useState } from "react";
import axios from "axios";
import Button from "../Button/Button";
import { AxiosError } from "axios"; // AxiosError 타입을 import

// User 인터페이스 (Header.tsx에서 사용한 것과 일치해야 합니다)
interface User {
  id: number;
  name: string;
  email: string;
  // 기타 속성...
}

interface LoginFormProps {
  // 💡 수정: any -> User
  onLoginSuccess?: (userData: User) => void; 
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await axios.post(
        "http://petback.hysu.kr/api/auth/login",
        {
          loginID: email,
          password,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // 응답 데이터는 User 타입으로 간주
        const userData = response.data as User; 
        
        // ✅ 로그인 성공 시 로컬스토리지 저장
        localStorage.setItem("user", JSON.stringify(userData));

        // ✅ 부모 컴포넌트(Header)에 로그인 성공 알림
        // onLoginSuccess의 인자가 User 타입이 됩니다.
        if (onLoginSuccess) onLoginSuccess(userData); 
        console.log(localStorage.getItem);
        alert(`로그인 성공! 환영합니다, ${userData.name}님 😊`);
      } else {
        setErrorMessage(response.data.message || "로그인 실패");
      }
    // 💡 수정: any -> unknown 및 타입 가드 사용
    } catch (error: unknown) { 
      if (axios.isAxiosError(error)) { // AxiosError인지 확인
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
      <Button type="submit" label="로그인" />
    </form>
  );
}
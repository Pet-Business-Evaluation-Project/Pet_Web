"use client";

import React, { useState } from "react";
import axios from "axios";
import Button from "../Button/Button";

interface LoginFormProps {
  onLoginSuccess?: (userData: any) => void;
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
        // ✅ 로그인 성공 시 로컬스토리지 저장
        localStorage.setItem("user", JSON.stringify(response.data));

        // ✅ 부모 컴포넌트(Header)에 로그인 성공 알림
        if (onLoginSuccess) onLoginSuccess(response.data);
        console.log(localStorage.getItem);
        alert(`로그인 성공! 환영합니다, ${response.data.name}님 😊`);
      } else {
        setErrorMessage(response.data.message || "로그인 실패");
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      }else {
         alert("로그인 중 오류가 발생했습니다.");
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

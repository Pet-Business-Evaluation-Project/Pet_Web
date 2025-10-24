"use client";

import { useState } from "react";

export default function Signupmember() {
  const [formData, setFormData] = useState({
    loginID: "",
    password: "",
    verifyPassword: "",
    name: "",
    phnum: "",
    classifnumber: "",
    classification: "기업", 
  });

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("기업 회원가입 데이터:", formData);
    alert("기업 회원가입이 완료되었습니다!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4">
      <div className="bg-white w-full max-w-lg p-10 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">
          판매 기업 회원가입
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-gray-700 mb-2">기업명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="기업명을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              name="loginID"
              value={formData.loginID}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">비밀번호 확인</label>
            <input
              type="password"
              name="verifyPassword"
              value={formData.verifyPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">휴대폰 번호</label>
            <input
              type="text"
              name="phnum"
              value={formData.phnum}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="01012345678"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">사업자등록번호</label>
            <input
              type="text"
              name="classifnumber"
              value={formData.classifnumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="602-30-23453"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            회원가입 완료
          </button>
        </form>

        <p className="text-right text-gray-500 text-sm mt-6">
          아직 연결을 하지않아 회원가입안됨
        </p>
      </div>
    </div>
  );
}

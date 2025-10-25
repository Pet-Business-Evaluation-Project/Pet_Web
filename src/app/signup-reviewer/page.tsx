"use client";

import { useState } from "react";

export default function SignupReviewer() {
  const [formData, setFormData] = useState({
    loginID: "",
    password: "",
    name: "",
    phnum: "",
    Classifnumber: "",
    referralID: "",
    classification: "심사원",
  });

  const [errors, setErrors] = useState({
    loginID: "",
    password: "",
    verifyPassword: "",
    name: "",
    phnum: "",
    Classifnumber: "",
    referralID: "",
  });

  const [passwordcheck, setPasswordcheck] = useState("");
  const [ssnRaw, setSsnRaw] = useState("");

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "loginID":
        if (value.length < 4) errorMsg = "아이디는 4자 이상이어야 합니다.";
        break;

      case "password":
        if (
          !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
            value
          )
        ) {
          errorMsg =
            "비밀번호는 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.";
        }
        break;

      case "verifyPassword":
        if (value !== formData.password)
          errorMsg = "비밀번호가 일치하지 않습니다.";
        break;

      case "phnum":
        if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(value))
          errorMsg = "휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)";
        break;

      case "Classifnumber":
        if (!/^\d{7}$/.test(value))
          errorMsg = "주민등록번호 앞6자리+뒷자리 첫자리까지 입력해주세요.";
        break;

      case "name":
        if (!value) errorMsg = "이름을 입력해주세요.";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg === "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "Classifnumber") {
      let digits = value.replace(/[^0-9]/g, "");
      if (digits.length > 7) digits = digits.slice(0, 7);

      let display = "";
      if (digits.length <= 6) {
        display = digits;
      } else {
        display = digits.slice(0, 6) + "-" + digits[6] + "******";
      }

      setFormData((prev) => ({ ...prev, Classifnumber: display }));
      setSsnRaw(digits);
      validateField("Classifnumber", digits);
      return;
    }

    if (name === "verifyPassword") {
      setPasswordcheck(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    validateField(name, value);
  };

  const handleSsnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      setSsnRaw((prev) => {
        const updated = prev.slice(0, -1);
        let display = "";

        if (updated.length <= 6) {
          display = updated;
        } else {
          display = updated.slice(0, 6) + "-" + updated[6] + "******";
        }

        setFormData((p) => ({ ...p, Classifnumber: display }));
        validateField("Classifnumber", updated);
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fields = Object.keys(formData);
    let isValid = true;
    fields.forEach((field) => {
      const value =
        field === "Classifnumber" ? ssnRaw : field === "verifyPassword" ? passwordcheck : (formData as any)[field];
      if (!validateField(field, value)) isValid = false;
    });

    if (!isValid) {
      alert("입력값을 확인해주세요.");
      return;
    }

    const payload = {
      ...formData,
      Classifnumber: ssnRaw,
    };

    try {
      const res = await fetch("http://localhost:8080/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(payload);
      if (!res.ok) throw new Error("회원가입 요청 실패");

      const data = await res.json();
      console.log("심사원 회원가입 성공:", data);
      alert("심사원 회원가입이 완료되었습니다!");
    } catch (err) {
      console.error("회원가입 에러:", err);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-10 sm:py-16 min-h-screen items-start">
      <div className="relative bg-white w-full max-w-lg p-8 sm:p-10 rounded-2xl shadow-lg">
        {/* X 버튼 - 폼 내부 오른쪽 상단 */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
          aria-label="뒤로가기"
        >
          &times;
        </button>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          심사원 회원가입
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-gray-700 mb-2">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="이름을 입력하세요"
              required
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* 아이디 */}
          <div>
            <label className="block text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              name="loginID"
              value={formData.loginID}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="아이디를 입력하세요"
              required
            />
            {errors.loginID && <p className="text-red-500 text-sm">{errors.loginID}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-gray-700 mb-2">패스워드</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="비밀번호를 입력하세요"
              required
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-gray-700 mb-2">비밀번호 확인</label>
            <input
              type="password"
              name="verifyPassword"
              value={passwordcheck}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
            {errors.verifyPassword && <p className="text-red-500 text-sm">{errors.verifyPassword}</p>}
          </div>

          {/* 휴대폰 번호 */}
          <div>
            <label className="block text-gray-700 mb-2">휴대폰 번호</label>
            <input
              type="text"
              name="phnum"
              value={formData.phnum}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="01012345678 또는 010-1234-5678"
              required
            />
            {errors.phnum && <p className="text-red-500 text-sm">{errors.phnum}</p>}
          </div>

          {/* 주민등록번호 */}
          <div>
            <label className="block text-gray-700 mb-2">주민등록번호</label>
            <input
              type="text"
              name="Classifnumber"
              value={formData.Classifnumber}
              onChange={handleChange}
              onKeyDown={handleSsnKeyDown}
              maxLength={14}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="앞 6자리-뒷자리 첫자리 (예: 010101-3******)"
              required
            />
            {errors.Classifnumber && (
              <p className="text-red-500 text-sm">{errors.Classifnumber}</p>
            )}
          </div>

          {/* 추천인 */}
          <div>
            <label className="block text-gray-700 mb-2">추천인 ID</label>
            <input
              type="text"
              name="referralID"
              value={formData.referralID}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="추천할 심사원의 ID를 입력하세요 (없으면 공백)"
            />
          </div>

          {/* 버튼 */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            회원가입 완료
          </button>
        </form>

        <p className="text-right text-gray-500 text-sm mt-6">
          회원가입 가능 예외 케이스 처리 해줘야함
        </p>
      </div>
    </div>
  );
}

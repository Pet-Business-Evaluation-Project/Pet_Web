"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModalData {
  loginID: string;
  name: string;
  phnum: string;
  classifnumber: string;
  classification: string;
}

export default function Signupmember() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    loginID: "",
    password: "",
    name: "",
    phnum: "",
    Classifnumber: "",
    classification: "기업",
  });

  const [errors, setErrors] = useState({
    loginID: "",
    password: "",
    verifyPassword: "",
    name: "",
    phnum: "",
    Classifnumber: "",
  });

  const [passwordcheck, setPasswordcheck] = useState("");
  const [businessNumRaw, setBusinessNumRaw] = useState("");
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // ✅ 비밀번호 일치 검증 - useEffect로 자동 처리
  useEffect(() => {
    if (passwordcheck) {
      const errorMsg = passwordcheck !== formData.password ? "비밀번호가 일치하지 않습니다." : "";
      setErrors((prev) => ({ ...prev, verifyPassword: errorMsg }));
    }
  }, [formData.password, passwordcheck]);

  // ✅ 일반 필드 검증
  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "loginID":
        if (value.length < 4) errorMsg = "아이디는 4자 이상이어야 합니다.";
        break;
      case "password":
        if (
          !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(value)
        )
          errorMsg = "비밀번호는 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.";
        break;
      case "phnum":
        if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(value))
          errorMsg = "휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)";
        break;
      case "Classifnumber":
        if (!/^\d{10}$/.test(value))
          errorMsg = "사업자등록번호 10자리를 입력해주세요.";
        break;
      case "name":
        if (!value) errorMsg = "기업명을 입력해주세요.";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg === "";
  };

  // ✅ 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 사업자등록번호 특수 처리
    if (name === "Classifnumber") {
      let digits = value.replace(/[^0-9]/g, "");
      if (digits.length > 10) digits = digits.slice(0, 10);

      let display = "";
      if (digits.length <= 3) {
        display = digits;
      } else if (digits.length <= 5) {
        display = digits.slice(0, 3) + "-" + digits.slice(3);
      } else {
        display = digits.slice(0, 3) + "-" + digits.slice(3, 5) + "-" + digits.slice(5);
      }

      setFormData((prev) => ({ ...prev, Classifnumber: display }));
      setBusinessNumRaw(digits);
      validateField("Classifnumber", digits);
      return;
    }

    // 비밀번호 확인 처리
    if (name === "verifyPassword") {
      setPasswordcheck(value);
      return;
    }

    // 일반 필드 처리
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // ✅ 백스페이스 사업자등록번호 처리
  const handleBusinessNumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      setBusinessNumRaw((prev) => {
        const updated = prev.slice(0, -1);
        let display = "";

        if (updated.length <= 3) {
          display = updated;
        } else if (updated.length <= 5) {
          display = updated.slice(0, 3) + "-" + updated.slice(3);
        } else {
          display = updated.slice(0, 3) + "-" + updated.slice(3, 5) + "-" + updated.slice(5);
        }

        setFormData((p) => ({ ...p, Classifnumber: display }));
        validateField("Classifnumber", updated);
        return updated;
      });
    }
  };

  // ✅ 회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 모든 필드 검증
    const validations = {
      loginID: validateField("loginID", formData.loginID),
      password: validateField("password", formData.password),
      name: validateField("name", formData.name),
      phnum: validateField("phnum", formData.phnum),
      Classifnumber: validateField("Classifnumber", businessNumRaw),
    };

    // 비밀번호 확인 검증
    const passwordMatch = passwordcheck === formData.password;
    if (!passwordMatch) {
      setErrors((prev) => ({ ...prev, verifyPassword: "비밀번호가 일치하지 않습니다." }));
    }

    const isValid = Object.values(validations).every(v => v === true) && passwordMatch;

    if (!isValid) {
      alert("입력값을 확인해주세요.");
      return;
    }

    const payload = {
      ...formData,
      Classifnumber: businessNumRaw,
    };

    try {
      const res = await fetch("http://petback.hysu.kr/back/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "회원가입 요청 실패 (서버 응답 오류)";
        
        try {
          const errorData = await res.json();
          if (errorData && typeof errorData.message === 'string') { 
            errorMessage = errorData.message;
          } else if (res.statusText) {
            errorMessage = `[HTTP ${res.status}] ${res.statusText}`;
          }
        } catch (_) {
          errorMessage = await res.text() || `서버 오류 발생: 상태 코드 ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("기업 회원가입 성공:", data);
      
      setModalData({
        loginID: data.loginID || formData.loginID,
        name: data.name || formData.name,
        phnum: data.phnum || formData.phnum,
        classifnumber: formData.Classifnumber,
        classification: data.classification || "기업",
      });
    } catch (e) {
      const message = (e instanceof Error) ? e.message : "회원가입 중 알 수 없는 오류가 발생했습니다.";
      alert(message);
      console.error("회원가입 에러:", e);
    }
  };

  // ✅ 모달 닫기 후 이동
  const handleModalClose = () => {
    setModalData(null);
    router.push("/");
  };

  return (
    <div className="flex justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-10 sm:py-16 min-h-screen items-start">
      <div className="relative bg-white w-full max-w-lg p-8 sm:p-10 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
        >
          &times;
        </button>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
         기업 회원가입
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 기업명 */}
          <div>
            <label className="block text-gray-700 mb-2">기업명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="기업명을 입력하세요"
              required
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* 아이디 */}
          <div>
            <label className="block text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              name="loginID"
              value={formData.loginID}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="아이디를 입력하세요"
              required
            />
            {errors.loginID && <p className="text-red-500 text-sm mt-1">{errors.loginID}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="비밀번호를 입력하세요"
              required
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-gray-700 mb-2">비밀번호 확인</label>
            <input
              type="password"
              name="verifyPassword"
              value={passwordcheck}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
            {errors.verifyPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.verifyPassword}</p>
            )}
          </div>

          {/* 휴대폰 */}
          <div>
            <label className="block text-gray-700 mb-2">휴대폰 번호</label>
            <input
              type="text"
              name="phnum"
              value={formData.phnum}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="01012345678"
              required
            />
            {errors.phnum && <p className="text-red-500 text-sm mt-1">{errors.phnum}</p>}
          </div>

          {/* 사업자등록번호 */}
          <div>
            <label className="block text-gray-700 mb-2">사업자등록번호</label>
            <input
              type="text"
              name="Classifnumber"
              value={formData.Classifnumber}
              onChange={handleChange}
              onKeyDown={handleBusinessNumKeyDown}
              maxLength={12}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="000-00-00000"
              required
            />
            {errors.Classifnumber && (
              <p className="text-red-500 text-sm mt-1">{errors.Classifnumber}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            회원가입 완료
          </button>
        </form>
      </div>

      {/* 회원가입 성공 모달 */}
      {modalData && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50
                     bg-[rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">회원가입 정보</h2>
            <p className="text-gray-700 mb-2"><b>기업명:</b> {modalData.name}</p>
            <p className="text-gray-700 mb-2"><b>아이디:</b> {modalData.loginID}</p>
            <p className="text-gray-700 mb-2"><b>휴대폰:</b> {modalData.phnum}</p>
            <p className="text-gray-700 mb-4"><b>사업자등록번호:</b> {modalData.classifnumber}</p>
            <button
              onClick={handleModalClose}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow-md transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
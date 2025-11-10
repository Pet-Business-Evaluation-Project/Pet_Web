"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModalData {
  loginID: string;
  name: string;
  phnum: string;
  referralID: string;
  classification: string;
}

export default function SignupReviewer() {
  const router = useRouter();

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
  const [referralCheckTimer, setReferralCheckTimer] = useState<NodeJS.Timeout | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // ✅ 비밀번호 일치 검증 - useEffect로 자동 처리
  useEffect(() => {
    if (passwordcheck) {
      const errorMsg = passwordcheck !== formData.password ? "비밀번호가 일치하지 않습니다." : "";
      setErrors((prev) => ({ ...prev, verifyPassword: errorMsg }));
    }
  }, [formData.password, passwordcheck]);

  // ✅ cleanup - 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (referralCheckTimer) {
        clearTimeout(referralCheckTimer);
      }
    };
  }, [referralCheckTimer]);

  // ✅ 추천인 검증 함수
  const validateReferralID = async (referralID: string) => {
    if (!referralID) {
      setErrors((prev) => ({ ...prev, referralID: "" }));
      return;
    }

    try {
      const res = await fetch("http://petback.hysu.kr/back/user/loginInfo");
      if (!res.ok) throw new Error("유저 조회 실패");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("잘못된 응답 형식");

      const exists = data.includes(referralID);
      setErrors((prev) => ({
        ...prev,
        referralID: exists ? "" : "해당 유저가 존재하지 않습니다.",
      }));
    } catch (err) {
      console.error("추천인 조회 에러:", err);
      setErrors((prev) => ({
        ...prev,
        referralID: "추천인 확인 중 오류가 발생했습니다.",
      }));
    }
  };

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

  // ✅ 입력 핸들러 - 개선됨
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 주민번호 특수 처리
    if (name === "Classifnumber") {
      let digits = value.replace(/[^0-9]/g, "");
      if (digits.length > 7) digits = digits.slice(0, 7);

      let display = "";
      if (digits.length <= 6) display = digits;
      else display = digits.slice(0, 6) + "-" + digits[6] + "******";

      setFormData((prev) => ({ ...prev, Classifnumber: display }));
      setSsnRaw(digits);
      validateField("Classifnumber", digits);
      return;
    }

    // 비밀번호 확인 처리 (useEffect가 자동 검증)
    if (name === "verifyPassword") {
      setPasswordcheck(value);
      return;
    }

    // 일반 필드 처리
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);

    // 추천인 디바운스 검증
    if (name === "referralID") {
      if (referralCheckTimer) clearTimeout(referralCheckTimer);
      const timer = setTimeout(() => {
        validateReferralID(value);
      }, 500);
      setReferralCheckTimer(timer);
    }
  };

  // ✅ 백스페이스 주민번호 처리
  const handleSsnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      setSsnRaw((prev) => {
        const updated = prev.slice(0, -1);
        let display = "";

        if (updated.length <= 6) display = updated;
        else display = updated.slice(0, 6) + "-" + updated[6] + "******";

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
      Classifnumber: validateField("Classifnumber", ssnRaw),
    };

    // 비밀번호 확인 검증
    const passwordMatch = passwordcheck === formData.password;
    if (!passwordMatch) {
      setErrors((prev) => ({ ...prev, verifyPassword: "비밀번호가 일치하지 않습니다." }));
    }

    const isValid = Object.values(validations).every(v => v === true) && passwordMatch;

    if (!isValid || errors.referralID) {
      alert("입력값을 확인해주세요.");
      return;
    }

    const payload = {
      ...formData,
      Classifnumber: ssnRaw,
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
      console.log("심사원 회원가입 성공:", data);
      
      setModalData({
        loginID: data.loginID || formData.loginID,
        name: data.name || formData.name,
        phnum: data.phnum || formData.phnum,
        referralID: data.referralID || formData.referralID,
        classification: data.classification || "심사원",
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="01012345678 "
              required
            />
            {errors.phnum && <p className="text-red-500 text-sm mt-1">{errors.phnum}</p>}
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
              <p className="text-red-500 text-sm mt-1">{errors.Classifnumber}</p>
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
              className={`w-full border ${
                errors.referralID ? "border-red-400" : "border-gray-300"
              } rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400`}
              placeholder="추천할 심사원의 ID를 입력하세요 (없으면 공백)"
            />
            {errors.referralID && (
              <p className="text-red-500 text-sm mt-1">{errors.referralID}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
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
      <p className="text-gray-700 mb-2"><b>이름:</b> {modalData.name}</p>
      <p className="text-gray-700 mb-2"><b>아이디:</b> {modalData.loginID}</p>
      <p className="text-gray-700 mb-2"><b>휴대폰:</b> {modalData.phnum}</p>
      <p className="text-gray-700 mb-4"><b>추천인:</b> {modalData.referralID || "없음"}</p>
      <p className="text-gray-700 mb-4"><b>직책:</b> 심사원보</p>
      <button
        onClick={handleModalClose}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
      >
        확인
      </button>
    </div>
  </div>
)}
    </div>
  );
}
"use client";

import { useState } from "react";

export default function SignupAgree() {
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 전체 동의 체크박스 핸들러
  const handleAgreeAll = () => {
    const newValue = !agreeAll;
    setAgreeAll(newValue);
    setAgreeTerms(newValue);
    setAgreePrivacy(newValue);
  };

  // 각각 동의 체크박스 핸들러
  const handleAgreeTerms = () => {
    const newValue = !agreeTerms;
    setAgreeTerms(newValue);
    if (!newValue || !agreePrivacy) {
      setAgreeAll(false);
    } else if (newValue && agreePrivacy) {
      setAgreeAll(true);
    }
  };

  const handleAgreePrivacy = () => {
    const newValue = !agreePrivacy;
    setAgreePrivacy(newValue);
    if (!agreeTerms || !newValue) {
      setAgreeAll(false);
    } else if (agreeTerms && newValue) {
      setAgreeAll(true);
    }
  };

  // 다음 버튼 클릭 시
  const handleNext = () => {
    if (agreeTerms && agreePrivacy) {
      alert("다음 단계로 이동");
      // 예) router.push("/signupmember");
    } else {
      alert("필수 약관에 동의해주세요.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">회원가입 이용약관 동의</h1>

        <div className="mb-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={agreeAll}
              onChange={handleAgreeAll}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 font-semibold">전체 약관에 동의합니다.</span>
          </label>
        </div>

        <div className="mb-4 p-4 border rounded-md max-h-40 overflow-y-auto">
          {/* 실제 약관 내용 여기에 넣으세요 */}
          <label className="inline-flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={handleAgreeTerms}
              className="form-checkbox h-5 w-5 text-blue-600 mt-1"
            />
            <div className="ml-2 text-sm leading-relaxed">
              <strong>이용약관 동의 (필수)</strong>
              <p>여기에 이용약관 상세 내용이 들어갑니다...</p>
            </div>
          </label>
        </div>

        <div className="mb-6 p-4 border rounded-md max-h-40 overflow-y-auto">
          <label className="inline-flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={handleAgreePrivacy}
              className="form-checkbox h-5 w-5 text-blue-600 mt-1"
            />
            <div className="ml-2 text-sm leading-relaxed">
              <strong>개인정보 수집 및 이용 동의 (필수)</strong>
              <p>여기에 개인정보 수집 관련 상세 내용이 들어갑니다...</p>
            </div>
          </label>
        </div>

        <button
          onClick={handleNext}
          disabled={!(agreeTerms && agreePrivacy)}
          className={`w-full py-3 rounded-lg text-white font-semibold transition ${
            agreeTerms && agreePrivacy ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModalData {
  message: string;
  loginID: string;
  name: string;
  phnum: string;
  referralID: string;
  classification: string;
}

interface ExpertiseCategories {
  [key: string]: string[];
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
    address: "",
    account: "",
    eduLocation: "본사",
    eduDate: "",
  });

  const [errors, setErrors] = useState({
    loginID: "",
    password: "",
    verifyPassword: "",
    name: "",
    phnum: "",
    Classifnumber: "",
    referralID: "",
    address: "",
    account: "",
    eduDate: "",
  });

  const [passwordcheck, setPasswordcheck] = useState("");
  const [ssnRaw, setSsnRaw] = useState("");
  const [referralCheckTimer, setReferralCheckTimer] = useState<NodeJS.Timeout | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // 전문분야 관련 state
  const [expertiseCategories, setExpertiseCategories] = useState<ExpertiseCategories>({});
  const [selectedExpertises, setSelectedExpertises] = useState<string[]>([]);
  const [customExpertise, setCustomExpertise] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // ✅ 전문분야 목록 불러오기
  useEffect(() => {
    const fetchExpertises = async () => {
      try {
        const res = await fetch("http://petback.hysu.kr/back/expertise/categories");
        if (!res.ok) throw new Error("전문분야 조회 실패");
        const data = await res.json();
        setExpertiseCategories(data);
      } catch (err) {
        console.error("전문분야 조회 에러:", err);
        // 실패 시 기본값 설정
        setExpertiseCategories({
          "헬스케어(Health Care)": ["수의학", "동물보건", "재활/피트니스", "마사지", "아로마", "기타 대체요법"],
          "서비스(Services)": ["훈련", "미용", "호텔", "유치원", "펫택시", "장례"],
          "제품산업(Products & Industry)": ["펫푸드", "반려동물 용품", "펫패션(의류)", "펫테크(기기)", "유통(도소매)", "산업(제조/설비)"],
          "기타 전문 분야(Others)": ["미디어(콘텐츠/출판)", "법률(정책/행정)"]
        });
      }
    };
    fetchExpertises();
  }, []);

  // ✅ 전문분야 체크박스 처리
  const handleExpertiseChange = (expertise: string) => {
    setSelectedExpertises((prev) => {
      if (prev.includes(expertise)) {
        return prev.filter((e) => e !== expertise);
      } else {
        return [...prev, expertise];
      }
    });
  };

  // ✅ 비밀번호 일치 검증
  useEffect(() => {
    if (passwordcheck) {
      const errorMsg = passwordcheck !== formData.password ? "비밀번호가 일치하지 않습니다." : "";
      setErrors((prev) => ({ ...prev, verifyPassword: errorMsg }));
    }
  }, [formData.password, passwordcheck]);

  // ✅ cleanup
  useEffect(() => {
    return () => {
      if (referralCheckTimer) {
        clearTimeout(referralCheckTimer);
      }
    };
  }, [referralCheckTimer]);

  // ✅ 추천인 검증
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

  // ✅ 필드 검증
  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "loginID":
        if (value.length < 4) errorMsg = "아이디는 4자 이상이어야 합니다.";
        break;
      case "password":
        if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(value))
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
      case "account":
        if (value && !/^[\d-]+$/.test(value))
          errorMsg = "계좌번호는 숫자와 -만 입력 가능합니다.";
        break;
      case "eduDate":
        if (value && new Date(value) > new Date())
          errorMsg = "교육 날짜는 미래일 수 없습니다.";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg === "";
  };

  // ✅ 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // 비밀번호 확인 처리
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
      account: validateField("account", formData.account),
      eduDate: validateField("eduDate", formData.eduDate),
    };

    // 비밀번호 확인 검증
    const passwordMatch = passwordcheck === formData.password;
    if (!passwordMatch) {
      setErrors((prev) => ({ ...prev, verifyPassword: "비밀번호가 일치하지 않습니다." }));
    }

    // 전문분야 검증
    if (selectedExpertises.length === 0 && !customExpertise.trim()) {
      alert("전문분야를 최소 1개 이상 선택해주세요.");
      return;
    }

    const isValid = Object.values(validations).every((v) => v === true) && passwordMatch;

    if (!isValid || errors.referralID) {
      alert("입력값을 확인해주세요.");
      return;
    }

const payload = {
    ...formData,
    Classifnumber: ssnRaw,
    expertises: selectedExpertises,
    customExpertise: showCustomInput ? customExpertise.trim() : null,
  };

  try {
    const res = await fetch("http://petback.hysu.kr/back/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();

    if (!res.ok) {
      throw new Error(responseText || "회원가입 요청 실패");
    }

    // ✅ 서버 메시지 포함
    setModalData({
      message: responseText,
      loginID: formData.loginID,
      name: formData.name,
      phnum: formData.phnum,
      referralID: formData.referralID || "없음",
      classification: "심사원",
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "회원가입 중 알 수 없는 오류가 발생했습니다.";
    alert(message);
    console.error("회원가입 에러:", e);
  }
};

  // ✅ 모달 닫기
  const handleModalClose = () => {
    setModalData(null);
    router.push("/");
  };

  return (
    <div className="flex justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-10 sm:py-16 min-h-screen items-start">
      <div className="relative bg-white w-full max-w-2xl p-8 sm:p-10 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
        >
          &times;
        </button>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">심사원 회원가입</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-gray-700 mb-2">이름 *</label>
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
            <label className="block text-gray-700 mb-2">아이디 *</label>
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
            <label className="block text-gray-700 mb-2">비밀번호 *</label>
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
            <label className="block text-gray-700 mb-2">비밀번호 확인 *</label>
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
            <label className="block text-gray-700 mb-2">휴대폰 번호 *</label>
            <input
              type="text"
              name="phnum"
              value={formData.phnum}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="01012345678"
              required
            />
            {errors.phnum && <p className="text-red-500 text-sm mt-1">{errors.phnum}</p>}
          </div>

          {/* 주민등록번호 */}
          <div>
            <label className="block text-gray-700 mb-2">주민등록번호 *</label>
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

          {/* 주소 */}
          <div>
            <label className="block text-gray-700 mb-2">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="주소를 입력하세요"
            />
          </div>

          {/* 계좌번호 */}
          <div>
            <label className="block text-gray-700 mb-2">계좌번호</label>
            <input
              type="text"
              name="account"
              value={formData.account}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              placeholder="계좌번호를 입력하세요 (예: 110-123-456789)"
            />
            {errors.account && <p className="text-red-500 text-sm mt-1">{errors.account}</p>}
          </div>

          {/* 전문분야 선택 */}
          <div>
            <label className="block text-gray-700 mb-3 font-semibold">전문분야 선택 *</label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
              {Object.entries(expertiseCategories).map(([category, expertises]) => (
                <div key={category} className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{category}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {expertises.map((expertise) => (
                      <label key={expertise} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedExpertises.includes(expertise)}
                          onChange={() => handleExpertiseChange(expertise)}
                          className="w-4 h-4 text-blue-500"
                        />
                        <span className="text-sm text-gray-700">{expertise}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* 기타 전문분야 입력 */}
              <div className="mt-4 pt-4 border-t">
                <label className="flex items-center space-x-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={showCustomInput}
                    onChange={(e) => setShowCustomInput(e.target.checked)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="font-semibold text-gray-800">기타 (직접 입력)</span>
                </label>
                {showCustomInput && (
                  <input
                    type="text"
                    value={customExpertise}
                    onChange={(e) => setCustomExpertise(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
                    placeholder="기타 전문분야를 입력하세요"
                  />
                )}
              </div>
            </div>
            {selectedExpertises.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                선택된 전문분야: {selectedExpertises.join(", ")}
              </p>
            )}
          </div>

          {/* 교육 장소 */}
          <div>
            <label className="block text-gray-700 mb-2">교육 받은 장소 *</label>
            <select
              name="eduLocation"
              value={formData.eduLocation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="본사">본사</option>
              <option value="대구경북지사">대구경북지사</option>
            </select>
          </div>

          {/* 교육 날짜 */}
          <div>
            <label className="block text-gray-700 mb-2">교육 받은 날짜 *</label>
            <input
              type="date"
              name="eduDate"
              value={formData.eduDate}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
              required
            />
            {errors.eduDate && <p className="text-red-500 text-sm mt-1">{errors.eduDate}</p>}
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
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-[rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300">
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">회원가입 신청 완료</h2>
      
      {/* ✅ 서버 메시지 표시 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-blue-800 font-medium whitespace-pre-line">{modalData.message}</p>
      </div>

      <p className="text-gray-700 mb-2">
        <b>이름:</b> {modalData.name}
      </p>
      <p className="text-gray-700 mb-2">
        <b>아이디:</b> {modalData.loginID}
      </p>
      <p className="text-gray-700 mb-2">
        <b>휴대폰:</b> {modalData.phnum}
      </p>
      <p className="text-gray-700 mb-4">
        <b>추천인:</b> {modalData.referralID}
      </p>
      <p className="text-gray-700 mb-4">
        <b>직책:</b> 심사원보 (승인 대기)
      </p>
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
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModalData {
  message: string;
  loginID: string;
  name: string;
  phnum: string;
  classifnumber: string;
  classification: string;
  referralID: string;
}

interface DaumPostcodeData {
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
}

export default function Signupmember() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    loginID: "",
    password: "",
    name: "",
    phnum: "",
    Classifnumber: "",
    referralID: "",
    classification: "기업",
    address: "",
    addressDetail: "", // ✅ 상세주소 추가
    email: "",
    companycls: "",
    introduction: "",
    mainsales: "",
  });

  const [errors, setErrors] = useState({
    loginID: "",
    password: "",
    verifyPassword: "",
    name: "",
    phnum: "",
    Classifnumber: "",
    email: "",
    referralID: "",
  });

  const [passwordcheck, setPasswordcheck] = useState("");
  const [businessNumRaw, setBusinessNumRaw] = useState("");
  const [referralCheckTimer, setReferralCheckTimer] = useState<NodeJS.Timeout | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // ✅ Daum 주소 검색 팝업 열기
  const openAddressPopup = () => {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).daum.Postcode({
        oncomplete: function(data: DaumPostcodeData) {
          let fullAddress = data.address;
          let extraAddress = "";

          if (data.addressType === "R") {
            if (data.bname !== "") {
              extraAddress += data.bname;
            }
            if (data.buildingName !== "") {
              extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
          }

          setFormData((prev) => ({ ...prev, address: fullAddress }));
        },
        width: "100%",
        height: "100%"
      }).open();
    };
  };

  // ✅ cleanup
  useEffect(() => {
    return () => {
      if (referralCheckTimer) {
        clearTimeout(referralCheckTimer);
      }
    };
  }, [referralCheckTimer]);

  // ✅ 심사원 ID 검증
  const validateReferralID = async (referralID: string) => {
    if (!referralID) {
      setErrors((prev) => ({ ...prev, referralID: "" }));
      return;
    }

    try {
      const res = await fetch("http://www.kcci.co.kr/back/user/loginInfo");
      if (!res.ok) throw new Error("유저 조회 실패");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("잘못된 응답 형식");

      const exists = data.includes(referralID);
      setErrors((prev) => ({
        ...prev,
        referralID: exists ? "" : "해당 심사원이 존재하지 않습니다.",
      }));
    } catch (err) {
      console.error("심사원 ID 조회 에러:", err);
      setErrors((prev) => ({
        ...prev,
        referralID: "심사원 ID 확인 중 오류가 발생했습니다.",
      }));
    }
  };

  // ✅ 비밀번호 일치 검증
  useEffect(() => {
    if (passwordcheck) {
      const errorMsg = passwordcheck !== formData.password ? "비밀번호가 일치하지 않습니다." : "";
      setErrors((prev) => ({ ...prev, verifyPassword: errorMsg }));
    }
  }, [formData.password, passwordcheck]);

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
        if (!/^\d{10}$/.test(value)) errorMsg = "사업자등록번호 10자리를 입력해주세요.";
        break;
      case "name":
        if (!value) errorMsg = "기업명을 입력해주세요.";
        break;
      case "email":
        if (value && !/^[A-Za-z0-9+_.-]+@(.+)$/.test(value))
          errorMsg = "이메일 형식이 올바르지 않습니다.";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg === "";
  };

  // ✅ 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // 심사원 ID 디바운스 검증
    if (name === "referralID") {
      if (referralCheckTimer) clearTimeout(referralCheckTimer);
      const timer = setTimeout(() => {
        validateReferralID(value);
      }, 500);
      setReferralCheckTimer(timer);
    }
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
      email: validateField("email", formData.email),
    };

    // 비밀번호 확인 검증
    const passwordMatch = passwordcheck === formData.password;
    if (!passwordMatch) {
      setErrors((prev) => ({ ...prev, verifyPassword: "비밀번호가 일치하지 않습니다." }));
    }

    const isValid = Object.values(validations).every((v) => v === true) && passwordMatch;

    if (!isValid || errors.referralID) {
      alert("입력값을 확인해주세요.");
      return;
    }

    // ✅ 주소와 상세주소를 합쳐서 전송
    const fullAddress = formData.addressDetail 
      ? `${formData.address} ${formData.addressDetail}` 
      : formData.address;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      ...formData,
      address: fullAddress, // ✅ 합쳐진 주소
      Classifnumber: businessNumRaw,
    };

    // addressDetail은 payload에서 제거 (백엔드에 불필요)
    delete payload.addressDetail;

    try {
      const res = await fetch("http://www.kcci.co.kr/back/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      if (!res.ok) {
        throw new Error(responseText || "회원가입 요청 실패");
      }

      // ✅ 서버 메시지 포함하여 모달 표시
      setModalData({
        message: responseText,
        loginID: formData.loginID,
        name: formData.name,
        phnum: formData.phnum,
        classifnumber: formData.Classifnumber,
        classification: "기업",
        referralID: formData.referralID || "없음",
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

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">기업 회원가입</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 기업명 */}
          <div>
            <label className="block text-gray-700 mb-2">기업명 *</label>
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
            <label className="block text-gray-700 mb-2">아이디 *</label>
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
            <label className="block text-gray-700 mb-2">비밀번호 *</label>
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
            <label className="block text-gray-700 mb-2">비밀번호 확인 *</label>
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
            <label className="block text-gray-700 mb-2">휴대폰 번호 *</label>
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
            <label className="block text-gray-700 mb-2">사업자등록번호 *</label>
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

          {/* ✅ 주소 검색 - 클릭하면 팝업 */}
          <div>
            <label className="block text-gray-700 mb-2">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onClick={openAddressPopup}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer hover:border-green-400 focus:ring-2 focus:ring-green-400"
              placeholder="클릭하여 주소를 검색하세요"
            />
          </div>

          {/* ✅ 상세주소 */}
          {formData.address && (
            <div>
              <label className="block text-gray-700 mb-2">상세주소</label>
              <input
                type="text"
                name="addressDetail"
                value={formData.addressDetail}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
                placeholder="상세주소를 입력하세요 (예: 101동 202호)"
              />
            </div>
          )}

          {/* ✅ 심사원 ID 추가 */}
          <div>
            <label className="block text-gray-700 mb-2">심사원 아이디</label>
            <input
              type="text"
              name="referralID"
              value={formData.referralID}
              onChange={handleChange}
              className={`w-full border ${
                errors.referralID ? "border-red-400" : "border-gray-300"
              } rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400`}
              placeholder="담당 심사원의 ID를 입력하세요"
            />
            {errors.referralID && (
              <p className="text-red-500 text-sm mt-1">{errors.referralID}</p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="company@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* 사업분류 */}
          <div>
            <label className="block text-gray-700 mb-2">사업분류</label>
            <input
              type="text"
              name="companycls"
              value={formData.companycls}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="예: 펫푸드 제조, 반려동물 용품 도소매"
            />
          </div>

          {/* 회사소개 */}
          <div>
            <label className="block text-gray-700 mb-2">회사소개</label>
            <textarea
              name="introduction"
              value={formData.introduction}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="회사 소개를 입력하세요"
            />
          </div>

          {/* 주요판매상품 */}
          <div>
            <label className="block text-gray-700 mb-2">주요판매상품</label>
            <input
              type="text"
              name="mainsales"
              value={formData.mainsales}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400"
              placeholder="예: 천연 사료, 간식류, 장난감"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            회원가입 완료
          </button>
        </form>
      </div>

      {/* ✅ 회원가입 성공 모달 - 메시지 추가 */}
      {modalData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">회원가입 신청 완료</h2>
            
            {/* ✅ 서버 메시지 표시 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium whitespace-pre-line">{modalData.message}</p>
            </div>

            <p className="text-gray-700 mb-2">
              <b>기업명:</b> {modalData.name}
            </p>
            <p className="text-gray-700 mb-2">
              <b>아이디:</b> {modalData.loginID}
            </p>
            <p className="text-gray-700 mb-2">
              <b>휴대폰:</b> {modalData.phnum}
            </p>
            <p className="text-gray-700 mb-2">
              <b>사업자등록번호:</b> {modalData.classifnumber}
            </p>
            <p className="text-gray-700 mb-4">
              <b>심사원 ID:</b> {modalData.referralID}
            </p>
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
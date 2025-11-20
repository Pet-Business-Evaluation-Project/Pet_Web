"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface SignStart {
  signstartId: number;
  signId: number;
  reviewerId: number;
  signtype?: string | null;
  membergrade?: string;
  signstate?: string;
  signdate?: string;
  effectivedate?: string;
  reviewcomplete?: string;
  affairdo?: string;
  signcount?: number;
  name?: string;
  reviewerName?: string;
}

interface ReviewerListItem {
  reviewerId: number;
  reviewerName?: string;
  signcount?: number;
}

interface CurrentUser {
  id: number;
  classification: string;
}

export default function MemberRegister() {
  const [signs, setSigns] = useState<SignStart[]>([]);
  const [currentSign, setCurrentSign] = useState<SignStart | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  const [reviewersModalOpen, setReviewersModalOpen] = useState(false);
  const [reviewersList, setReviewersList] = useState<ReviewerListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const signtypeOptions = ['미정','동물기업인증','우수제품인증','친환경기업인증','동물복지기업인증','동물복지제품인증'];
  const signstateOptions = ['보완','부적합','완료'];
  const reviewcompleteOptions = ['진행중','심사완료'];
  const affairdoOptions = ['시행','미시행'];

  const membergradeMap: Record<string, string> = {
    level1: "1단계",
    level2: "2단계",
    level3: "3단계",
    level4: "4단계",
    level5: "5단계"
  };

  const reverseMembergradeMap: Record<string, string> = {
    "1단계": "level1",
    "2단계": "level2",
    "3단계": "level3",
    "4단계": "level4",
    "5단계": "level5"
  };

  // 🔥 Axios 인스턴스 생성 - withCredentials를 항상 포함
  const axiosInstance = axios.create({
    baseURL: "https://www.kcci.co.kr/back",
    withCredentials: true, // 세션 쿠키 자동 포함
    headers: {
      "Content-Type": "application/json"
    }
  });

  // 🔥 요청 인터셉터 - X-USER-ID 헤더 자동 추가
  axiosInstance.interceptors.request.use(
    (config) => {
      if (currentUser?.id) {
        config.headers["X-USER-ID"] = currentUser.id.toString();
      }
      console.log("📤 요청:", config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error("❌ 요청 에러:", error);
      return Promise.reject(error);
    }
  );

  // 🔥 응답 인터셉터 - 에러 핸들링
  axiosInstance.interceptors.response.use(
    (response) => {
      console.log("📥 응답:", response.status, response.config.url);
      return response;
    },
    (error) => {
      if (error.response?.status === 403) {
        console.error("🚫 403 Forbidden - 권한 없음 또는 세션 만료");
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
      console.error("❌ 응답 에러:", error);
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        
        // 접근 권한 체크: classification이 "관리자" 또는 "심사원"인 경우만 허용
        if (user.classification !== "관리자" && user.classification !== "심사원") {
          setHasAccess(false);
          setError("접근 권한이 없습니다. 관리자 또는 심사원만 이용 가능합니다.");
        }
      } else {
        // 로그인하지 않은 경우에도 접근 거부
        setHasAccess(false);
        setError("로그인 후 이용 가능합니다. 관리자 또는 심사원만 접근할 수 있습니다.");
      }
    }
  }, []);

  const fetchMySigns = async () => {
    if (!currentUser?.id) return;
    try {
      if (currentUser.classification === "관리자") {
        const res = await axiosInstance.get<SignStart[]>("/signstart/all");
        console.log("✅ 전체 인증 목록:", res.data);
        const uniqueMap = new Map<number, SignStart>();
        res.data.forEach(sign => {
          if (!uniqueMap.has(sign.signId)) uniqueMap.set(sign.signId, sign);
        });
        setSigns(Array.from(uniqueMap.values()));
      } else {
        const reviewerRes = await axiosInstance.post(
          "/user/reviwerinfo",
          { userId: currentUser.id }
        );
        const myReviewerId: number = reviewerRes.data.reviewerId;
        console.log("✅ 내 심사원 ID:", myReviewerId);

        const allSignsRes = await axiosInstance.get<SignStart[]>("/signstart/all");
        const mySigns = allSignsRes.data.filter(sign => sign.reviewerId === myReviewerId);
        const uniqueMap = new Map<number, SignStart>();
        mySigns.forEach(sign => {
          if (!uniqueMap.has(sign.signId)) uniqueMap.set(sign.signId, sign);
        });
        setSigns(Array.from(uniqueMap.values()));
        console.log("✅ 내 담당 인증 목록:", mySigns.length);
      }
    } catch (err) {
      console.error("❌ 인증 정보 로드 실패:", err);
      setError("인증 정보를 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => { 
    if (currentUser?.id) {
      fetchMySigns(); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleClick = async (sign: SignStart) => {
    if (!currentUser?.id) return;
    try {
      if (currentUser.classification !== "관리자") {
        const reviewerRes = await axiosInstance.post(
          "/user/reviwerinfo",
          { userId: currentUser.id }
        );
        const myReviewerId: number = reviewerRes.data.reviewerId;
        if (sign.reviewerId !== myReviewerId) {
          alert("접근 권한이 없습니다.");
          return;
        }
      }
      const res = await axiosInstance.get<SignStart>(
        `/signstart/detail/${sign.signstartId}`
      );
      setCurrentSign(res.data);
      console.log("✅ 상세 정보 로드:", res.data);
    } catch (err) {
      console.error("❌ 상세 정보 로드 실패:", err);
      alert("상세 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleChange = (field: keyof SignStart, value: string) => {
    if (!currentSign) return;
    if (field === "signcount") {
      if (isNaN(Number(value))) { 
        alert("심사 횟수는 숫자만 입력 가능합니다."); 
        return; 
      }
      setCurrentSign({ ...currentSign, [field]: Number(value) });
    } else if (field === "membergrade") {
      setCurrentSign({ ...currentSign, [field]: reverseMembergradeMap[value] });
    } else if (field === "signtype") {
      // '미정'을 선택하면 null로 저장
      setCurrentSign({ ...currentSign, [field]: value === "미정" ? null : value });
    } else {
      setCurrentSign({ ...currentSign, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!currentSign || !currentUser) return;
    setSaving(true);
    try {
      if (currentUser.classification === "관리자" && currentSign.membergrade) {
        await axiosInstance.put(
          `/signstart/updatebysign/${currentSign.signId}`,
          currentSign
        );
        console.log("✅ 관리자 업데이트 완료 (전체)");
      } else {
        await axiosInstance.put(
          `/signstart/update/${currentSign.signstartId}`,
          currentSign
        );
        console.log("✅ 심사원 업데이트 완료 (개별)");
      }
      alert("저장 완료!");
      setSaving(false);
      fetchMySigns();
    } catch (err) {
      console.error("❌ 저장 실패:", err);
      alert("저장 실패. 관리자에게 문의하세요.");
      setSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentSign(null);
    setReviewersModalOpen(false);
    setReviewersList([]);
  };

  const handleViewReviewers = async () => {
    if (!currentSign || !currentUser) return;
    try {
      const res = await axiosInstance.get<SignStart[]>(
        `/signstart/bysign/${currentSign.signId}`
      );
      const list = res.data.map(r => ({
        reviewerId: r.reviewerId,
        reviewerName: r.reviewerName,
        signcount: r.signcount
      }));
      setReviewersList(list);
      setReviewersModalOpen(true);
      console.log("✅ 심사원 목록 로드:", list.length);
    } catch (err) {
      console.error("❌ 심사원 정보 로드 실패:", err);
      alert("심사원 정보를 불러오는데 실패했습니다.");
    }
  };

  // 접근 권한이 없는 경우
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    );
  }

  // 상세 화면
  if (currentSign) {
    const isAdmin = currentUser?.classification === "관리자";
    const isReviewer = currentUser?.classification !== "관리자";

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">인증 상세 정보</h1>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 인증 종류 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">인증 종류</label>
                <select
                  value={currentSign.signtype || "미정"}
                  onChange={e => handleChange("signtype", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                >
                  {signtypeOptions
                    .filter(opt => opt === "미정" ? !currentSign.signtype : true)
                    .map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>

              {/* 기업 규모 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">기업 규모</label>
                <select
                  value={currentSign.membergrade ? membergradeMap[currentSign.membergrade] : "심사 중"}
                  onChange={e => handleChange("membergrade", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!isAdmin}
                >
                  {Object.values(membergradeMap).map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>

              {/* 인증 상태 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">인증 상태</label>
                <select
                  value={currentSign.signstate || ""}
                  onChange={e => handleChange("signstate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isReviewer && currentSign.signstate ? true : false}
                >
                  {signstateOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>

              {/* 인증 날짜 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">인증 날짜</label>
                <input
                  type="date"
                  value={currentSign.signdate?.split("T")[0] || ""}
                  onChange={e => handleChange("signdate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                />
              </div>

              {/* 유효 날짜 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">유효 날짜</label>
                <input
                  type="date"
                  value={currentSign.effectivedate?.split("T")[0] || ""}
                  onChange={e => handleChange("effectivedate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                />
              </div>

              {/* 심사 완료 여부 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">심사 완료 여부</label>
                <select
                  value={currentSign.reviewcomplete || ""}
                  onChange={e => handleChange("reviewcomplete", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                >
                  {reviewcompleteOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>

              {/* 공정심사위원회 시행 여부 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 block">공정심사위원회 시행 여부</label>
                <select
                  value={currentSign.affairdo || ""}
                  onChange={e => handleChange("affairdo", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                >
                  {affairdoOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              </div>

              {/* 심사 횟수 */}
              {!isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 block">심사 횟수</label>
                  <input
                    type="number"
                    value={currentSign.signcount || 0}
                    onChange={e => handleChange("signcount", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                  />
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              {isAdmin && (
                <button
                  onClick={handleViewReviewers}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium shadow-sm hover:shadow-md"
                >
                  심사원 보기
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>

        {/* 심사원 모달 */}
        {reviewersModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">배정된 심사원 목록</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 rounded-tl-xl">심사원명</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 rounded-tr-xl">심사 횟수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reviewersList.map(r => (
                      <tr key={r.reviewerId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-800">{r.reviewerName || r.reviewerId}</td>
                        <td className="px-6 py-4 text-gray-800">{r.signcount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setReviewersModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 목록 화면
  // 검색 필터링
  const filteredSigns = signs.filter(sign => 
    sign.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">인증 현황</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* 검색 영역 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="기업명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white shadow-sm"
            />
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700">기업명</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700">기업 규모</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700">인증 종류</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700">심사 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSigns.length > 0 ? (
                  filteredSigns.map(sign => (
                    <tr
                      key={sign.signstartId}
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                      onClick={() => handleClick(sign)}
                    >
                      <td className="px-8 py-5 text-gray-800 font-medium">{sign.name || "기업명 미기재"}</td>
                      <td className="px-8 py-5 text-gray-700">{sign.membergrade ? membergradeMap[sign.membergrade] : "심사 중"}</td>
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                          {sign.signtype || "미정"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          sign.reviewcomplete === '심사완료' ? 'bg-green-100 text-green-700' :
                          sign.reviewcomplete === '진행중' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sign.reviewcomplete || "정보 없음"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-gray-500">
                      {searchTerm ? "검색 결과가 없습니다." : "등록된 인증이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
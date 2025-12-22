"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import {
  Calculator,
  Users,
  TrendingUp,
  DollarSign,
  BookOpen,
  Award,
  Settings,
} from "lucide-react";

// 타입 정의
interface Reviewer {
  user_id: number;
  name: string;
  loginID: string;
}

interface ReviewerData {
  user_id: number;
  name?: string;
  loginID: string;
  reviewer_id: number;
}

interface UserCostData {
  userId: number;
  chargeCost: number;
  inviteCost: number;
  referralCost: number;
  reviewCost: number;
  studyCost: number;
  totalCost: number;
}

interface CostItem {
  id: number;
  userId: number;
  userName?: string;
  cost: number;
  paymentStatus?: string;
  createdat: string;
  bankName?: string;
  accountNumber?: string;
  referredUserId?: number;
  referredUserName?: string;
}

interface CostListResponse {
  costType: string;
  costs: CostItem[];
  totalAmount: number;
}

interface MonthlyCost {
  year: number;
  month: number;
  chargeCost: number;
  inviteCost: number;
  referralCost: number;
  reviewCost: number;
  studyCost: number;
  totalCost: number;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface CostConfig {
  configId: number;
  configType: string;
  gradeName: string;
  value: number;
  createdat: string;
  updatedat: string;
}

const BASE_URL = "https://www.kcci.co.kr/back";

const fetchWithAuth = async (url: string, options: FetchOptions = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include", // 세션 쿠키만 전송
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};
export default function CostCalculator() {
  const [activeTab, setActiveTab] = useState<"management" | "settings">(
    "management"
  );
  const [reviewerList, setReviewerList] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<number | "">("");
  const [studyCostInput, setStudyCostInput] = useState<number>(0);
  const [costsData, setCostsData] = useState<UserCostData | null>(null);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // 비용 설정 상태
  const [certificationConfigs, setCertificationConfigs] = useState<
    CostConfig[]
  >([]);
  const [reviewFeeConfigs, setReviewFeeConfigs] = useState<CostConfig[]>([]);
  const [commissionConfigs, setCommissionConfigs] = useState<CostConfig[]>([]);
  const [referralCostConfig, setReferralCostConfig] =
    useState<CostConfig | null>(null);
  const [selectedCertConfig, setSelectedCertConfig] =
    useState<CostConfig | null>(null);
  const [selectedReviewFeeConfig, setSelectedReviewFeeConfig] =
    useState<CostConfig | null>(null);
  const [selectedCommissionConfig, setSelectedCommissionConfig] =
    useState<CostConfig | null>(null);
  const [certValue, setCertValue] = useState<number>(0);
  const [reviewFeeValue, setReviewFeeValue] = useState<number>(0);
  const [commissionValue, setCommissionValue] = useState<number>(0);
  const [referralCostValue, setReferralCostValue] = useState<number>(0);

  // 🔹 심사원 로딩
  useEffect(() => {
    fetchWithAuth(`${BASE_URL}/mypage/admin`, {
      method: "POST",
      body: JSON.stringify({ classification: "관리자" }),
    })
      .then((res) => res.json())
      .then((data: ReviewerData[]) => {
        const list = Array.isArray(data) ? data : [];
        setReviewerList(
          list
            .filter((d) => d.reviewer_id != null)
            .map((d) => ({
              user_id: d.user_id,
              name: d.name || `심사원${d.reviewer_id}`,
              loginID: d.loginID,
            }))
        );
      })
      .catch(() => setReviewerList([]));
  }, []);

  // 🔹 비용 설정 데이터 로딩
  useEffect(() => {
    if (activeTab === "settings") {
      // 전체 설정 조회 후 프론트에서 필터링
      fetchWithAuth(`${BASE_URL}/cost-config`)
        .then((res) => {
          console.log("전체 설정 응답 상태:", res.status);
          return res.json();
        })
        .then((data: CostConfig[] | { message?: string; error?: string }) => {
          // ✅ 수정!
          console.log("전체 설정 데이터:", JSON.stringify(data, null, 2));

          if (!Array.isArray(data)) {
            // 에러 응답 처리
            const errorData = data as { message?: string; error?: string };
            console.error(
              "백엔드 에러 메시지:",
              errorData.message || errorData.error
            );
            alert(
              `비용 설정 로딩 실패: ${errorData.message || errorData.error}`
            );
            setCertificationConfigs([]);
            setReviewFeeConfigs([]);
            setCommissionConfigs([]);
            return;
          }

          // 타입별로 필터링
          const certConfigs = data.filter(
            (c) => c.configType === "MEMBER_GRADE_CERTIFICATION"
          );
          const reviewConfigs = data.filter(
            (c) => c.configType === "REVIEWER_GRADE_REVIEW"
          );
          const commissionConfigs = data.filter(
            (c) => c.configType === "REFERRAL_GRADE_CHARGE_RATE"
          );
          const referralConfigs = data.filter(
            (c) => c.configType === "REFERRAL_COST_DEFAULT"
          );

          console.log("기업 인증 비용:", certConfigs);
          console.log("심사비:", reviewConfigs);
          console.log("수수료 비율:", commissionConfigs);
          console.log("추천비:", referralConfigs);

          setCertificationConfigs(certConfigs);
          setReviewFeeConfigs(reviewConfigs);
          setCommissionConfigs(commissionConfigs);

          // 추천비는 단일 항목
          if (referralConfigs.length > 0) {
            setReferralCostConfig(referralConfigs[0]);
            setReferralCostValue(referralConfigs[0].value);
          }
        })
        .catch((error) => {
          console.error("전체 설정 로딩 실패:", error);
          setCertificationConfigs([]);
          setReviewFeeConfigs([]);
          setCommissionConfigs([]);
        });
    }
  }, [activeTab]);

  // 🔹 비용 데이터 로딩 함수
  const loadCostsData = async (userId: number) => {
    try {
      // 각 카테고리별 API 호출
      const [chargeData, inviteData, referralData, reviewData, studyData] =
        (await Promise.all([
          fetchWithAuth(`${BASE_URL}/costs/charge`).then((res) => res.json()),
          fetchWithAuth(`${BASE_URL}/costs/invite`).then((res) => res.json()),
          fetchWithAuth(`${BASE_URL}/costs/referral`).then((res) => res.json()),
          fetchWithAuth(`${BASE_URL}/costs/review`).then((res) => res.json()),
          fetchWithAuth(`${BASE_URL}/costs/study`).then((res) => res.json()),
        ])) as CostListResponse[];

      // 선택된 심사원의 항목만 필터링
      const userChargeCosts = chargeData.costs.filter(
        (c) => c.userId === userId
      );
      const userInviteCosts = inviteData.costs.filter(
        (c) => c.userId === userId
      );
      const userReferralCosts = referralData.costs.filter(
        (c) => c.userId === userId
      );
      const userReviewCosts = reviewData.costs.filter(
        (c) => c.userId === userId
      );
      const userStudyCosts = studyData.costs.filter((c) => c.userId === userId);

      // 총 비용 계산
      const totalChargeCost = userChargeCosts.reduce(
        (sum, c) => sum + c.cost,
        0
      );
      const totalInviteCost = userInviteCosts.reduce(
        (sum, c) => sum + c.cost,
        0
      );
      const totalReferralCost = userReferralCosts.reduce(
        (sum, c) => sum + c.cost,
        0
      );
      const totalReviewCost = userReviewCosts.reduce(
        (sum, c) => sum + c.cost,
        0
      );
      const totalStudyCost = userStudyCosts.reduce((sum, c) => sum + c.cost, 0);

      setCostsData({
        userId: userId,
        chargeCost: totalChargeCost,
        inviteCost: totalInviteCost,
        referralCost: totalReferralCost,
        reviewCost: totalReviewCost,
        studyCost: totalStudyCost,
        totalCost:
          totalChargeCost +
          totalInviteCost +
          totalReferralCost +
          totalReviewCost +
          totalStudyCost,
      });

      // 월별로 그룹화
      const monthlyMap = new Map<string, MonthlyCost>();

      const processCosts = (costs: CostItem[], type: keyof MonthlyCost) => {
        costs.forEach((cost) => {
          const date = new Date(cost.createdat);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const key = `${year}-${month}`;

          if (!monthlyMap.has(key)) {
            monthlyMap.set(key, {
              year,
              month,
              chargeCost: 0,
              inviteCost: 0,
              referralCost: 0,
              reviewCost: 0,
              studyCost: 0,
              totalCost: 0,
            });
          }

          const monthlyCost = monthlyMap.get(key)!;
          if (type !== "year" && type !== "month" && type !== "totalCost") {
            monthlyCost[type] += cost.cost;
            monthlyCost.totalCost += cost.cost;
          }
        });
      };

      processCosts(userChargeCosts, "chargeCost");
      processCosts(userInviteCosts, "inviteCost");
      processCosts(userReferralCosts, "referralCost");
      processCosts(userReviewCosts, "reviewCost");
      processCosts(userStudyCosts, "studyCost");

      // 월별 데이터를 배열로 변환 후 정렬 (최신순)
      const monthlyCostsArray = Array.from(monthlyMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setMonthlyCosts(monthlyCostsArray);

      // 기본적으로 가장 최근 월 선택
      if (monthlyCostsArray.length > 0) {
        const latest = monthlyCostsArray[0];
        setSelectedMonth(`${latest.year}-${latest.month}`);
      }
    } catch (error) {
      setCostsData(null);
      setMonthlyCosts([]);
    }
  };

  // 🔹 심사원 선택 시 비용 데이터 로딩
  useEffect(() => {
    if (!selectedReviewer) {
      setCostsData(null);
      setMonthlyCosts([]);
      setSelectedMonth("");
      return;
    }

    loadCostsData(selectedReviewer);
  }, [selectedReviewer]);

  // 🔹 강사비 저장
  const saveStudyCost = async () => {
    if (!selectedReviewer) return alert("심사원을 선택하세요");

    try {
      const res = await fetchWithAuth(`${BASE_URL}/costs/study`, {
        method: "POST",
        body: JSON.stringify({
          userId: selectedReviewer,
          cost: studyCostInput,
        }),
      });
      if (!res.ok) return alert("저장 실패");
      alert("저장 완료");
      setStudyCostInput(0);

      // 데이터 새로고침
      await loadCostsData(selectedReviewer);
    } catch {
      alert("오류 발생");
    }
  };

  // 🔹 기업 인증 비용 저장
  const saveCertificationCost = async () => {
    if (!selectedCertConfig) return alert("등급을 선택하세요");

    try {
      const res = await fetchWithAuth(`${BASE_URL}/cost-config`, {
        method: "PUT",
        body: JSON.stringify({
          configType: "MEMBER_GRADE_CERTIFICATION",
          gradeName: selectedCertConfig.gradeName,
          value: certValue,
        }),
      });
      if (!res.ok) return alert("저장 실패");
      alert("저장 완료");

      // 데이터 새로고침
      const updated = await fetchWithAuth(
        `${BASE_URL}/cost-config/MEMBER_GRADE_CERTIFICATION`
      );
      const data = await updated.json();
      setCertificationConfigs(Array.isArray(data) ? data : []);
      setSelectedCertConfig(null);
      setCertValue(0);
    } catch {
      alert("오류 발생");
    }
  };

  // 🔹 심사비 저장
  const saveReviewFeeCost = async () => {
    if (!selectedReviewFeeConfig) return alert("등급을 선택하세요");

    try {
      const res = await fetchWithAuth(`${BASE_URL}/cost-config`, {
        method: "PUT",
        body: JSON.stringify({
          configType: "REVIEWER_GRADE_REVIEW",
          gradeName: selectedReviewFeeConfig.gradeName,
          value: reviewFeeValue,
        }),
      });
      if (!res.ok) return alert("저장 실패");
      alert("저장 완료");

      // 데이터 새로고침
      const updated = await fetchWithAuth(
        `${BASE_URL}/cost-config/REVIEWER_GRADE_REVIEW`
      );
      const data = await updated.json();
      setReviewFeeConfigs(Array.isArray(data) ? data : []);
      setSelectedReviewFeeConfig(null);
      setReviewFeeValue(0);
    } catch {
      alert("오류 발생");
    }
  };

  // 🔹 수수료 비율 저장
  const saveCommissionRate = async () => {
    if (!selectedCommissionConfig) return alert("등급을 선택하세요");

    try {
      const res = await fetchWithAuth(`${BASE_URL}/cost-config`, {
        method: "PUT",
        body: JSON.stringify({
          configType: "REFERRAL_GRADE_CHARGE_RATE",
          gradeName: selectedCommissionConfig.gradeName,
          value: commissionValue,
        }),
      });
      if (!res.ok) return alert("저장 실패");
      alert("저장 완료");

      // 데이터 새로고침
      const updated = await fetchWithAuth(
        `${BASE_URL}/cost-config/REFERRAL_GRADE_CHARGE_RATE`
      );
      const data = await updated.json();
      setCommissionConfigs(Array.isArray(data) ? data : []);
      setSelectedCommissionConfig(null);
      setCommissionValue(0);
    } catch {
      alert("오류 발생");
    }
  };

  // 🔹 추천비 저장
  const saveReferralCost = async () => {
    if (!referralCostConfig) return alert("추천비 설정을 불러오지 못했습니다");

    try {
      const res = await fetchWithAuth(`${BASE_URL}/cost-config`, {
        method: "PUT",
        body: JSON.stringify({
          configType: "REFERRAL_COST_DEFAULT",
          gradeName: "default",
          value: referralCostValue,
        }),
      });
      if (!res.ok) return alert("저장 실패");
      alert("저장 완료");

      // 데이터 새로고침
      const updated = await fetchWithAuth(
        `${BASE_URL}/cost-config/REFERRAL_COST_DEFAULT`
      );
      const data = await updated.json();
      if (Array.isArray(data) && data.length > 0) {
        setReferralCostConfig(data[0]);
        setReferralCostValue(data[0].value);
      }
    } catch {
      alert("오류 발생");
    }
  };

  // 🔹 react-select 옵션 변환
  const reviewerOptions = reviewerList.map((r) => ({
    value: r.user_id,
    label: `${r.name} (${r.loginID})`,
  }));

  // 🔹 선택된 월의 비용 데이터 가져오기
  const getSelectedMonthData = () => {
    if (!selectedMonth) return null;
    return monthlyCosts.find((m) => `${m.year}-${m.month}` === selectedMonth);
  };

  const selectedMonthData = getSelectedMonthData();

  return (
    <div className="flex-1 max-w-full p-2">
      {/* 헤더 박스 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* 아이콘 + 제목 */}
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">비용 관리 시스템</h1>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setActiveTab("management")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "management"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Calculator className="w-5 h-5" />
            비용 관리
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Settings className="w-5 h-5" />
            비용 수정
          </button>
        </div>
      </div>

      {/* 비용 관리 탭 */}
      {activeTab === "management" && (
        <>
          {/* 심사원 검색 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                심사원 검색
              </label>

              <Select
                options={reviewerOptions}
                onChange={(option) => setSelectedReviewer(option?.value ?? "")}
                placeholder="검색하여 심사원을 선택하세요…"
                isClearable
                className="text-black"
              />
            </div>
          </div>

          {/* 강사비 입력 섹션 */}
          {selectedReviewer && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 w-24">강사비</h2>
                <div className="flex items-center gap-4 w-full">
                  <label className="text-sm text-gray-600 w-16">금액</label>
                  <input
                    type="number"
                    value={studyCostInput}
                    onChange={(e) => setStudyCostInput(Number(e.target.value))}
                    className="w-40 border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                  <span className="text-xl font-bold text-indigo-600 ml-auto">
                    {studyCostInput.toLocaleString()} 원
                  </span>
                  <button
                    onClick={saveStudyCost}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 월별 비용 표시 */}
          {selectedReviewer && monthlyCosts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">월별 비용</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    조회 월:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-black"
                  >
                    {monthlyCosts.map((m) => (
                      <option
                        key={`${m.year}-${m.month}`}
                        value={`${m.year}-${m.month}`}
                      >
                        {m.year}년 {m.month}월
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-6 py-3 text-left font-semibold text-gray-700">
                        카테고리
                      </th>
                      <th className="border px-6 py-3 text-right font-semibold text-gray-700">
                        총 비용
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        수수료
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-blue-600">
                        {(selectedMonthData?.chargeCost || 0).toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        영업비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-green-600">
                        {(selectedMonthData?.inviteCost || 0).toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        추천비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-purple-600">
                        {(
                          selectedMonthData?.referralCost || 0
                        ).toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        심사비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-orange-600">
                        {(selectedMonthData?.reviewCost || 0).toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        강사비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-indigo-600">
                        {(selectedMonthData?.studyCost || 0).toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-bold">
                      <td className="border px-6 py-4 text-gray-900">총합</td>
                      <td className="border px-6 py-4 text-right text-xl text-gray-900">
                        {(selectedMonthData?.totalCost || 0).toLocaleString()}{" "}
                        원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 전체 기간 총 비용 요약 */}
          {selectedReviewer && costsData && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                전체 기간 총 비용
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-6 py-3 text-left font-semibold text-gray-700">
                        카테고리
                      </th>
                      <th className="border px-6 py-3 text-right font-semibold text-gray-700">
                        총 비용
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        수수료
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-blue-600">
                        {(costsData.chargeCost || 0).toLocaleString()} 원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        영업비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-green-600">
                        {(costsData.inviteCost || 0).toLocaleString()} 원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        추천비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-purple-600">
                        {(costsData.referralCost || 0).toLocaleString()} 원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        심사비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-orange-600">
                        {(costsData.reviewCost || 0).toLocaleString()} 원
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border px-6 py-4 font-medium text-gray-800">
                        강사비
                      </td>
                      <td className="border px-6 py-4 text-right text-lg font-bold text-indigo-600">
                        {(costsData.studyCost || 0).toLocaleString()} 원
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-bold">
                      <td className="border px-6 py-4 text-gray-900">총합</td>
                      <td className="border px-6 py-4 text-right text-xl text-gray-900">
                        {(costsData.totalCost || 0).toLocaleString()} 원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 비용 수정 탭 */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* 기업 인증 비용 수정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                기업 인증 비용 수정
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  등급 선택
                </label>
                <select
                  value={selectedCertConfig?.configId || ""}
                  onChange={(e) => {
                    const config = certificationConfigs.find(
                      (c) => c.configId === Number(e.target.value)
                    );
                    setSelectedCertConfig(config || null);
                    setCertValue(config?.value || 0);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                >
                  <option value="">등급을 선택하세요</option>
                  {Array.isArray(certificationConfigs) &&
                  certificationConfigs.length > 0 ? (
                    certificationConfigs.map((config) => (
                      <option key={config.configId} value={config.configId}>
                        {config.gradeName} (현재:{" "}
                        {config.value.toLocaleString()}원)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      데이터 없음
                    </option>
                  )}
                </select>
                {certificationConfigs.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    설정 데이터를 불러오지 못했습니다. 콘솔을 확인하세요.
                  </p>
                )}
              </div>

              {selectedCertConfig && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새로운 비용
                    </label>
                    <input
                      type="number"
                      value={certValue}
                      onChange={(e) => setCertValue(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <span className="text-lg font-bold text-blue-600">
                      {certValue.toLocaleString()} 원
                    </span>
                    <button
                      onClick={saveCertificationCost}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 심사비 수정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                심사원 등급별 심사비 수정
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  심사원 등급 선택
                </label>
                <select
                  value={selectedReviewFeeConfig?.configId || ""}
                  onChange={(e) => {
                    const config = reviewFeeConfigs.find(
                      (c) => c.configId === Number(e.target.value)
                    );
                    setSelectedReviewFeeConfig(config || null);
                    setReviewFeeValue(config?.value || 0);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                >
                  <option value="">등급을 선택하세요</option>
                  {Array.isArray(reviewFeeConfigs) &&
                  reviewFeeConfigs.length > 0 ? (
                    reviewFeeConfigs.map((config) => (
                      <option key={config.configId} value={config.configId}>
                        {config.gradeName} (현재:{" "}
                        {config.value.toLocaleString()}원)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      데이터 없음
                    </option>
                  )}
                </select>
                {reviewFeeConfigs.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    설정 데이터를 불러오지 못했습니다. 콘솔을 확인하세요.
                  </p>
                )}
              </div>

              {selectedReviewFeeConfig && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새로운 심사비
                    </label>
                    <input
                      type="number"
                      value={reviewFeeValue}
                      onChange={(e) =>
                        setReviewFeeValue(Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <span className="text-lg font-bold text-orange-600">
                      {reviewFeeValue.toLocaleString()} 원
                    </span>
                    <button
                      onClick={saveReviewFeeCost}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 수수료 비율 수정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                수수료 비율 수정
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  등급 선택 (리더/일반)
                </label>
                <select
                  value={selectedCommissionConfig?.configId || ""}
                  onChange={(e) => {
                    const config = commissionConfigs.find(
                      (c) => c.configId === Number(e.target.value)
                    );
                    setSelectedCommissionConfig(config || null);
                    setCommissionValue(config?.value || 0);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
                >
                  <option value="">등급을 선택하세요</option>
                  {Array.isArray(commissionConfigs) &&
                  commissionConfigs.length > 0 ? (
                    commissionConfigs.map((config) => (
                      <option key={config.configId} value={config.configId}>
                        {config.gradeName} (현재: {config.value}%)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      데이터 없음
                    </option>
                  )}
                </select>
                {commissionConfigs.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    설정 데이터를 불러오지 못했습니다. 콘솔을 확인하세요.
                  </p>
                )}
              </div>

              {selectedCommissionConfig && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      새로운 비율 (%)
                    </label>
                    <input
                      type="number"
                      value={commissionValue}
                      onChange={(e) =>
                        setCommissionValue(Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <span className="text-lg font-bold text-green-600">
                      {commissionValue}%
                    </span>
                    <button
                      onClick={saveCommissionRate}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 추천비 수정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">추천비 수정</h2>
            </div>

            <div className="space-y-4">
              {referralCostConfig ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      현재 추천비:{" "}
                      <span className="font-bold text-purple-600">
                        {referralCostConfig.value.toLocaleString()}원
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      * 회원가입 시 추천인에게 지급되는 금액입니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        새로운 추천비
                      </label>
                      <input
                        type="number"
                        value={referralCostValue}
                        onChange={(e) =>
                          setReferralCostValue(Number(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <span className="text-lg font-bold text-purple-600">
                        {referralCostValue.toLocaleString()} 원
                      </span>
                      <button
                        onClick={saveReferralCost}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-600">
                  추천비 설정 데이터를 불러오지 못했습니다. 콘솔을 확인하세요.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

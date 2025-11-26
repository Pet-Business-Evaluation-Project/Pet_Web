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

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const BASE_URL = "https://www.kcci.co.kr/back";

const fetchWithAuth = async (url: string, options: FetchOptions = {}) => {
  const token = localStorage.getItem("accessToken");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};

export default function CostCalculator() {
  const [reviewerList, setReviewerList] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<number | "">("");

  const [leaderType, setLeaderType] = useState<"리더" | "일반">("일반");
  const [chargeGrade, setChargeGrade] = useState<number | "">("");
  const [inviteGrade, setInviteGrade] = useState<number | "">("");
  const [newSubReviewerCount, setNewSubReviewerCount] = useState<number>(0);
  const [reviewerRank, setReviewerRank] = useState<
    "심사원보" | "심사위원" | "수석심사위원" | ""
  >("");
  const [studyCostInput, setStudyCostInput] = useState<number>(0);

  const gradeCostMap = [2000000, 2500000, 3500000, 10000000, 20000000];

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

  // 🔹 각각의 비용 계산 함수
  const calcChargeCost = () => {
    if (selectedReviewer && chargeGrade !== "") {
      const base = gradeCostMap[Number(chargeGrade) - 1];
      const factor = leaderType === "리더" ? 0.1 : 0.05;
      return base * factor * 0.2;
    }
    return 0;
  };

  const calcInviteCost = () => {
    if (inviteGrade !== "") return gradeCostMap[Number(inviteGrade) - 1] * 0.2;
    return 0;
  };

  const calcReferralCost = () => newSubReviewerCount * 100000;

  const calcReviewCost = () => {
    if (reviewerRank === "심사원보") return 300000;
    if (reviewerRank === "심사위원") return 400000;
    if (reviewerRank === "수석심사위원") return 500000;
    return 0;
  };

  const calcStudyCost = () => studyCostInput;

  // 🔹 비용 POST 저장
  const saveCost = async (type: string, cost: number) => {
    if (!selectedReviewer) return alert("심사원을 선택하세요");

    try {
      const res = await fetchWithAuth(`${BASE_URL}/costs/${type}`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedReviewer, cost }),
      });
      if (!res.ok) return alert("저장 실패");
      alert("저장 완료");
    } catch {
      alert("오류 발생");
    }
  };

  // 🔹 타입 변경 핸들러
  const handleLeaderTypeChange = (value: string) => {
    setLeaderType(value as "리더" | "일반");
  };

  const handleReviewerRankChange = (value: string) => {
    setReviewerRank(value as "심사원보" | "심사위원" | "수석심사위원" | "");
  };

  // 🔹 react-select 옵션 변환
  const reviewerOptions = reviewerList.map((r) => ({
    value: r.user_id,
    label: `${r.name} (${r.loginID})`,
  }));

  // 🔹 비용 항목 UI 구성
  const costSections = [
    {
      title: "수수료",
      icon: <DollarSign className="w-5 h-5" />,
      color: "blue",
      content: (
        <div className="flex items-center gap-4 w-full">
          <select
            value={leaderType}
            onChange={(e) => handleLeaderTypeChange(e.target.value)}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="리더">리더</option>
            <option value="일반">일반</option>
          </select>

          <select
            value={chargeGrade}
            onChange={(e) =>
              setChargeGrade(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-32 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">단계 선택</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}단계
              </option>
            ))}
          </select>

          <span className="text-xl font-bold text-blue-600 ml-auto">
            {calcChargeCost().toLocaleString()} 원
          </span>

          <button
            onClick={() => saveCost("charge", calcChargeCost())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            저장
          </button>
        </div>
      ),
    },
    {
      title: "영업비",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "green",
      content: (
        <div className="flex items-center gap-4 w-full">
          <select
            value={inviteGrade}
            onChange={(e) =>
              setInviteGrade(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-32 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">단계 선택</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}단계
              </option>
            ))}
          </select>

          <span className="text-xl font-bold text-green-600 ml-auto">
            {calcInviteCost().toLocaleString()} 원
          </span>

          <button
            onClick={() => saveCost("invite", calcInviteCost())}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            저장
          </button>
        </div>
      ),
    },
    {
      title: "추천비",
      icon: <Users className="w-5 h-5" />,
      color: "purple",
      content: (
        <div className="flex items-center gap-4 w-full">
          <label className="text-sm text-gray-600 w-32">신규 심사원 수</label>

          <input
            type="number"
            value={newSubReviewerCount}
            onChange={(e) => setNewSubReviewerCount(Number(e.target.value))}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2"
            min="0"
          />

          <span className="text-xl font-bold text-purple-600 ml-auto">
            {calcReferralCost().toLocaleString()} 원
          </span>

          <button
            onClick={() => saveCost("referral", calcReferralCost())}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            저장
          </button>
        </div>
      ),
    },
    {
      title: "심사비",
      icon: <Award className="w-5 h-5" />,
      color: "orange",
      content: (
        <div className="flex items-center gap-4 w-full">
          <select
            value={reviewerRank}
            onChange={(e) => handleReviewerRankChange(e.target.value)}
            className="w-40 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">직급 선택</option>
            <option value="심사원보">심사원보</option>
            <option value="심사위원">심사위원</option>
            <option value="수석심사위원">수석심사위원</option>
          </select>

          <span className="text-xl font-bold text-orange-600 ml-auto">
            {calcReviewCost().toLocaleString()} 원
          </span>

          <button
            onClick={() => saveCost("review", calcReviewCost())}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
          >
            저장
          </button>
        </div>
      ),
    },
    {
      title: "강사비",
      icon: <BookOpen className="w-5 h-5" />,
      color: "indigo",
      content: (
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
            {calcStudyCost().toLocaleString()} 원
          </span>

          <button
            onClick={() => saveCost("study", calcStudyCost())}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
          >
            저장
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 max-w-full p-2">
      {/* 헤더 박스 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* 아이콘 + 제목 */}
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">비용 계산기</h1>
        </div>

        {/* 심사원 검색 */}
        <div className="flex flex-col mt-8 mb-2">
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

      {/* 비용 섹션 */}
      <div className="space-y-4 mb-6">
        {costSections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg bg-${section.color}-100 text-${section.color}-600`}
              >
                {section.icon}
              </div>

              <h2 className="text-xl font-bold text-gray-800 w-24">
                {section.title}
              </h2>

              <div className="flex-1">{section.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

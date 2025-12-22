"use client";

import React, { useState, useEffect } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaCheck,
  FaPlus,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueItem {
  revenueId: number;
  category: string;
  amount: number;
  description: string;
  status: string; // "입금" | "미입금"
  createdAt: string;
  companyName?: string;
  memberId?: number;
  certificationLevel?: number;
  certificationType?: string;
  signId?: number;
}

interface RevenueSummary {
  category: string;
  count: number;
  totalAmount: number;
  receivedAmount: number;
  unreceivedAmount: number;
}

interface RevenueSectionProps {
  lastRefreshTime: Date | null;
}

const BASE_URL = "https://www.kcci.co.kr/back";

export default function RevenueSection({
  lastRefreshTime,
}: RevenueSectionProps) {
  const [revenueData, setRevenueData] = useState<RevenueSummary[]>([]);
  const [revenueDetails, setRevenueDetails] = useState<
    Record<string, RevenueItem[]>
  >({});
  const [activeRevenueTab, setActiveRevenueTab] = useState<
    "all" | "received" | "unreceived"
  >("all");
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>(
    {}
  );

  // 금액 수정 상태
  const [editingRevenueId, setEditingRevenueId] = useState<number | null>(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState<string>("");

  // 수익 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRevenueCategory, setNewRevenueCategory] = useState<
    "수강료" | "기타"
  >("수강료");
  const [newRevenueAmount, setNewRevenueAmount] = useState<number>(0);
  const [newRevenueDescription, setNewRevenueDescription] =
    useState<string>("");

  // 수익 상태 업데이트 중
  const [updatingRevenueStatus, setUpdatingRevenueStatus] = useState<
    Record<number, boolean>
  >({});

  // 초기 데이터 로드
  useEffect(() => {
    fetchRevenueSummary();
  }, [lastRefreshTime]);

  /**
   * 카테고리별 요약 데이터 가져오기
   */
  const fetchRevenueSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/revenues/summary`, {
        credentials: "include",
      });

      if (response.ok) {
        const data: RevenueSummary[] = await response.json();
        setRevenueData(data);
      } else {
        console.error("Revenue 요약 조회 실패");
      }
    } catch (error) {
      console.error("Revenue 요약 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 카테고리별 상세 데이터 가져오기
   */
  const fetchRevenueDetails = async (category: string) => {
    if (detailsLoading[category]) return;

    try {
      setDetailsLoading({ ...detailsLoading, [category]: true });

      // 현재 월 필터링
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const response = await fetch(
        `${BASE_URL}/revenues/${currentYear}/${currentMonth}?category=${encodeURIComponent(
          category
        )}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data: RevenueItem[] = await response.json();
        setRevenueDetails({ ...revenueDetails, [category]: data });
      }
    } catch (error) {
      console.error(`Revenue 상세 조회 실패 (${category}):`, error);
    } finally {
      setDetailsLoading({ ...detailsLoading, [category]: false });
    }
  };

  /**
   * 카테고리 클릭 핸들러
   */
  const handleCategoryClick = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
      if (!revenueDetails[category]) {
        fetchRevenueDetails(category);
      }
    }
  };

  /**
   * 금액 수정 시작
   */
  const handleStartEditRevenue = (id: number, currentAmount: number) => {
    setEditingRevenueId(id);
    setEditingRevenueValue(currentAmount.toString());
  };

  /**
   * 금액 수정 취소
   */
  const handleCancelEditRevenue = () => {
    setEditingRevenueId(null);
    setEditingRevenueValue("");
  };

  /**
   * 금액 수정 저장
   */
  const handleSaveRevenue = async (revenueId: number, category: string) => {
    const newAmount = parseInt(editingRevenueValue);

    if (isNaN(newAmount) || newAmount < 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/revenues/${revenueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: newAmount }),
      });

      if (response.ok) {
        alert("금액이 수정되었습니다.");
        setEditingRevenueId(null);
        setEditingRevenueValue("");

        // 데이터 새로고침
        await fetchRevenueDetails(category);
        await fetchRevenueSummary();
      } else {
        throw new Error("수정 실패");
      }
    } catch (error) {
      console.error("금액 수정 실패:", error);
      alert("금액 수정에 실패했습니다.");
    }
  };

  /**
   * 입금 상태 변경
   */
  const handleRevenueStatusChange = async (
    revenueId: number,
    newStatus: "입금" | "미입금",
    category: string
  ) => {
    if (updatingRevenueStatus[revenueId]) {
      console.warn("이미 처리 중인 요청입니다.");
      return;
    }

    setUpdatingRevenueStatus({ ...updatingRevenueStatus, [revenueId]: true });

    try {
      const response = await fetch(`${BASE_URL}/revenues/${revenueId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("상태 변경 실패");
      }

      // 데이터 새로고침
      await fetchRevenueDetails(category);
      await fetchRevenueSummary();
    } catch (error) {
      console.error("입금 상태 변경 실패:", error);
      alert("입금 상태 변경에 실패했습니다.");
    } finally {
      setUpdatingRevenueStatus((prev) => {
        const newState = { ...prev };
        delete newState[revenueId];
        return newState;
      });
    }
  };

  /**
   * 수익 삭제
   */
  const handleDeleteRevenue = async (revenueId: number, category: string) => {
    if (!confirm("이 수익 항목을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/revenues/${revenueId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok || response.status === 204) {
        alert("삭제되었습니다.");
        await fetchRevenueDetails(category);
        await fetchRevenueSummary();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /**
   * 수익 추가
   */
  const handleAddRevenue = async () => {
    if (newRevenueCategory === "기타" && !newRevenueDescription.trim()) {
      alert("기타 수익은 설명이 필수입니다.");
      return;
    }

    if (newRevenueAmount <= 0) {
      alert("금액은 0보다 커야 합니다.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/revenues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: newRevenueCategory,
          amount: newRevenueAmount,
          description: newRevenueDescription || null,
        }),
      });

      if (response.ok) {
        alert("수익이 추가되었습니다.");
        setShowAddModal(false);
        setNewRevenueCategory("수강료");
        setNewRevenueAmount(0);
        setNewRevenueDescription("");

        await fetchRevenueSummary();
      } else {
        throw new Error("추가 실패");
      }
    } catch (error) {
      console.error("수익 추가 실패:", error);
      alert("수익 추가에 실패했습니다.");
    }
  };

  /**
   * 차트 데이터 생성
   */
  const getChartData = () => {
    return revenueData.map((item) => ({
      name: item.category,
      입금: item.receivedAmount,
      미입금: item.unreceivedAmount,
    }));
  };

  /**
   * 탭 필터링
   */
  const getFilteredRevenueData = () => {
    if (activeRevenueTab === "received") {
      return revenueData.filter((item) => item.receivedAmount > 0);
    } else if (activeRevenueTab === "unreceived") {
      return revenueData.filter((item) => item.unreceivedAmount > 0);
    }
    return revenueData;
  };

  /**
   * 총 통계 계산
   */
  const getTotalStats = () => {
    const totalRevenue = revenueData.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalReceived = revenueData.reduce(
      (sum, item) => sum + item.receivedAmount,
      0
    );
    const totalUnreceived = revenueData.reduce(
      (sum, item) => sum + item.unreceivedAmount,
      0
    );

    return { totalRevenue, totalReceived, totalUnreceived };
  };

  const filteredRevenueData = getFilteredRevenueData();
  const chartData = getChartData();
  const { totalRevenue, totalReceived, totalUnreceived } = getTotalStats();

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-green-500 rounded"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">수익 현황</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              * 현재 월({new Date().getMonth() + 1}월) 수익만 표시됩니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {lastRefreshTime && (
            <div className="text-xs text-gray-500">
              마지막 업데이트: {lastRefreshTime.toLocaleTimeString("ko-KR")}
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaPlus className="inline" />
            수익 추가
          </button>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">총 수익: </span>
              <span className="font-bold text-gray-900">
                {totalRevenue.toLocaleString()}원
              </span>
            </div>
            <div>
              <span className="text-green-600">입금: </span>
              <span className="font-bold text-green-700">
                {totalReceived.toLocaleString()}원
              </span>
            </div>
            <div>
              <span className="text-orange-600">미입금: </span>
              <span className="font-bold text-orange-700">
                {totalUnreceived.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveRevenueTab("all")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeRevenueTab === "all"
              ? "bg-green-500 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setActiveRevenueTab("received")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeRevenueTab === "received"
              ? "bg-green-500 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          입금
        </button>
        <button
          onClick={() => setActiveRevenueTab("unreceived")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeRevenueTab === "unreceived"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          미입금
        </button>
      </div>

      {/* 차트 */}
      <div className="bg-white rounded-lg p-6 mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-gray-400">데이터를 불러오는 중...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()}원`}
              />
              <Legend />
              <Bar
                dataKey="입금"
                stackId="a"
                fill="#10B981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="미입금"
                stackId="a"
                fill="#F97316"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  카테고리
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                  총 금액
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                  입금
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                  미입금
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">
                  상세
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredRevenueData.map((item) => (
                    <React.Fragment key={item.category}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-800">
                          {item.category}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">
                          {item.totalAmount.toLocaleString()}원
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-green-700 font-semibold">
                            {item.receivedAmount.toLocaleString()}원
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-orange-700 font-semibold">
                            {item.unreceivedAmount.toLocaleString()}원
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleCategoryClick(item.category)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedCategory === item.category ? (
                              <FaChevronUp className="inline" />
                            ) : (
                              <FaChevronDown className="inline" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* 확장된 상세 정보 */}
                      {expandedCategory === item.category && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 p-4">
                            {detailsLoading[item.category] ? (
                              <div className="text-center py-4 text-gray-400">
                                로딩 중...
                              </div>
                            ) : revenueDetails[item.category]?.length > 0 ? (
                              <div className="max-h-96 overflow-y-auto">
                                {item.category === "기업인증" ? (
                                  // 기업인증: 기업명, 인증유형, 등급 표시
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                          기업명
                                        </th>
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                          인증 유형
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          등급
                                        </th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                          금액
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          생성일
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          입금 상태
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          삭제
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {revenueDetails[item.category].map(
                                        (detail) => (
                                          <tr
                                            key={detail.revenueId}
                                            className="border-b border-gray-200 hover:bg-gray-100"
                                          >
                                            <td className="py-2 px-4 text-sm font-medium text-gray-900">
                                              {detail.companyName || "-"}
                                            </td>
                                            <td className="py-2 px-4 text-sm">
                                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                {detail.certificationType ||
                                                  "미정"}
                                              </span>
                                            </td>
                                            <td className="py-2 px-4 text-sm text-center">
                                              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                                                {detail.certificationLevel}단계
                                              </span>
                                            </td>
                                            <td className="py-2 px-4 text-sm text-right">
                                              {editingRevenueId ===
                                              detail.revenueId ? (
                                                <div className="flex items-center justify-end gap-2">
                                                  <input
                                                    type="number"
                                                    value={editingRevenueValue}
                                                    onChange={(e) =>
                                                      setEditingRevenueValue(
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-28 px-2 py-1 border border-green-400 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    autoFocus
                                                  />
                                                  <button
                                                    onClick={() =>
                                                      handleSaveRevenue(
                                                        detail.revenueId,
                                                        item.category
                                                      )
                                                    }
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="저장"
                                                  >
                                                    <FaCheck className="inline" />
                                                  </button>
                                                  <button
                                                    onClick={
                                                      handleCancelEditRevenue
                                                    }
                                                    className="text-gray-600 hover:text-gray-800 p-1"
                                                    title="취소"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ) : (
                                                <span
                                                  onClick={() =>
                                                    handleStartEditRevenue(
                                                      detail.revenueId,
                                                      detail.amount
                                                    )
                                                  }
                                                  className="cursor-pointer hover:text-green-600 hover:underline font-semibold"
                                                  title="클릭하여 수정"
                                                >
                                                  {detail.amount.toLocaleString()}
                                                  원
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-4 text-sm text-center">
                                              {new Date(
                                                detail.createdAt
                                              ).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    detail.status === "입금"
                                                  }
                                                  onChange={(e) =>
                                                    handleRevenueStatusChange(
                                                      detail.revenueId,
                                                      e.target.checked
                                                        ? "입금"
                                                        : "미입금",
                                                      item.category
                                                    )
                                                  }
                                                  disabled={
                                                    updatingRevenueStatus[
                                                      detail.revenueId
                                                    ]
                                                  }
                                                  className="sr-only peer"
                                                />
                                                <div
                                                  className={`relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${
                                                    updatingRevenueStatus[
                                                      detail.revenueId
                                                    ]
                                                      ? "opacity-50 cursor-not-allowed"
                                                      : ""
                                                  }`}
                                                ></div>
                                                <span className="ml-3 text-sm font-medium text-gray-700">
                                                  {detail.status}
                                                </span>
                                              </label>
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              <button
                                                onClick={() =>
                                                  handleDeleteRevenue(
                                                    detail.revenueId,
                                                    item.category
                                                  )
                                                }
                                                className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                title="삭제"
                                              >
                                                <FaTrash className="inline" />
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                ) : (
                                  // 수강료/기타: 설명만 표시
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                          설명
                                        </th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                          금액
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          생성일
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          입금 상태
                                        </th>
                                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                          삭제
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {revenueDetails[item.category].map(
                                        (detail) => (
                                          <tr
                                            key={detail.revenueId}
                                            className="border-b border-gray-200 hover:bg-gray-100"
                                          >
                                            <td className="py-2 px-4 text-sm">
                                              {detail.description || "-"}
                                            </td>
                                            <td className="py-2 px-4 text-sm text-right">
                                              {editingRevenueId ===
                                              detail.revenueId ? (
                                                <div className="flex items-center justify-end gap-2">
                                                  <input
                                                    type="number"
                                                    value={editingRevenueValue}
                                                    onChange={(e) =>
                                                      setEditingRevenueValue(
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-28 px-2 py-1 border border-green-400 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    autoFocus
                                                  />
                                                  <button
                                                    onClick={() =>
                                                      handleSaveRevenue(
                                                        detail.revenueId,
                                                        item.category
                                                      )
                                                    }
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="저장"
                                                  >
                                                    <FaCheck className="inline" />
                                                  </button>
                                                  <button
                                                    onClick={
                                                      handleCancelEditRevenue
                                                    }
                                                    className="text-gray-600 hover:text-gray-800 p-1"
                                                    title="취소"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ) : (
                                                <span
                                                  onClick={() =>
                                                    handleStartEditRevenue(
                                                      detail.revenueId,
                                                      detail.amount
                                                    )
                                                  }
                                                  className="cursor-pointer hover:text-green-600 hover:underline font-semibold"
                                                  title="클릭하여 수정"
                                                >
                                                  {detail.amount.toLocaleString()}
                                                  원
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-4 text-sm text-center">
                                              {new Date(
                                                detail.createdAt
                                              ).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    detail.status === "입금"
                                                  }
                                                  onChange={(e) =>
                                                    handleRevenueStatusChange(
                                                      detail.revenueId,
                                                      e.target.checked
                                                        ? "입금"
                                                        : "미입금",
                                                      item.category
                                                    )
                                                  }
                                                  disabled={
                                                    updatingRevenueStatus[
                                                      detail.revenueId
                                                    ]
                                                  }
                                                  className="sr-only peer"
                                                />
                                                <div
                                                  className={`relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${
                                                    updatingRevenueStatus[
                                                      detail.revenueId
                                                    ]
                                                      ? "opacity-50 cursor-not-allowed"
                                                      : ""
                                                  }`}
                                                ></div>
                                                <span className="ml-3 text-sm font-medium text-gray-700">
                                                  {detail.status}
                                                </span>
                                              </label>
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              <button
                                                onClick={() =>
                                                  handleDeleteRevenue(
                                                    detail.revenueId,
                                                    item.category
                                                  )
                                                }
                                                className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                title="삭제"
                                              >
                                                <FaTrash className="inline" />
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400">
                                데이터가 없습니다.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-900">합계</td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 text-lg">
                      {totalRevenue.toLocaleString()}원
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-green-700 text-lg">
                      {totalReceived.toLocaleString()}원
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-orange-700 text-lg">
                      {totalUnreceived.toLocaleString()}원
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 수익 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">수익 추가</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewRevenueCategory("수강료");
                  setNewRevenueAmount(0);
                  setNewRevenueDescription("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={newRevenueCategory}
                  onChange={(e) =>
                    setNewRevenueCategory(e.target.value as "수강료" | "기타")
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="수강료">수강료</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  금액
                </label>
                <input
                  type="number"
                  value={newRevenueAmount}
                  onChange={(e) => setNewRevenueAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  min="0"
                />
              </div>

              {newRevenueCategory === "기타" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (필수)
                  </label>
                  <textarea
                    value={newRevenueDescription}
                    onChange={(e) => setNewRevenueDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                  />
                </div>
              )}

              {newRevenueCategory === "수강료" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (선택)
                  </label>
                  <textarea
                    value={newRevenueDescription}
                    onChange={(e) => setNewRevenueDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                    placeholder="예: 1월 심사원 교육 수강료"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddRevenue}
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRevenueCategory("수강료");
                    setNewRevenueAmount(0);
                    setNewRevenueDescription("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaCheck,
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
  id: number;
  category: "기업인증" | "수강료" | "기타";
  amount: number;
  description: string;
  status: "입금" | "미입금";
  createdAt: string;
  companyName?: string; // 기업인증의 경우
  certificationLevel?: number; // 기업인증 단계 (1~5)
}

interface RevenueSummary {
  name: string;
  value: number;
  status: "입금" | "미입금";
  category: string;
  receivedAmount: number;
  unreceived클Amount: number;
}

interface RevenueSectionProps {
  lastRefreshTime: Date | null;
}

export default function RevenueSection({
  lastRefreshTime,
}: RevenueSectionProps) {
  const [revenueData, setRevenueData] = useState<RevenueSummary[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [revenueDetails, setRevenueDetails] = useState<
    Record<string, RevenueItem[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "received" | "unreceived">(
    "all"
  );

  // 수익 추가 폼 상태
  const [newRevenue, setNewRevenue] = useState({
    category: "수강료" as "수강료" | "기타",
    amount: "",
    description: "",
  });

  // 금액 수정 상태
  const [editingRevenueId, setEditingRevenueId] = useState<number | null>(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState<string>("");

  useEffect(() => {
    fetchRevenueStatistics();
  }, []);

  const fetchRevenueStatistics = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://petback.hysu.kr/back/revenues", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        processRevenueData(data);
      }
    } catch (error) {
      console.error("Failed to fetch revenue statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (revenues: RevenueItem[]) => {
    // 현재 월 필터링
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const filteredRevenues = revenues.filter((revenue) => {
      const revenueDate = new Date(revenue.createdAt);
      return (
        revenueDate.getFullYear() === currentYear &&
        revenueDate.getMonth() + 1 === currentMonth
      );
    });

    // 카테고리별 집계
    const categories = ["기업인증", "수강료", "기타"];
    const summary: RevenueSummary[] = categories.map((category) => {
      const categoryRevenues = filteredRevenues.filter(
        (r) => r.category === category
      );

      let receivedAmount = 0;
      let unreceivedAmount = 0;

      categoryRevenues.forEach((revenue) => {
        if (revenue.status === "입금") {
          receivedAmount += revenue.amount;
        } else {
          unreceivedAmount += revenue.amount;
        }
      });

      return {
        name: category,
        value: receivedAmount + unreceivedAmount,
        status: unreceivedAmount > 0 ? "미입금" : "입금",
        category,
        receivedAmount,
        unreceivedAmount,
      };
    });

    setRevenueData(summary);
  };

  const fetchRevenueDetails = async (category: string) => {
    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/revenues?category=${category}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();

        // 현재 월 필터링
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        const filtered = data.filter((revenue: RevenueItem) => {
          const revenueDate = new Date(revenue.createdAt);
          return (
            revenueDate.getFullYear() === currentYear &&
            revenueDate.getMonth() + 1 === currentMonth
          );
        });

        setRevenueDetails({ ...revenueDetails, [category]: filtered });
      }
    } catch (error) {
      console.error(`Failed to fetch ${category} details:`, error);
    }
  };

  const handleItemClick = (category: string) => {
    if (expandedItem === category) {
      setExpandedItem(null);
    } else {
      setExpandedItem(category);
      if (!revenueDetails[category]) {
        fetchRevenueDetails(category);
      }
    }
  };

  const handleAddRevenue = async () => {
    if (!newRevenue.amount || parseFloat(newRevenue.amount) <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    if (newRevenue.category === "기타" && !newRevenue.description) {
      alert("기타 항목은 내용을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("http://petback.hysu.kr/back/revenues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: newRevenue.category,
          amount: parseFloat(newRevenue.amount),
          description: newRevenue.description,
          status: "미입금",
        }),
      });

      if (response.ok) {
        alert("수익이 추가되었습니다.");
        setShowAddModal(false);
        setNewRevenue({ category: "수강료", amount: "", description: "" });
        await fetchRevenueStatistics();
        if (expandedItem) {
          await fetchRevenueDetails(expandedItem);
        }
      } else {
        throw new Error("추가 실패");
      }
    } catch (error) {
      console.error("Failed to add revenue:", error);
      alert("수익 추가에 실패했습니다.");
    }
  };

  const handleStatusChange = async (
    id: number,
    newStatus: "입금" | "미입금"
  ) => {
    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/revenues/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await fetchRevenueStatistics();
        if (expandedItem) {
          await fetchRevenueDetails(expandedItem);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleStartEditRevenue = (id: number, currentAmount: number) => {
    setEditingRevenueId(id);
    setEditingRevenueValue(currentAmount.toString());
  };

  const handleCancelEditRevenue = () => {
    setEditingRevenueId(null);
    setEditingRevenueValue("");
  };

  const handleSaveRevenue = async (id: number) => {
    const newAmount = parseInt(editingRevenueValue);

    if (isNaN(newAmount) || newAmount < 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/revenues/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount: newAmount }),
        }
      );

      if (response.ok) {
        alert("금액이 수정되었습니다.");
        setEditingRevenueId(null);
        setEditingRevenueValue("");
        await fetchRevenueStatistics();
        if (expandedItem) {
          await fetchRevenueDetails(expandedItem);
        }
      } else {
        throw new Error("수정 실패");
      }
    } catch (error) {
      console.error("Failed to edit revenue:", error);
      alert("금액 수정에 실패했습니다.");
    }
  };

  const handleDeleteRevenue = async (id: number, description: string) => {
    if (!confirm(`"${description}" 항목을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(
        `http://petback.hysu.kr/back/revenues/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok || response.status === 204) {
        alert("삭제되었습니다.");
        await fetchRevenueStatistics();
        if (expandedItem) {
          await fetchRevenueDetails(expandedItem);
        }
      }
    } catch (error) {
      console.error("Failed to delete revenue:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const getFilteredRevenueData = () => {
    if (activeTab === "received") {
      return revenueData.filter((item) => item.receivedAmount > 0);
    } else if (activeTab === "unreceived") {
      return revenueData.filter((item) => item.unreceivedAmount > 0);
    }
    return revenueData;
  };

  const getTotalStats = () => {
    const totalReceived = revenueData.reduce(
      (sum, item) => sum + item.receivedAmount,
      0
    );
    const totalUnreceived = revenueData.reduce(
      (sum, item) => sum + item.unreceivedAmount,
      0
    );
    const total = totalReceived + totalUnreceived;
    return { totalReceived, totalUnreceived, total };
  };

  const getChartData = () => {
    return revenueData.map((item) => ({
      name: item.name,
      입금: item.receivedAmount,
      미입금: item.unreceivedAmount,
    }));
  };

  const filteredRevenueData = getFilteredRevenueData();
  const { totalReceived, totalUnreceived, total } = getTotalStats();
  const chartData = getChartData();

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-8">
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

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">총 수익: </span>
              <span className="font-bold text-gray-900">
                {total.toLocaleString()}원
              </span>
            </div>
            <div>
              <span className="text-green-600">입금 완료: </span>
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

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 shadow-md transition-all"
          >
            <FaPlus />
            수익 추가
          </button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === "all"
              ? "bg-green-500 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setActiveTab("received")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === "received"
              ? "bg-green-500 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          입금
        </button>
        <button
          onClick={() => setActiveTab("unreceived")}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === "unreceived"
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
                fill="#F59E0B"
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
                  항목
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                  총 금액
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">
                  입금 완료
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
                  {filteredRevenueData.map((item, index) => (
                    <React.Fragment key={`${item.category}-${index}`}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-800">
                          {item.name}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">
                          {item.value.toLocaleString()}원
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
                            onClick={() => handleItemClick(item.category)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedItem === item.category ? (
                              <FaChevronUp className="inline" />
                            ) : (
                              <FaChevronDown className="inline" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* 상세 내역 */}
                      {expandedItem === item.category && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 p-4">
                            <div className="max-h-96 overflow-y-auto">
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
                                  {revenueDetails[item.category]?.map(
                                    (detail) => (
                                      <tr
                                        key={detail.id}
                                        className="border-b border-gray-200 hover:bg-gray-100"
                                      >
                                        <td className="py-2 px-4 text-sm">
                                          {detail.description}
                                          {detail.category === "기업인증" &&
                                            detail.companyName && (
                                              <span className="text-gray-500 ml-2">
                                                ({detail.companyName} -{" "}
                                                {detail.certificationLevel}단계)
                                              </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 text-sm text-right">
                                          {editingRevenueId === detail.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                              <input
                                                type="number"
                                                value={editingRevenueValue}
                                                onChange={(e) =>
                                                  setEditingRevenueValue(
                                                    e.target.value
                                                  )
                                                }
                                                className="w-28 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() =>
                                                  handleSaveRevenue(detail.id)
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
                                                  detail.id,
                                                  detail.amount
                                                )
                                              }
                                              className="cursor-pointer hover:text-blue-600 hover:underline"
                                              title="클릭하여 수정"
                                            >
                                              {detail.amount.toLocaleString()}원
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
                                              checked={detail.status === "입금"}
                                              onChange={(e) =>
                                                handleStatusChange(
                                                  detail.id,
                                                  e.target.checked
                                                    ? "입금"
                                                    : "미입금"
                                                )
                                              }
                                              className="sr-only peer"
                                            />
                                            <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                              {detail.status}
                                            </span>
                                          </label>
                                        </td>
                                        <td className="py-2 px-4 text-center">
                                          <button
                                            onClick={() =>
                                              handleDeleteRevenue(
                                                detail.id,
                                                detail.description
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-900">합계</td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 text-lg">
                      {total.toLocaleString()}원
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
            <h3 className="text-xl font-bold mb-4">수익 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={newRevenue.category}
                  onChange={(e) =>
                    setNewRevenue({
                      ...newRevenue,
                      category: e.target.value as "수강료" | "기타",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  value={newRevenue.amount}
                  onChange={(e) =>
                    setNewRevenue({ ...newRevenue, amount: e.target.value })
                  }
                  placeholder="금액을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newRevenue.category === "기타"
                    ? "내용 (필수)"
                    : "내용 (선택)"}
                </label>
                <textarea
                  value={newRevenue.description}
                  onChange={(e) =>
                    setNewRevenue({
                      ...newRevenue,
                      description: e.target.value,
                    })
                  }
                  placeholder={
                    newRevenue.category === "기타"
                      ? "내용을 입력하세요"
                      : "선택사항입니다"
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddRevenue}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewRevenue({
                    category: "수강료",
                    amount: "",
                    description: "",
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface CostDetail {
  id: number;
  userId: number;
  userName: string;
  cost: number;
  paymentStatus: "지급" | "미지급";
  createdat: string;
  bankName: string;
  accountNumber: string;
  referredUserId?: number;
  referredUserName?: string;
}

interface CostItemDetail {
  name: string;
  type: string;
  costs: CostDetail[];
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface UserReferralGroup {
  userId: number;
  userName: string;
  bankName: string;
  accountNumber: string;
  referrals: CostDetail[];
  totalCost: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface SettlementDto {
  settlementId: number;
  year: number;
  month: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  chargeCost: number;
  inviteCost: number;
  referralCost: number;
  reviewCost: number;
  studyCost: number;
  settlementStatus: string;
  confirmedBy: string;
  confirmedAt: string;
  createdAt: string;
}

interface SettlementHistoryModalProps {
  show: boolean;
  onClose: () => void;
  settlements: SettlementDto[];
}

export default function SettlementHistoryModal({
  show,
  onClose,
  settlements,
}: SettlementHistoryModalProps) {
  const [expandedSettlement, setExpandedSettlement] = useState<number | null>(
    null
  );
  const [settlementDetails, setSettlementDetails] = useState<
    Record<number, CostItemDetail[]>
  >({});
  const [settlementDetailsLoading, setSettlementDetailsLoading] = useState<
    Record<number, boolean>
  >({});
  const [expandedHistoryCostType, setExpandedHistoryCostType] = useState<
    string | null
  >(null);

  if (!show) return null;

  const fetchSettlementDetails = async (
    year: number,
    month: number,
    settlementId: number
  ) => {
    if (settlementDetailsLoading[settlementId]) return;

    try {
      setSettlementDetailsLoading({
        ...settlementDetailsLoading,
        [settlementId]: true,
      });

      const costTypes = [
        { type: "charge", name: "영업비" },
        { type: "review", name: "심사비" },
        { type: "invite", name: "수수료" },
        { type: "study", name: "강사비" },
      ];

      const costPromises = costTypes.map(async ({ type, name }) => {
        const response = await fetch(
          `https://www.kcci.co.kr/back/costs/${type}/with-status`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          let costs: CostDetail[] = data.costs;

          costs = costs.filter((cost) => {
            const costDate = new Date(cost.createdat);
            return (
              costDate.getFullYear() === year &&
              costDate.getMonth() + 1 === month
            );
          });

          let paidAmount = 0;
          let unpaidAmount = 0;
          costs.forEach((cost) => {
            if (cost.paymentStatus === "지급") {
              paidAmount += cost.cost;
            } else {
              unpaidAmount += cost.cost;
            }
          });

          return {
            name,
            type,
            costs,
            totalAmount: paidAmount + unpaidAmount,
            paidAmount,
            unpaidAmount,
          };
        }
        return null;
      });

      const referralResponse = await fetch(
        "https://www.kcci.co.kr/back/costs/referral/with-status",
        { credentials: "include" }
      );

      let referralData: CostItemDetail | null = null;
      if (referralResponse.ok) {
        const data = await referralResponse.json();
        let allReferrals: CostDetail[] = data.costs;

        allReferrals = allReferrals.filter((referral) => {
          const referralDate = new Date(referral.createdat);
          return (
            referralDate.getFullYear() === year &&
            referralDate.getMonth() + 1 === month
          );
        });

        let paidAmount = 0;
        let unpaidAmount = 0;
        allReferrals.forEach((referral) => {
          if (referral.paymentStatus === "지급") {
            paidAmount += referral.cost;
          } else {
            unpaidAmount += referral.cost;
          }
        });

        referralData = {
          name: "추천비",
          type: "referral",
          costs: allReferrals,
          totalAmount: paidAmount + unpaidAmount,
          paidAmount,
          unpaidAmount,
        };
      }

      const results = await Promise.all(costPromises);
      const validResults = results.filter(
        (r) => r !== null
      ) as CostItemDetail[];

      if (referralData) {
        validResults.push(referralData);
      }

      setSettlementDetails({
        ...settlementDetails,
        [settlementId]: validResults,
      });
    } catch (error) {
      console.error("Failed to fetch settlement details:", error);
    } finally {
      setSettlementDetailsLoading({
        ...settlementDetailsLoading,
        [settlementId]: false,
      });
    }
  };

  const handleSettlementClick = (settlement: SettlementDto) => {
    if (expandedSettlement === settlement.settlementId) {
      setExpandedSettlement(null);
      setExpandedHistoryCostType(null);
    } else {
      setExpandedSettlement(settlement.settlementId);
      setExpandedHistoryCostType(null);
      if (!settlementDetails[settlement.settlementId]) {
        fetchSettlementDetails(
          settlement.year,
          settlement.month,
          settlement.settlementId
        );
      }
    }
  };

  const handleHistoryCostTypeClick = (
    settlementId: number,
    costType: string
  ) => {
    const key = `${settlementId}-${costType}`;
    if (expandedHistoryCostType === key) {
      setExpandedHistoryCostType(null);
    } else {
      setExpandedHistoryCostType(key);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">정산 히스토리</h3>
          <button
            onClick={() => {
              onClose();
              setExpandedSettlement(null);
              setExpandedHistoryCostType(null);
            }}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {settlements.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              정산 내역이 없습니다.
            </p>
          ) : (
            settlements.map((settlement) => (
              <div key={settlement.settlementId}>
                <div
                  onClick={() => handleSettlementClick(settlement)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    settlement.settlementStatus === "확정"
                      ? "border-green-300 bg-green-50 hover:bg-green-100"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {settlement.year}년 {settlement.month}월 -{" "}
                          {settlement.settlementStatus}
                        </p>
                        <button className="text-blue-600 hover:text-blue-800">
                          {expandedSettlement === settlement.settlementId ? (
                            <FaChevronUp className="inline" />
                          ) : (
                            <FaChevronDown className="inline" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        총액: {settlement.totalAmount.toLocaleString()}원 |
                        지급: {settlement.paidAmount.toLocaleString()}원 |
                        미지급: {settlement.unpaidAmount.toLocaleString()}원
                      </p>
                      {settlement.confirmedBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          확정자: {settlement.confirmedBy} |{" "}
                          {new Date(settlement.confirmedAt).toLocaleString(
                            "ko-KR"
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        생성:{" "}
                        {new Date(settlement.createdAt).toLocaleDateString(
                          "ko-KR"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 정산 상세 정보 */}
                {expandedSettlement === settlement.settlementId && (
                  <div className="mt-2 ml-4 p-4 bg-white border border-gray-200 rounded-lg">
                    {settlementDetailsLoading[settlement.settlementId] ? (
                      <div className="text-center py-8 text-gray-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="mt-2">데이터를 불러오는 중...</p>
                      </div>
                    ) : settlementDetails[settlement.settlementId] ? (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 border-b pb-2">
                          📊 {settlement.year}년 {settlement.month}월 비용 상세
                        </h4>

                        {settlementDetails[settlement.settlementId].map(
                          (costItem) => {
                            const costKey = `${settlement.settlementId}-${costItem.type}`;
                            const isExpanded =
                              expandedHistoryCostType === costKey;

                            return (
                              <div
                                key={costItem.type}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                              >
                                {/* 비용 타입 요약 */}
                                <div
                                  onClick={() =>
                                    handleHistoryCostTypeClick(
                                      settlement.settlementId,
                                      costItem.type
                                    )
                                  }
                                  className="flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <button className="text-blue-600">
                                      {isExpanded ? (
                                        <FaChevronUp className="inline" />
                                      ) : (
                                        <FaChevronDown className="inline" />
                                      )}
                                    </button>
                                    <span className="font-medium text-gray-700 w-20">
                                      {costItem.name}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {costItem.costs.length}건
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm">
                                    <div>
                                      <span className="text-gray-600">
                                        총액:{" "}
                                      </span>
                                      <span className="font-semibold text-gray-900">
                                        {costItem.totalAmount.toLocaleString()}
                                        원
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-green-600">
                                        지급:{" "}
                                      </span>
                                      <span className="font-semibold text-green-700">
                                        {costItem.paidAmount.toLocaleString()}원
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-red-600">
                                        미지급:{" "}
                                      </span>
                                      <span className="font-semibold text-red-700">
                                        {costItem.unpaidAmount.toLocaleString()}
                                        원
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 비용 세부 항목 */}
                                {isExpanded && (
                                  <div className="bg-white p-3">
                                    {costItem.type === "referral" ? (
                                      // 추천비는 추천인별로 그룹핑
                                      (() => {
                                        const userMap = new Map<
                                          number,
                                          UserReferralGroup
                                        >();
                                        costItem.costs.forEach(
                                          (cost: CostDetail) => {
                                            if (!userMap.has(cost.userId)) {
                                              userMap.set(cost.userId, {
                                                userId: cost.userId,
                                                userName: cost.userName,
                                                bankName:
                                                  cost.bankName || "미등록",
                                                accountNumber:
                                                  cost.accountNumber ||
                                                  "미등록",
                                                referrals: [],
                                                totalCost: 0,
                                                paidAmount: 0,
                                                unpaidAmount: 0,
                                              });
                                            }
                                            const user = userMap.get(
                                              cost.userId
                                            )!;
                                            user.referrals.push(cost);
                                            user.totalCost += cost.cost;
                                            if (cost.paymentStatus === "지급") {
                                              user.paidAmount += cost.cost;
                                            } else {
                                              user.unpaidAmount += cost.cost;
                                            }
                                          }
                                        );

                                        return (
                                          <div className="space-y-2">
                                            {Array.from(userMap.values()).map(
                                              (user) => (
                                                <div
                                                  key={user.userId}
                                                  className="border-b border-gray-100 pb-2 last:border-0"
                                                >
                                                  <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-3">
                                                      <span className="text-sm font-medium text-gray-700">
                                                        {user.userName} (ID:{" "}
                                                        {user.userId})
                                                      </span>
                                                      <span className="text-xs text-gray-500">
                                                        {user.bankName}
                                                        {user.accountNumber !==
                                                          "미등록" &&
                                                          ` | ${user.accountNumber}`}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs">
                                                      <span className="text-gray-600">
                                                        총{" "}
                                                        {user.totalCost.toLocaleString()}
                                                        원
                                                      </span>
                                                      <span className="text-green-600">
                                                        지급{" "}
                                                        {user.paidAmount.toLocaleString()}
                                                        원
                                                      </span>
                                                      <span className="text-red-600">
                                                        미지급{" "}
                                                        {user.unpaidAmount.toLocaleString()}
                                                        원
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="ml-4 space-y-1">
                                                    {user.referrals.map(
                                                      (
                                                        referral: CostDetail
                                                      ) => (
                                                        <div
                                                          key={referral.id}
                                                          className="flex items-center justify-between text-xs text-gray-600"
                                                        >
                                                          <span>
                                                            →{" "}
                                                            {
                                                              referral.referredUserName
                                                            }{" "}
                                                            (ID:{" "}
                                                            {
                                                              referral.referredUserId
                                                            }
                                                            )
                                                          </span>
                                                          <div className="flex items-center gap-2">
                                                            <span>
                                                              {referral.cost.toLocaleString()}
                                                              원
                                                            </span>
                                                            <span
                                                              className={`px-2 py-0.5 rounded text-xs ${
                                                                referral.paymentStatus ===
                                                                "지급"
                                                                  ? "bg-green-100 text-green-700"
                                                                  : "bg-red-100 text-red-700"
                                                              }`}
                                                            >
                                                              {
                                                                referral.paymentStatus
                                                              }
                                                            </span>
                                                            <span className="text-gray-400">
                                                              {new Date(
                                                                referral.createdat
                                                              ).toLocaleDateString(
                                                                "ko-KR"
                                                              )}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      // 다른 비용 타입은 일반 리스트
                                      <div className="space-y-1">
                                        {costItem.costs.map(
                                          (cost: CostDetail) => (
                                            <div
                                              key={cost.id}
                                              className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded text-sm"
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className="text-gray-700">
                                                  {cost.userName} (ID:{" "}
                                                  {cost.userId})
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {cost.bankName || "미등록"}
                                                  {cost.accountNumber &&
                                                    cost.accountNumber !==
                                                      "미등록" &&
                                                    ` | ${cost.accountNumber}`}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="font-medium text-gray-900">
                                                  {cost.cost.toLocaleString()}원
                                                </span>
                                                <span
                                                  className={`px-2 py-0.5 rounded text-xs ${
                                                    cost.paymentStatus ===
                                                    "지급"
                                                      ? "bg-green-100 text-green-700"
                                                      : "bg-red-100 text-red-700"
                                                  }`}
                                                >
                                                  {cost.paymentStatus}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                  {new Date(
                                                    cost.createdat
                                                  ).toLocaleDateString("ko-KR")}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}

                        {/* 합계 */}
                        <div className="flex items-center justify-between py-3 border-t-2 border-gray-300 bg-gray-50 px-2 rounded mt-2">
                          <span className="font-bold text-gray-900">합계</span>
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">총액: </span>
                              <span className="font-bold text-gray-900 text-lg">
                                {settlement.totalAmount.toLocaleString()}원
                              </span>
                            </div>
                            <div>
                              <span className="text-green-600">지급: </span>
                              <span className="font-bold text-green-700 text-lg">
                                {settlement.paidAmount.toLocaleString()}원
                              </span>
                            </div>
                            <div>
                              <span className="text-red-600">미지급: </span>
                              <span className="font-bold text-red-700 text-lg">
                                {settlement.unpaidAmount.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-400 py-4">
                        데이터를 불러올 수 없습니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaClipboardCheck,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaSyncAlt,
  FaCheck,
  FaLock,
  FaHistory,
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

interface DashboardStats {
  totalReviewers: number;
  totalCompanies: number;
  pendingReviews: number;
  chargeCost: number;
  inviteCost: number;
  referralCost: number;
  reviewCost: number;
  studyCost: number;
  totalCost: number;
}

interface PaymentData {
  name: string;
  value: number;
  status: "지급" | "미지급";
  costType: string;
  paidAmount: number;
  unpaidAmount: number;
}

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

interface ChartData {
  name: string;
  지급: number;
  미지급: number;
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

interface ReferralSummaryItem {
  userId: number;
  userName: string;
  loginId: string;
  totalReferralCost: number;
  referralCount: number;
  paidAmount: number;
  unpaidAmount: number;
  lastCreatedAt: string;
  bankName: string;
  accountNumber: string;
}

interface ReferralSummary {
  costs: ReferralSummaryItem[];
  totalAmount: number;
  totalUsers: number;
  totalReferralCount: number;
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

// 🚀 타임아웃 설정이 있는 fetch 함수
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다.");
    }
    throw error;
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviewers: 0,
    totalCompanies: 0,
    pendingReviews: 0,
    chargeCost: 0,
    inviteCost: 0,
    referralCost: 0,
    reviewCost: 0,
    studyCost: 0,
    totalCost: 0,
  });

  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [activePaymentTab, setActivePaymentTab] = useState<
    "all" | "paid" | "unpaid"
  >("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [costDetails, setCostDetails] = useState<Record<string, CostDetail[]>>(
    {}
  );
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>(
    {}
  );

  const [referralSummary, setReferralSummary] =
    useState<ReferralSummary | null>(null);
  const [expandedReferralUser, setExpandedReferralUser] = useState<
    number | null
  >(null);

  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [settlementDate, setSettlementDate] = useState<Date | null>(null);
  const [currentSettlement, setCurrentSettlement] =
    useState<SettlementDto | null>(null);
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 🆕 정산 상세 정보 관련 상태
  const [expandedSettlement, setExpandedSettlement] = useState<number | null>(
    null
  );

  const [settlementDetails, setSettlementDetails] = useState<
    Record<number, CostItemDetail[]>
  >({});
  const [settlementDetailsLoading, setSettlementDetailsLoading] = useState<
    Record<number, boolean>
  >({});

  // 🆕 히스토리 내 비용 타입 확장 상태 (settlementId-costType 형식)
  const [expandedHistoryCostType, setExpandedHistoryCostType] = useState<
    string | null
  >(null);

  // 🆕 지급 상태 업데이트 중인 항목 추적
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<
    Record<number, boolean>
  >({});

  // 🆕 Chrome 확장 프로그램 오류 방지
  useEffect(() => {
    const preventExtensionError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("message channel closed")) {
        event.preventDefault();
        console.warn("Chrome 확장 프로그램 오류 무시됨");
      }
    };

    window.addEventListener("error", preventExtensionError);

    return () => {
      window.removeEventListener("error", preventExtensionError);
    };
  }, []);

  useEffect(() => {
    fetchStats();
    calculateNextSettlementDate();
    checkCurrentMonthSettlement();
    fetchSettlementHistory();
    fetchReferralSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (referralSummary) {
      fetchPaymentStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralSummary]);

  const calculateNextSettlementDate = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let nextSettlement = new Date(currentYear, currentMonth, 10);

    if (today.getDate() > 10) {
      nextSettlement = new Date(currentYear, currentMonth + 1, 10);
    }

    setSettlementDate(nextSettlement);
  };

  const getDaysUntilSettlement = (): number => {
    if (!settlementDate) return 0;
    const today = new Date();
    const diffTime = settlementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const checkCurrentMonthSettlement = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const response = await fetch(
        `https://www.kcci.co.kr/back/settlements/${year}/${month}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentSettlement(data);
      }
    } catch (error) {
      console.error("Failed to check current settlement:", error);
    }
  };

  const fetchSettlementHistory = async () => {
    try {
      const response = await fetch("https://www.kcci.co.kr/back/settlements", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSettlements(data);
      }
    } catch (error) {
      console.error("Failed to fetch settlement history:", error);
    }
  };

  // 🆕 특정 월의 비용 상세 정보 조회
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

      // 각 비용 타입별로 데이터 가져오기
      const costPromises = costTypes.map(async ({ type, name }) => {
        const response = await fetch(
          `https://www.kcci.co.kr/back/costs/${type}/with-status`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          let costs: CostDetail[] = data.costs;

          // 해당 년/월의 비용만 필터링
          costs = costs.filter((cost) => {
            const costDate = new Date(cost.createdat);
            return (
              costDate.getFullYear() === year &&
              costDate.getMonth() + 1 === month
            );
          });

          // 지급 완료/미지급 금액 계산
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

      // 추천비 데이터 가져오기
      const referralResponse = await fetch(
        "https://www.kcci.co.kr/back/costs/referral/with-status",
        { credentials: "include" }
      );

      let referralData: CostItemDetail | null = null;
      if (referralResponse.ok) {
        const data = await referralResponse.json();
        let allReferrals: CostDetail[] = data.costs;

        // 해당 년/월의 비용만 필터링
        allReferrals = allReferrals.filter((referral) => {
          const referralDate = new Date(referral.createdat);
          return (
            referralDate.getFullYear() === year &&
            referralDate.getMonth() + 1 === month
          );
        });

        // 지급 완료/미지급 금액 계산
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

  // 🆕 정산 항목 클릭 핸들러
  const handleSettlementClick = (settlement: SettlementDto) => {
    if (expandedSettlement === settlement.settlementId) {
      setExpandedSettlement(null);
      setExpandedHistoryCostType(null); // 닫을 때 세부 항목도 초기화
    } else {
      setExpandedSettlement(settlement.settlementId);
      setExpandedHistoryCostType(null); // 다른 정산 열 때 세부 항목 초기화
      if (!settlementDetails[settlement.settlementId]) {
        fetchSettlementDetails(
          settlement.year,
          settlement.month,
          settlement.settlementId
        );
      }
    }
  };

  // 🆕 히스토리 내 비용 타입 클릭 핸들러
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

  const handleCreateSettlement = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    if (
      !confirm(
        `${year}년 ${month}월 정산을 생성하시겠습니까?\n\n현재 금액으로 스냅샷이 저장됩니다.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("https://www.kcci.co.kr/back/settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ year, month }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSettlement(data);
        alert("정산이 생성되었습니다.");
        await fetchSettlementHistory();
      } else {
        const error = await response.text();
        alert(`정산 생성 실패: ${error}`);
      }
    } catch (error) {
      console.error("Failed to create settlement:", error);
      alert("정산 생성 중 오류가 발생했습니다.");
    }
  };

  const handleConfirmSettlement = async () => {
    if (!currentSettlement) return;

    const confirmedBy = prompt("확정자 이름을 입력하세요:");
    if (!confirmedBy) return;

    if (
      !confirm(
        `정산을 확정하시겠습니까?\n\n확정 후에는 수정할 수 없습니다.\n확정자: ${confirmedBy}`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `https://www.kcci.co.kr/back/settlements/${currentSettlement.settlementId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ confirmedBy }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentSettlement(data);
        alert("정산이 확정되었습니다.");
        await fetchSettlementHistory();
      } else {
        alert("정산 확정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to confirm settlement:", error);
      alert("정산 확정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSettlement = async (settlementId: number) => {
    if (!confirm("정산을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://www.kcci.co.kr/back/settlements/${settlementId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok || response.status === 204) {
        alert("정산이 삭제되었습니다.");
        setCurrentSettlement(null);
        await fetchSettlementHistory();
      } else {
        alert("정산 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete settlement:", error);
      alert("정산 삭제 중 오류가 발생했습니다.");
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://www.kcci.co.kr/back/admin/dashboard/all",
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalReviewers: data.totalReviewers || 0,
          totalCompanies: data.totalCompanies || 0,
          pendingReviews: data.pendingReviews || 0,
          chargeCost: data.chargeCost || 0,
          inviteCost: data.inviteCost || 0,
          referralCost: data.referralCost || 0,
          reviewCost: data.reviewCost || 0,
          studyCost: data.studyCost || 0,
          totalCost: data.totalCost || 0,
        });

        await fetchReferralSummary();
      } else {
        console.error("Failed to fetch stats");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralSummary = async () => {
    try {
      // with-status에서 모든 추천 데이터 가져오기
      const response = await fetch(
        "https://www.kcci.co.kr/back/costs/referral/with-status",
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        let allReferrals: CostDetail[] = data.costs;

        // 🆕 현재 월의 비용만 필터링
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        allReferrals = allReferrals.filter((referral) => {
          const referralDate = new Date(referral.createdat);
          return (
            referralDate.getFullYear() === currentYear &&
            referralDate.getMonth() + 1 === currentMonth
          );
        });

        // userId별로 그룹핑하여 summary 계산
        const userMap = new Map<number, ReferralSummaryItem>();

        allReferrals.forEach((referral) => {
          if (!userMap.has(referral.userId)) {
            userMap.set(referral.userId, {
              userId: referral.userId,
              userName: referral.userName,
              loginId: "", // with-status에는 loginId가 없으므로 빈 문자열
              totalReferralCost: 0,
              referralCount: 0,
              paidAmount: 0,
              unpaidAmount: 0,
              lastCreatedAt: referral.createdat,
              bankName: referral.bankName || "미등록",
              accountNumber: referral.accountNumber || "미등록",
            });
          }

          const userSummary = userMap.get(referral.userId)!;
          userSummary.totalReferralCost += referral.cost;
          userSummary.referralCount += 1;

          if (referral.paymentStatus === "지급") {
            userSummary.paidAmount += referral.cost;
          } else {
            userSummary.unpaidAmount += referral.cost;
          }

          // 최신 생성일 업데이트
          if (
            new Date(referral.createdat) > new Date(userSummary.lastCreatedAt)
          ) {
            userSummary.lastCreatedAt = referral.createdat;
          }
        });

        const costs = Array.from(userMap.values());
        const totalAmount = costs.reduce(
          (sum, user) => sum + user.totalReferralCost,
          0
        );
        const totalUsers = costs.length;
        const totalReferralCount = costs.reduce(
          (sum, user) => sum + user.referralCount,
          0
        );

        setReferralSummary({
          costs,
          totalAmount,
          totalUsers,
          totalReferralCount,
        });
      }
    } catch (error) {
      console.error("Failed to fetch referral summary:", error);
    }
  };

  const fetchPaymentStatistics = async () => {
    try {
      const costTypes = [
        { type: "charge", name: "영업비" },
        { type: "review", name: "심사비" },
        { type: "invite", name: "수수료" },
        { type: "study", name: "강사비" },
      ];

      // 🆕 현재 월 필터 정보
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const statisticsPromises = costTypes.map(async ({ type, name }) => {
        const response = await fetch(
          `https://www.kcci.co.kr/back/costs/${type}/with-status`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          let costs: CostDetail[] = data.costs;

          // 🆕 현재 월의 비용만 필터링
          costs = costs.filter((cost) => {
            const costDate = new Date(cost.createdat);
            return (
              costDate.getFullYear() === currentYear &&
              costDate.getMonth() + 1 === currentMonth
            );
          });

          // 🆕 paidAmount와 unpaidAmount 직접 계산
          let paidAmount = 0;
          let unpaidAmount = 0;

          costs.forEach((cost) => {
            if (cost.paymentStatus === "지급") {
              paidAmount += cost.cost;
            } else {
              unpaidAmount += cost.cost;
            }
          });

          const totalAmount = paidAmount + unpaidAmount;

          return {
            name,
            value: totalAmount,
            status: unpaidAmount > 0 ? ("미지급" as const) : ("지급" as const),
            costType: type,
            paidAmount,
            unpaidAmount,
          };
        }
        return null;
      });

      const results = await Promise.all(statisticsPromises);
      const validResults = results.filter((r) => r !== null) as PaymentData[];

      if (referralSummary) {
        const paidAmount = referralSummary.costs.reduce(
          (sum, user) => sum + user.paidAmount,
          0
        );
        const unpaidAmount = referralSummary.costs.reduce(
          (sum, user) => sum + user.unpaidAmount,
          0
        );

        validResults.push({
          name: "추천비",
          value: referralSummary.totalAmount,
          status: unpaidAmount > 0 ? "미지급" : "지급",
          costType: "referral",
          paidAmount,
          unpaidAmount,
        });
      }

      setPaymentData(validResults);
    } catch (error) {
      console.error("Failed to fetch payment statistics:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 🆕 캐시된 상세 데이터 초기화
      setCostDetails({});
      setExpandedItem(null);
      setExpandedReferralUser(null);

      await fetchStats();
      await checkCurrentMonthSettlement();
      await fetchReferralSummary();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchCostDetails = async (costType: string) => {
    if (detailsLoading[costType]) return;

    try {
      setDetailsLoading({ ...detailsLoading, [costType]: true });

      const response = await fetch(
        `https://www.kcci.co.kr/back/costs/${costType}/with-status`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        let costs: CostDetail[] = data.costs;

        // 🆕 현재 월의 비용만 필터링
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        costs = costs.filter((cost) => {
          const costDate = new Date(cost.createdat);
          return (
            costDate.getFullYear() === currentYear &&
            costDate.getMonth() + 1 === currentMonth
          );
        });

        setCostDetails({ ...costDetails, [costType]: costs });
      }
    } catch (error) {
      console.error(`Failed to fetch ${costType} details:`, error);
    } finally {
      setDetailsLoading({ ...detailsLoading, [costType]: false });
    }
  };

  const handleItemClick = (costType: string) => {
    if (expandedItem === costType) {
      setExpandedItem(null);
    } else {
      setExpandedItem(costType);
      if (!costDetails[costType]) {
        fetchCostDetails(costType);
      }
    }
  };

  const handleReferralUserClick = (userId: number) => {
    if (expandedReferralUser === userId) {
      setExpandedReferralUser(null);
    } else {
      setExpandedReferralUser(userId);
      if (!costDetails[`referral-${userId}`]) {
        fetchReferralDetails(userId);
      }
    }
  };

  const fetchReferralDetails = async (userId: number) => {
    try {
      setDetailsLoading({ ...detailsLoading, [`referral-${userId}`]: true });

      const response = await fetch(
        "https://www.kcci.co.kr/back/costs/referral/with-status",
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        let userReferrals = data.costs.filter(
          (item: CostDetail) => item.userId === userId
        );

        // 🆕 현재 월의 비용만 필터링
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        userReferrals = userReferrals.filter((referral: CostDetail) => {
          const referralDate = new Date(referral.createdat);
          return (
            referralDate.getFullYear() === currentYear &&
            referralDate.getMonth() + 1 === currentMonth
          );
        });

        setCostDetails({
          ...costDetails,
          [`referral-${userId}`]: userReferrals,
        });
      }
    } catch (error) {
      console.error(
        `Failed to fetch referral details for user ${userId}:`,
        error
      );
    } finally {
      setDetailsLoading({ ...detailsLoading, [`referral-${userId}`]: false });
    }
  };

  // 🔥 개선된 지급 상태 변경 함수
  const handlePaymentStatusChange = async (
    costType: string,
    id: number,
    newStatus: "지급" | "미지급"
  ) => {
    // 중복 요청 방지
    if (updatingPaymentStatus[id]) {
      console.warn("이미 처리 중인 요청입니다.");
      return;
    }

    console.log("📌 지급 상태 변경 시작:", { costType, id, newStatus });

    // 로딩 상태 설정
    setUpdatingPaymentStatus({ ...updatingPaymentStatus, [id]: true });

    // 이전 상태 백업 (롤백용)
    const previousCostDetails = { ...costDetails };
    const previousReferralSummary = referralSummary
      ? { ...referralSummary }
      : null;

    try {
      // 🔄 낙관적 업데이트 (Optimistic Update)
      if (costType === "referral") {
        const key = `referral-${expandedReferralUser}`;
        if (costDetails[key]) {
          const updatedDetails = costDetails[key].map((item) =>
            item.id === id ? { ...item, paymentStatus: newStatus } : item
          );
          setCostDetails({ ...costDetails, [key]: updatedDetails });

          // 🆕 referralSummary도 낙관적 업데이트
          if (referralSummary && expandedReferralUser) {
            const updatedSummary = {
              ...referralSummary,
              costs: referralSummary.costs.map((user) => {
                if (user.userId === expandedReferralUser) {
                  // updatedDetails를 직접 사용하여 paidAmount와 unpaidAmount 재계산
                  let paidAmount = 0;
                  let unpaidAmount = 0;
                  updatedDetails.forEach((item) => {
                    if (item.paymentStatus === "지급") {
                      paidAmount += item.cost;
                    } else {
                      unpaidAmount += item.cost;
                    }
                  });

                  return {
                    ...user,
                    paidAmount,
                    unpaidAmount,
                  };
                }
                return user;
              }),
            };
            setReferralSummary(updatedSummary);
          }
        }
      } else {
        if (costDetails[costType]) {
          const updatedDetails = costDetails[costType].map((item) =>
            item.id === id ? { ...item, paymentStatus: newStatus } : item
          );
          setCostDetails({ ...costDetails, [costType]: updatedDetails });
        }
      }

      console.log("🔄 API 요청 전송 중...");

      // API 호출
      const response = await fetchWithTimeout(
        `https://www.kcci.co.kr/back/costs/${costType}/${id}/payment-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ paymentStatus: newStatus }),
        },
        10000 // 10초 타임아웃
      );

      console.log("✅ API 응답:", response.status, response.statusText);

      // 응답 상태 확인
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`상태 변경 실패: ${response.status} - ${errorText}`);
      }

      console.log(`✨ 지급 상태가 &quot;${newStatus}&quot;로 변경되었습니다.`);

      // 🔄 데이터 재조회
      if (costType === "referral") {
        await Promise.all([
          fetchReferralSummary(),
          expandedReferralUser
            ? fetchReferralDetails(expandedReferralUser)
            : Promise.resolve(),
        ]);
      } else {
        await fetchCostDetails(costType);
      }

      await fetchPaymentStatistics();
    } catch (error) {
      console.error("❌ 지급 상태 변경 실패:", error);

      // ❌ 에러 시 이전 상태로 롤백
      setCostDetails(previousCostDetails);
      if (previousReferralSummary) {
        setReferralSummary(previousReferralSummary);
      }

      // 서버 데이터 다시 가져오기
      if (costType === "referral") {
        if (expandedReferralUser) {
          await fetchReferralDetails(expandedReferralUser);
        }
        await fetchReferralSummary();
      } else {
        await fetchCostDetails(costType);
      }

      alert(
        `지급 상태 변경에 실패했습니다.\n${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      // 로딩 상태 해제
      setUpdatingPaymentStatus((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleDeleteCost = async (
    costType: string,
    id: number,
    userName: string
  ) => {
    if (!confirm(`${userName}의 비용 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://www.kcci.co.kr/back/costs/${costType}/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok || response.status === 204) {
        alert("삭제되었습니다.");
        if (costType === "referral") {
          await fetchReferralSummary();
          if (expandedReferralUser) {
            await fetchReferralDetails(expandedReferralUser);
          }
        } else {
          await fetchCostDetails(costType);
        }
        await fetchPaymentStatistics();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete cost:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCopyAccount = (bankName: string, accountNumber: string) => {
    const textToCopy = `${bankName} ${accountNumber}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("계좌번호가 복사되었습니다!");
      })
      .catch((err) => {
        console.error("복사 실패:", err);
        alert("복사에 실패했습니다.");
      });
  };

  const getChartData = (): ChartData[] => {
    return paymentData.map((item) => ({
      name: item.name,
      지급: item.paidAmount,
      미지급: item.unpaidAmount,
    }));
  };

  const getFilteredPaymentData = () => {
    if (activePaymentTab === "paid") {
      return paymentData.filter((item) => item.paidAmount > 0);
    } else if (activePaymentTab === "unpaid") {
      return paymentData.filter((item) => item.unpaidAmount > 0);
    }
    return paymentData;
  };

  const getTotalStats = () => {
    const totalPaid = paymentData.reduce(
      (sum, item) => sum + item.paidAmount,
      0
    );
    const totalUnpaid = paymentData.reduce(
      (sum, item) => sum + item.unpaidAmount,
      0
    );
    const total = totalPaid + totalUnpaid;

    return { totalPaid, totalUnpaid, total };
  };

  const filteredPaymentData = getFilteredPaymentData();
  const chartData = getChartData();
  const { totalPaid, totalUnpaid, total } = getTotalStats();
  const daysUntilSettlement = getDaysUntilSettlement();

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: number;
    color: string;
  }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          {loading ? (
            <div className="mt-2 h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
          )}
        </div>
        <Icon className={`w-12 h-12 ${color.replace("border-", "text-")}`} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-blue-500 w-7 h-7" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                관리자 대시보드
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                📅 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
                비용 현황
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-500 text-white hover:bg-gray-600 shadow-md"
            >
              <FaHistory />
              정산 히스토리
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                refreshing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
              }`}
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "새로고침 중..." : "새로고침"}
            </button>

            {currentSettlement ? (
              currentSettlement.settlementStatus === "대기중" ? (
                <button
                  onClick={handleConfirmSettlement}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-green-500 text-white hover:bg-green-600 shadow-md"
                >
                  <FaCheck />
                  정산 확정
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  <FaLock />
                  정산 완료
                </button>
              )
            ) : (
              <button
                onClick={handleCreateSettlement}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-orange-500 text-white hover:bg-orange-600 shadow-md"
              >
                <FaCheck />
                정산 생성
              </button>
            )}
          </div>
        </div>

        {/* 정산 상태 카드 */}
        {currentSettlement && (
          <div
            className={`border-l-4 p-4 mb-6 rounded-lg ${
              currentSettlement.settlementStatus === "확정"
                ? "bg-green-50 border-green-400"
                : "bg-blue-50 border-blue-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {currentSettlement.year}년 {currentSettlement.month}월 정산 -{" "}
                  {currentSettlement.settlementStatus}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  총 금액: {currentSettlement.totalAmount.toLocaleString()}원 |
                  지급: {currentSettlement.paidAmount.toLocaleString()}원 |
                  미지급: {currentSettlement.unpaidAmount.toLocaleString()}원
                </p>
                {currentSettlement.confirmedBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    확정자: {currentSettlement.confirmedBy} |{" "}
                    {new Date(currentSettlement.confirmedAt).toLocaleString(
                      "ko-KR"
                    )}
                  </p>
                )}
              </div>
              {currentSettlement.settlementStatus === "대기중" && (
                <button
                  onClick={() =>
                    handleDeleteSettlement(currentSettlement.settlementId)
                  }
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 정산일 알림 */}
        {daysUntilSettlement <= 7 && daysUntilSettlement > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-yellow-800">
                  정산일이 {daysUntilSettlement}일 남았습니다
                </p>
                <p className="text-sm text-yellow-700">
                  {settlementDate?.toLocaleDateString("ko-KR")}까지 최종 금액을
                  확인해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={FaUsers}
            title="전체 심사원"
            value={stats.totalReviewers}
            color="border-blue-500"
          />
          <StatCard
            icon={FaBuilding}
            title="전체 기업"
            value={stats.totalCompanies}
            color="border-green-500"
          />
          <StatCard
            icon={FaClipboardCheck}
            title="대기 중인 심사"
            value={stats.pendingReviews}
            color="border-yellow-500"
          />
        </div>

        {/* 지급 필요 금액 섹션 */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-orange-500 rounded"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  지급 필요 금액
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  * 현재 월({new Date().getMonth() + 1}월) 비용만 표시됩니다
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
                  <span className="text-gray-600">총 지출: </span>
                  <span className="font-bold text-gray-900">
                    {total.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-green-600">지급 완료: </span>
                  <span className="font-bold text-green-700">
                    {totalPaid.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-red-600">미지급: </span>
                  <span className="font-bold text-red-700">
                    {totalUnpaid.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActivePaymentTab("all")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activePaymentTab === "all"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActivePaymentTab("paid")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activePaymentTab === "paid"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              지급
            </button>
            <button
              onClick={() => setActivePaymentTab("unpaid")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activePaymentTab === "unpaid"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              미지급
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
                    dataKey="지급"
                    stackId="a"
                    fill="#10B981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="미지급"
                    stackId="a"
                    fill="#EF4444"
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
                      지급 완료
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">
                      미지급
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">
                      상세
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-400"
                      >
                        데이터를 불러오는 중...
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredPaymentData.map((item, index) => (
                        <React.Fragment key={`${item.costType}-${index}`}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6 font-medium text-gray-800">
                              {item.name}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-gray-900">
                              {item.value.toLocaleString()}원
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-green-700 font-semibold">
                                {item.paidAmount.toLocaleString()}원
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-red-700 font-semibold">
                                {item.unpaidAmount.toLocaleString()}원
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleItemClick(item.costType)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {expandedItem === item.costType ? (
                                  <FaChevronUp className="inline" />
                                ) : (
                                  <FaChevronDown className="inline" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* 확장된 상세 정보 */}
                          {expandedItem === item.costType && (
                            <tr>
                              <td colSpan={5} className="bg-gray-50 p-4">
                                {item.costType === "referral" ? (
                                  referralSummary ? (
                                    <div className="max-h-96 overflow-y-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="bg-gray-100">
                                            <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                              이름
                                            </th>
                                            <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                              계좌정보
                                            </th>
                                            <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                              총 추천비
                                            </th>
                                            <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                              추천 수
                                            </th>
                                            <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                              지급 완료
                                            </th>
                                            <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                              미지급
                                            </th>
                                            <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                              상세
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {referralSummary.costs.map((user) => (
                                            <React.Fragment key={user.userId}>
                                              <tr className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-2 px-4 text-sm">
                                                  {user.userName}
                                                </td>
                                                <td className="py-2 px-4 text-sm">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-gray-700">
                                                      {user.bankName}
                                                    </span>
                                                    {user.accountNumber &&
                                                      user.accountNumber !==
                                                        "미등록" && (
                                                        <>
                                                          <span className="text-gray-400">
                                                            |
                                                          </span>
                                                          <span className="font-mono text-gray-900">
                                                            {user.accountNumber}
                                                          </span>
                                                          <button
                                                            onClick={() =>
                                                              handleCopyAccount(
                                                                user.bankName,
                                                                user.accountNumber
                                                              )
                                                            }
                                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                                            title="복사"
                                                          >
                                                            📋
                                                          </button>
                                                        </>
                                                      )}
                                                    {(!user.accountNumber ||
                                                      user.accountNumber ===
                                                        "미등록") && (
                                                      <span className="text-red-500 text-xs">
                                                        미등록
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2 px-4 text-sm text-right font-semibold">
                                                  {user.totalReferralCost.toLocaleString()}
                                                  원
                                                </td>
                                                <td className="py-2 px-4 text-sm text-center">
                                                  {user.referralCount}명
                                                </td>
                                                <td className="py-2 px-4 text-sm text-right">
                                                  <span className="text-green-700 font-semibold">
                                                    {user.paidAmount.toLocaleString()}
                                                    원
                                                  </span>
                                                </td>
                                                <td className="py-2 px-4 text-sm text-right">
                                                  <span className="text-red-700 font-semibold">
                                                    {user.unpaidAmount.toLocaleString()}
                                                    원
                                                  </span>
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                  <button
                                                    onClick={() =>
                                                      handleReferralUserClick(
                                                        user.userId
                                                      )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                  >
                                                    {expandedReferralUser ===
                                                    user.userId ? (
                                                      <FaChevronUp className="inline" />
                                                    ) : (
                                                      <FaChevronDown className="inline" />
                                                    )}
                                                  </button>
                                                </td>
                                              </tr>

                                              {expandedReferralUser ===
                                                user.userId && (
                                                <tr>
                                                  <td
                                                    colSpan={7}
                                                    className="bg-blue-50 p-3"
                                                  >
                                                    {detailsLoading[
                                                      `referral-${user.userId}`
                                                    ] ? (
                                                      <div className="text-center py-2 text-gray-400">
                                                        로딩 중...
                                                      </div>
                                                    ) : (
                                                      <table className="w-full">
                                                        <thead>
                                                          <tr className="bg-blue-100">
                                                            <th className="text-left py-1 px-3 text-xs font-semibold text-gray-700">
                                                              하위심사원
                                                            </th>
                                                            <th className="text-right py-1 px-3 text-xs font-semibold text-gray-700">
                                                              추천비
                                                            </th>
                                                            <th className="text-center py-1 px-3 text-xs font-semibold text-gray-700">
                                                              생성일
                                                            </th>
                                                            <th className="text-center py-1 px-3 text-xs font-semibold text-gray-700">
                                                              지급 상태
                                                            </th>
                                                            <th className="text-center py-1 px-3 text-xs font-semibold text-gray-700">
                                                              삭제
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {costDetails[
                                                            `referral-${user.userId}`
                                                          ]?.map((detail) => (
                                                            <tr
                                                              key={detail.id}
                                                              className="border-b border-blue-200 hover:bg-blue-100"
                                                            >
                                                              <td className="py-1 px-3 text-xs">
                                                                {
                                                                  detail.referredUserName
                                                                }{" "}
                                                              </td>
                                                              <td className="py-1 px-3 text-xs text-right">
                                                                {detail.cost.toLocaleString()}
                                                                원
                                                              </td>
                                                              <td className="py-1 px-3 text-xs text-center">
                                                                {new Date(
                                                                  detail.createdat
                                                                ).toLocaleDateString(
                                                                  "ko-KR"
                                                                )}
                                                              </td>
                                                              <td className="py-1 px-3 text-center">
                                                                <label className="inline-flex items-center cursor-pointer">
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={
                                                                      detail.paymentStatus ===
                                                                      "지급"
                                                                    }
                                                                    onChange={(
                                                                      e
                                                                    ) =>
                                                                      handlePaymentStatusChange(
                                                                        "referral",
                                                                        detail.id,
                                                                        e.target
                                                                          .checked
                                                                          ? "지급"
                                                                          : "미지급"
                                                                      )
                                                                    }
                                                                    disabled={
                                                                      updatingPaymentStatus[
                                                                        detail
                                                                          .id
                                                                      ]
                                                                    }
                                                                    className="sr-only peer"
                                                                  />
                                                                  <div
                                                                    className={`relative w-8 h-4 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500 ${
                                                                      updatingPaymentStatus[
                                                                        detail
                                                                          .id
                                                                      ]
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : ""
                                                                    }`}
                                                                  ></div>
                                                                </label>
                                                              </td>
                                                              <td className="py-1 px-3 text-center">
                                                                <button
                                                                  onClick={() =>
                                                                    handleDeleteCost(
                                                                      "referral",
                                                                      detail.id,
                                                                      detail.userName
                                                                    )
                                                                  }
                                                                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                                  title="삭제"
                                                                >
                                                                  <FaTrash className="inline text-xs" />
                                                                </button>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    )}
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-400">
                                      추천비 데이터가 없습니다.
                                    </div>
                                  )
                                ) : detailsLoading[item.costType] ? (
                                  <div className="text-center py-4 text-gray-400">
                                    로딩 중...
                                  </div>
                                ) : (
                                  <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                            이름
                                          </th>
                                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                                            계좌정보
                                          </th>
                                          <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">
                                            금액
                                          </th>
                                          <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                            생성일
                                          </th>
                                          <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                            지급 상태
                                          </th>
                                          <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">
                                            삭제
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {costDetails[item.costType]?.map(
                                          (detail) => (
                                            <tr
                                              key={detail.id}
                                              className="border-b border-gray-200 hover:bg-gray-100"
                                            >
                                              <td className="py-2 px-4 text-sm">
                                                {detail.userName}
                                              </td>

                                              <td className="py-2 px-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-gray-700">
                                                    {detail.bankName ||
                                                      "미등록"}
                                                  </span>
                                                  {detail.accountNumber &&
                                                    detail.accountNumber !==
                                                      "미등록" && (
                                                      <>
                                                        <span className="text-gray-400">
                                                          |
                                                        </span>
                                                        <span className="font-mono text-gray-900">
                                                          {detail.accountNumber}
                                                        </span>
                                                        <button
                                                          onClick={() =>
                                                            handleCopyAccount(
                                                              detail.bankName,
                                                              detail.accountNumber
                                                            )
                                                          }
                                                          className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                                                          title="복사"
                                                        >
                                                          📋
                                                        </button>
                                                      </>
                                                    )}
                                                  {(!detail.accountNumber ||
                                                    detail.accountNumber ===
                                                      "미등록") && (
                                                    <span className="text-red-500 text-xs">
                                                      미등록
                                                    </span>
                                                  )}
                                                </div>
                                              </td>

                                              <td className="py-2 px-4 text-sm text-right">
                                                {detail.cost.toLocaleString()}원
                                              </td>
                                              <td className="py-2 px-4 text-sm text-center">
                                                {new Date(
                                                  detail.createdat
                                                ).toLocaleDateString("ko-KR")}
                                              </td>
                                              <td className="py-2 px-4 text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={
                                                      detail.paymentStatus ===
                                                      "지급"
                                                    }
                                                    onChange={(e) =>
                                                      handlePaymentStatusChange(
                                                        item.costType,
                                                        detail.id,
                                                        e.target.checked
                                                          ? "지급"
                                                          : "미지급"
                                                      )
                                                    }
                                                    disabled={
                                                      updatingPaymentStatus[
                                                        detail.id
                                                      ]
                                                    }
                                                    className="sr-only peer"
                                                  />
                                                  <div
                                                    className={`relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${
                                                      updatingPaymentStatus[
                                                        detail.id
                                                      ]
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                    }`}
                                                  ></div>
                                                  <span className="ml-3 text-sm font-medium text-gray-700">
                                                    {detail.paymentStatus}
                                                  </span>
                                                </label>
                                              </td>
                                              <td className="py-2 px-4 text-center">
                                                <button
                                                  onClick={() =>
                                                    handleDeleteCost(
                                                      item.costType,
                                                      detail.id,
                                                      detail.userName
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
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td className="py-4 px-6 font-bold text-gray-900">
                          합계
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900 text-lg">
                          {total.toLocaleString()}원
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-green-700 text-lg">
                          {totalPaid.toLocaleString()}원
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-red-700 text-lg">
                          {totalUnpaid.toLocaleString()}원
                        </td>
                        <td></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <p>
                  📌 현재 월({new Date().getMonth() + 1}월) 비용만 표시 | 과거
                  데이터는 &ldquo;정산 히스토리&rdquo;에서 확인 | 매월 말 스냅샷
                  반드시 생성!
                </p>
                <p>* 매월 말일 마감 후 익월 10일 지급</p>
              </div>
            </div>
          </div>
        </div>

        {/* 정산 히스토리 모달 */}
        {showHistoryModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">정산 히스토리</h3>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
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
                                {expandedSettlement ===
                                settlement.settlementId ? (
                                  <FaChevronUp className="inline" />
                                ) : (
                                  <FaChevronDown className="inline" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              총액: {settlement.totalAmount.toLocaleString()}원
                              | 지급: {settlement.paidAmount.toLocaleString()}원
                              | 미지급:{" "}
                              {settlement.unpaidAmount.toLocaleString()}원
                            </p>
                            {settlement.confirmedBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                확정자: {settlement.confirmedBy} |{" "}
                                {new Date(
                                  settlement.confirmedAt
                                ).toLocaleString("ko-KR")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              생성:{" "}
                              {new Date(
                                settlement.createdAt
                              ).toLocaleDateString("ko-KR")}
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
                                📊 {settlement.year}년 {settlement.month}월 비용
                                상세
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
                                      {/* 비용 타입 요약 (클릭 가능) */}
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
                                              {costItem.paidAmount.toLocaleString()}
                                              원
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
                                                  if (
                                                    !userMap.has(cost.userId)
                                                  ) {
                                                    userMap.set(cost.userId, {
                                                      userId: cost.userId,
                                                      userName: cost.userName,
                                                      bankName:
                                                        cost.bankName ||
                                                        "미등록",
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
                                                  if (
                                                    cost.paymentStatus ===
                                                    "지급"
                                                  ) {
                                                    user.paidAmount +=
                                                      cost.cost;
                                                  } else {
                                                    user.unpaidAmount +=
                                                      cost.cost;
                                                  }
                                                }
                                              );

                                              return (
                                                <div className="space-y-2">
                                                  {Array.from(
                                                    userMap.values()
                                                  ).map((user) => (
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
                                                  ))}
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
                                                        {cost.bankName ||
                                                          "미등록"}
                                                        {cost.accountNumber &&
                                                          cost.accountNumber !==
                                                            "미등록" &&
                                                          ` | ${cost.accountNumber}`}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                      <span className="font-medium text-gray-900">
                                                        {cost.cost.toLocaleString()}
                                                        원
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
                                                        ).toLocaleDateString(
                                                          "ko-KR"
                                                        )}
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
                                <span className="font-bold text-gray-900">
                                  합계
                                </span>
                                <div className="flex items-center gap-6 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      총액:{" "}
                                    </span>
                                    <span className="font-bold text-gray-900 text-lg">
                                      {settlement.totalAmount.toLocaleString()}
                                      원
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-green-600">
                                      지급:{" "}
                                    </span>
                                    <span className="font-bold text-green-700 text-lg">
                                      {settlement.paidAmount.toLocaleString()}원
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-red-600">
                                      미지급:{" "}
                                    </span>
                                    <span className="font-bold text-red-700 text-lg">
                                      {settlement.unpaidAmount.toLocaleString()}
                                      원
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
        )}
      </div>
    </div>
  );
}

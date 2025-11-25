"use client";

import { useState, useEffect } from "react";
import {
  FaChartLine,
  FaUsers,
  FaBuilding,
  FaClipboardCheck,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalReviewers: number;
  totalCompanies: number;
  pendingReviews: number;
}

interface PaymentData {
  name: string;
  value: number;
  status: "지급" | "미지급";
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviewers: 0,
    totalCompanies: 0,
    pendingReviews: 0,
  });

  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [activePaymentTab, setActivePaymentTab] = useState<
    "all" | "paid" | "unpaid"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // ✅ 실제 API 호출
        const response = await fetch(
          "http://petback.hysu.kr/back/admin/dashboard/stats",
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
          });
        } else {
          console.error("Failed to fetch stats");
        }

        // 지급 데이터는 임시 데이터 (추후 API 연동)
        const payments: PaymentData[] = [
          { name: "영업비", value: 15000000, status: "지급" },
          { name: "심사비", value: 25000000, status: "미지급" },
          { name: "수수료", value: 8000000, status: "지급" },
          { name: "강사비", value: 12000000, status: "미지급" },
          { name: "추천비", value: 5000000, status: "지급" },
        ];
        setPaymentData(payments);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getFilteredPaymentData = () => {
    if (activePaymentTab === "paid") {
      return paymentData.filter((item) => item.status === "지급");
    } else if (activePaymentTab === "unpaid") {
      return paymentData.filter((item) => item.status === "미지급");
    }
    return paymentData;
  };

  const filteredPaymentData = getFilteredPaymentData();

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
        <div className="flex items-center gap-3 mb-8">
          <FaChartLine className="text-blue-500 w-7 h-7" />
          <h2 className="text-2xl font-bold text-gray-800">관리자 대시보드</h2>
        </div>

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
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-orange-500 rounded"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              지급 필요 금액
            </h3>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredPaymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}원`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {filteredPaymentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.status === "지급" ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
                      금액
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaymentData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">
                        {item.value.toLocaleString()}원
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            item.status === "지급"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-4 px-6 font-bold text-gray-900">합계</td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 text-lg">
                      {filteredPaymentData
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                      원
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 안내 문구 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-right">
                * 매월 말일 마감 후 익월 10일 지급
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

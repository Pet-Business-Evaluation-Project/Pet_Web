"use client";

import { useState, useEffect } from "react";
import { FaChartLine, FaUsers, FaBuilding, FaClipboardCheck } from "react-icons/fa";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalReviewers: number;
  totalCompanies: number;
  pendingReviews: number;
  completedReviews: number;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PaymentData {
  name: string;
  value: number;
  status: "지급" | "미지급";
  [key: string]: string | number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviewers: 0,
    totalCompanies: 0,
    pendingReviews: 0,
    completedReviews: 0,
  });

  const [expenseData, setExpenseData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [activePaymentTab, setActivePaymentTab] = useState<"all" | "paid" | "unpaid">("all");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats({
          totalReviewers: 24,
          totalCompanies: 156,
          pendingReviews: 8,
          completedReviews: 342,
        });

        const expenses: ChartData[] = [
          { name: "영업비", value: 15000000 },
          { name: "심사비", value: 25000000 },
          { name: "수수료", value: 8000000 },
          { name: "강사비", value: 12000000 },
          { name: "추천비", value: 5000000 },
        ];
        setExpenseData(expenses);
        setTotalExpense(expenses.reduce((sum, item) => sum + item.value, 0));

        const revenues: ChartData[] = [
          { name: "인증비", value: 45000000 },
          { name: "교육비", value: 28000000 },
          { name: "쇼핑몰", value: 12000000 },
        ];
        setRevenueData(revenues);
        setTotalRevenue(revenues.reduce((sum, item) => sum + item.value, 0));

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
      }
    };

    fetchStats();
  }, []);

  const EXPENSE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const REVENUE_COLORS = ["#06B6D4", "#84CC16", "#F97316"];

  const getFilteredPaymentData = () => {
    if (activePaymentTab === "paid") {
      return paymentData.filter(item => item.status === "지급");
    } else if (activePaymentTab === "unpaid") {
      return paymentData.filter(item => item.status === "미지급");
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
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <Icon className={`w-12 h-12 ${color.replace("border-", "text-")}`} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 max-w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <FaChartLine className="text-blue-500 w-6 h-6" />
          <h2 className="text-xl font-bold">관리자 대시보드</h2>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          <StatCard
            icon={FaClipboardCheck}
            title="완료된 심사"
            value={stats.completedReviews}
            color="border-purple-500"
          />
        </div>

        {/* 매출/지출 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2 opacity-90">총 매출</h3>
            <p className="text-4xl font-bold mb-1">
              {totalRevenue.toLocaleString()}원
            </p>
            <p className="text-sm opacity-80">이번 달 기준</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2 opacity-90">총 지출</h3>
            <p className="text-4xl font-bold mb-1">
              {totalExpense.toLocaleString()}원
            </p>
            <p className="text-sm opacity-80">이번 달 기준</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2 opacity-90">순이익</h3>
            <p className="text-4xl font-bold mb-1">
              {(totalRevenue - totalExpense).toLocaleString()}원
            </p>
            <p className="text-sm opacity-80">매출 - 지출</p>
          </div>
        </div>

        {/* 지출 현황 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-500 rounded"></div>
              지출 내역 (막대 그래프)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-500 rounded"></div>
              지출 비율 (원 그래프)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {expenseData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: EXPENSE_COLORS[index] }}
                  ></div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 매출 현황 차트 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded"></div>
            매출 현황 (원 그래프)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                {revenueData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: REVENUE_COLORS[index] }}
                      ></div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{item.value.toLocaleString()}원</p>
                      <p className="text-sm text-gray-500">
                        {((item.value / totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 지급 필요 금액 섹션 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="w-1 h-6 bg-orange-500 rounded"></div>
              지급 필요 금액
            </h3>
          </div>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActivePaymentTab("all")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activePaymentTab === "all"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActivePaymentTab("paid")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activePaymentTab === "paid"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              지급
            </button>
            <button
              onClick={() => setActivePaymentTab("unpaid")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activePaymentTab === "unpaid"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              미지급
            </button>
          </div>

          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredPaymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
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
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">항목</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">금액</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-800">{item.name}</td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                      {item.value.toLocaleString()}원
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === "지급" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-4 px-4 font-bold text-gray-900">합계</td>
                  <td className="py-4 px-4 text-right font-bold text-gray-900 text-lg">
                    {filteredPaymentData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}원
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <p className="text-xs text-gray-500">
              * 매월 말일 마감 후 익월 10일 지급
            </p>
          </div>
        </div>

        {/* 최근 활동 섹션 */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">새로운 심사원 등록</p>
                <p className="text-sm text-gray-500">홍길동 - 심사원보</p>
              </div>
              <span className="text-xs text-gray-400">2시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">기업 심사 완료</p>
                <p className="text-sm text-gray-500">(주)샘플기업 - 승인</p>
              </div>
              <span className="text-xs text-gray-400">5시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <p className="font-medium">직책 변경</p>
                <p className="text-sm text-gray-500">김철수 - 심사위원 → 수석심사위원</p>
              </div>
              <span className="text-xs text-gray-400">1일 전</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { FaUsers, FaBuilding, FaClipboardCheck } from "react-icons/fa";

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

interface StatCardsProps {
  stats: DashboardStats;
  loading: boolean;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  color: string;
  loading: boolean;
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

export default function StatCards({ stats, loading }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        icon={FaUsers}
        title="전체 심사원"
        value={stats.totalReviewers}
        color="border-blue-500"
        loading={loading}
      />
      <StatCard
        icon={FaBuilding}
        title="전체 기업"
        value={stats.totalCompanies}
        color="border-green-500"
        loading={loading}
      />
      <StatCard
        icon={FaClipboardCheck}
        title="대기 중인 심사"
        value={stats.pendingReviews}
        color="border-yellow-500"
        loading={loading}
      />
    </div>
  );
}

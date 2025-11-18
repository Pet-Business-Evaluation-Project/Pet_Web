"use client";

import { useState } from "react";
import { FaCheck, FaTimes, FaBuilding, FaEnvelope, FaPhone, FaCalendar } from "react-icons/fa";

interface MemberSignRequest {
  id: number;
  companyName: string;
  businessNumber: string;
  representative: string;
  email: string;
  phone: string;
  address: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

export default function MemberSignDashboard() {
  const [signRequests, setSignRequests] = useState<MemberSignRequest[]>([
    {
      id: 1,
      companyName: "(주)테크이노베이션",
      businessNumber: "123-45-67890",
      representative: "김철수",
      email: "tech@innovation.com",
      phone: "02-1234-5678",
      address: "서울특별시 강남구 테헤란로 123",
      requestDate: "2025-11-15",
      status: "pending",
    },
    {
      id: 2,
      companyName: "스마트솔루션",
      businessNumber: "234-56-78901",
      representative: "이영희",
      email: "contact@smartsol.com",
      phone: "02-2345-6789",
      address: "서울특별시 서초구 서초대로 456",
      requestDate: "2025-11-16",
      status: "pending",
    },
    {
      id: 3,
      companyName: "그린에너지코퍼레이션",
      businessNumber: "345-67-89012",
      representative: "박민수",
      email: "info@greenenergy.kr",
      phone: "031-3456-7890",
      address: "경기도 성남시 분당구 판교로 789",
      requestDate: "2025-11-17",
      status: "pending",
    },
    {
      id: 4,
      companyName: "디지털마케팅그룹",
      businessNumber: "456-78-90123",
      representative: "정수진",
      email: "digital@marketing.co.kr",
      phone: "02-4567-8901",
      address: "서울특별시 마포구 월드컵북로 321",
      requestDate: "2025-11-18",
      status: "approved",
    },
    {
      id: 5,
      companyName: "바이오헬스케어",
      businessNumber: "567-89-01234",
      representative: "최동욱",
      email: "bio@healthcare.com",
      phone: "031-5678-9012",
      address: "경기도 용인시 기흥구 언남로 654",
      requestDate: "2025-11-14",
      status: "rejected",
    },
  ]);

  const handleApprove = (id: number) => {
    setSignRequests(
      signRequests.map((request) =>
        request.id === id ? { ...request, status: "approved" } : request
      )
    );
  };

  const handleReject = (id: number) => {
    setSignRequests(
      signRequests.map((request) =>
        request.id === id ? { ...request, status: "rejected" } : request
      )
    );
  };

  const pendingRequests = signRequests.filter((r) => r.status === "pending");
  const processedRequests = signRequests.filter((r) => r.status !== "pending");

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
      {/* 헤더 - 다른 페이지와 동일한 스타일 */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <FaBuilding className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">기업 가입 승인</h1>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium mb-1">대기중</p>
              <p className="text-3xl font-bold text-yellow-700">{pendingRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <FaCalendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">승인완료</p>
              <p className="text-3xl font-bold text-green-700">
                {signRequests.filter((r) => r.status === "approved").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <FaCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium mb-1">거절</p>
              <p className="text-3xl font-bold text-red-700">
                {signRequests.filter((r) => r.status === "rejected").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
              <FaTimes className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 대기중인 신청 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">승인 대기중</h2>
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              대기중인 가입 신청이 없습니다.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FaBuilding className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-800">
                        {request.companyName}
                      </h3>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        대기중
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">사업자번호:</span> {request.businessNumber}
                      </p>
                      <p>
                        <span className="font-medium">대표자:</span> {request.representative}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaEnvelope className="w-4 h-4" />
                        {request.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaPhone className="w-4 h-4" />
                        {request.phone}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-medium">주소:</span> {request.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaCalendar className="w-4 h-4" />
                        신청일: {request.requestDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium"
                    >
                      <FaCheck />
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
                    >
                      <FaTimes />
                      거절
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 처리완료 신청 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">처리완료</h2>
        <div className="space-y-4">
          {processedRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              처리된 가입 신청이 없습니다.
            </div>
          ) : (
            processedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FaBuilding className="w-5 h-5 text-gray-500" />
                      <h3 className="text-lg font-bold text-gray-800">
                        {request.companyName}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          request.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {request.status === "approved" ? "승인완료" : "거절됨"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">사업자번호:</span> {request.businessNumber}
                      </p>
                      <p>
                        <span className="font-medium">대표자:</span> {request.representative}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaCalendar className="w-4 h-4" />
                        신청일: {request.requestDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
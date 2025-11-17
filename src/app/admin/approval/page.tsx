"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Image from "next/image";
import Button from "../../components/Button/Button";

interface ApprovalUser {
  approvalId: number;
  loginID: string;
  name: string;
  phnum: string;
  classification: string;
  classifNumber: string;
  approvalStatus: string;
  requestedAt: string;
  address?: string;
  referralID?: string;
  // 심사원 정보
  account?: string;
  expertises?: string;
  eduLocation?: string;
  eduDate?: string;
  // 기업 정보
  email?: string;
  companycls?: string;
  introduction?: string;
  mainsales?: string;
}

type MenuType = "전체" | "심사원" | "기업";

export default function AdminApprovalPage() {
  const [approvalUsers, setApprovalUsers] = useState<ApprovalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ApprovalUser[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuType>("전체");
  const [selectedUser, setSelectedUser] = useState<ApprovalUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const admin = {
    name: "관리자",
    grade: "Admin",
    avatar: "/img/profile.png",
  };

  // 승인 대기 목록 불러오기
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch("http://petback.hysu.kr/back/admin/approval/pending", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setApprovalUsers(data);
        setFilteredUsers(data);
      } else {
        alert("승인 대기 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("서버 연결 오류");
    }
  };

  // 메뉴 선택 시 필터링
  useEffect(() => {
    if (activeMenu === "전체") {
      setFilteredUsers(approvalUsers);
    } else {
      setFilteredUsers(
        approvalUsers.filter((user) => user.classification === activeMenu)
      );
    }
  }, [activeMenu, approvalUsers]);

  // 승인 처리
  const handleApprove = async (approvalId: number) => {
    if (!confirm("이 사용자를 승인하시겠습니까?")) return;

    try {
      const adminId = 1; // TODO: 실제 관리자 ID로 변경
      const res = await fetch(
        `http://petback.hysu.kr/back/admin/approval/approve/${approvalId}?adminId=${adminId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (res.ok) {
        alert("승인 완료!");
        fetchPendingApprovals(); // 목록 새로고침
      } else {
        const errorText = await res.text();
        alert(`승인 실패: ${errorText}`);
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  // 거부 모달 열기
  const openRejectModal = (user: ApprovalUser) => {
    setSelectedUser(user);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  // 거부 처리
  const handleReject = async () => {
    if (!selectedUser) return;
    if (!rejectionReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    try {
      const adminId = 1; // TODO: 실제 관리자 ID로 변경
      const res = await fetch(
        `http://petback.hysu.kr/back/admin/approval/reject/${selectedUser.approvalId}?adminId=${adminId}&reason=${encodeURIComponent(rejectionReason)}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (res.ok) {
        alert("거부 완료!");
        setShowRejectModal(false);
        setSelectedUser(null);
        fetchPendingApprovals(); // 목록 새로고침
      } else {
        const errorText = await res.text();
        alert(`거부 실패: ${errorText}`);
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 관리자 프로필 + 메뉴 */}
      <div className="flex flex-col items-center md:items-start w-full md:w-64 bg-blue-100 rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-4 border-blue-500 relative overflow-hidden">
          {admin.avatar ? (
            <Image
              src={admin.avatar}
              alt="관리자 프로필"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <FaUserCircle className="w-full h-full text-gray-400" />
          )}
        </div>
        <p className="text-lg font-semibold text-center md:text-left">{admin.name}</p>
        <p className="text-gray-600 text-center md:text-left">{admin.grade}</p>

        {/* 메뉴 버튼들 */}
        <div className="w-full space-y-2 mt-4">
          <Button
            label="전체 승인 관리"
            onClick={() => setActiveMenu("전체")}
            className={`w-full ${activeMenu === "전체" ? "bg-blue-600" : "bg-blue-500"}`}
          />
          <Button
            label="심사원 승인 관리"
            onClick={() => setActiveMenu("심사원")}
            className={`w-full ${activeMenu === "심사원" ? "bg-blue-600" : "bg-blue-500"}`}
          />
          <Button
            label="기업 승인 관리"
            onClick={() => setActiveMenu("기업")}
            className={`w-full ${activeMenu === "기업" ? "bg-blue-600" : "bg-blue-500"}`}
          />
        </div>
      </div>

      {/* 우측 승인 대기 목록 */}
      <div className="flex-1 max-w-full">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            {activeMenu} 승인 대기 목록 ({filteredUsers.length}건)
          </h2>

          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-10">승인 대기 중인 회원이 없습니다.</p>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.approvalId}
                  className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{user.name}</h3>
                      <p className="text-sm text-gray-600">
                        {user.classification} | {user.loginID}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {user.approvalStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <p>
                      <b>전화번호:</b> {user.phnum}
                    </p>
                    <p>
                      <b>신청일:</b> {new Date(user.requestedAt).toLocaleDateString()}
                    </p>
                    {user.address && (
                      <p className="col-span-2">
                        <b>주소:</b> {user.address}
                      </p>
                    )}
                    {user.referralID && (
                      <p>
                        <b>추천인:</b> {user.referralID}
                      </p>
                    )}
                  </div>

                  {/* 심사원 추가 정보 */}
                  {user.classification === "심사원" && (
                    <div className="bg-blue-50 rounded p-3 mb-3 text-sm">
                      <p>
                        <b>계좌번호:</b> {user.account || "-"}
                      </p>
                      <p>
                        <b>전문분야:</b> {user.expertises || "-"}
                      </p>
                      <p>
                        <b>교육장소:</b> {user.eduLocation || "-"}
                      </p>
                      <p>
                        <b>교육날짜:</b> {user.eduDate || "-"}
                      </p>
                    </div>
                  )}

                  {/* 기업 추가 정보 */}
                  {user.classification === "기업" && (
                    <div className="bg-green-50 rounded p-3 mb-3 text-sm">
                      <p>
                        <b>이메일:</b> {user.email || "-"}
                      </p>
                      <p>
                        <b>사업분류:</b> {user.companycls || "-"}
                      </p>
                      <p>
                        <b>회사소개:</b> {user.introduction || "-"}
                      </p>
                      <p>
                        <b>주요판매상품:</b> {user.mainsales || "-"}
                      </p>
                    </div>
                  )}

                  {/* 승인/거부 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(user.approvalId)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                      <FaCheckCircle /> 승인
                    </button>
                    <button
                      onClick={() => openRejectModal(user)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                      <FaTimesCircle /> 거부
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 거부 사유 입력 모달 */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">가입 거부</h2>
            <p className="text-gray-700 mb-4">
              <b>{selectedUser.name}</b>님의 가입을 거부하시겠습니까?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
              rows={4}
              placeholder="거부 사유를 입력해주세요"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                거부 확정
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
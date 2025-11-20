"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaCheckCircle, FaTimesCircle, FaUndo, FaList, FaSearch } from "react-icons/fa";
import Image from "next/image";

interface ApprovalUser {
  approvalId: number;
  loginID: string;
  name: string;
  phnum: string;
  classification: string;
  classifNumber: string;
  approvalStatus: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  address?: string;
  referralID?: string;
  // 심사원 정보
  bankName?: string;
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

type MenuType = "전체가입요청" | "심사원요청" | "기업요청" | "전체승인목록" | "승인대기" | "승인완료목록" | "거부목록";

export default function AdminApprovalPage() {
  const [approvalUsers, setApprovalUsers] = useState<ApprovalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ApprovalUser[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuType>("전체가입요청");
  const [selectedUser, setSelectedUser] = useState<ApprovalUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectApprovedModal, setShowRejectApprovedModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const admin = {
    name: "관리자",
    grade: "Admin",
    avatar: "/img/profile.png",
  };

  // ✅ 가입 요청 섹션인지 확인
  const isRequestSection = ["전체가입요청", "심사원요청", "기업요청"].includes(activeMenu);

  // 데이터 불러오기
  useEffect(() => {
    fetchApprovalUsers();
  }, [activeMenu]);

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(approvalUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = approvalUsers.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.loginID.toLowerCase().includes(query) ||
        user.phnum.includes(query) ||
        user.classification.toLowerCase().includes(query) ||
        (user.address && user.address.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.referralID && user.referralID.toLowerCase().includes(query)) ||
        (user.bankName && user.bankName.toLowerCase().includes(query)) ||
        (user.expertises && user.expertises.toLowerCase().includes(query)) ||
        (user.companycls && user.companycls.toLowerCase().includes(query))
      );
    });

    setFilteredUsers(filtered);
  }, [searchQuery, approvalUsers]);

  const fetchApprovalUsers = async () => {
    try {
      let endpoint = "";

      // ✅ 엔드포인트 결정 (가입 요청 vs 승인 관리)
      switch (activeMenu) {
        // 가입 요청 섹션 (승인대기만)
        case "전체가입요청":
          endpoint = "/admin/approval/requests/all";
          break;
        case "심사원요청":
          endpoint = "/admin/approval/requests/reviewer";
          break;
        case "기업요청":
          endpoint = "/admin/approval/requests/member";
          break;
        
        // 승인 관리 섹션 (모든 상태)
        case "전체승인목록":
          endpoint = "/admin/approval/all";
          break;
        case "승인대기":
          endpoint = "/admin/approval/pending";
          break;
        case "승인완료목록":
          endpoint = "/admin/approval/approved";
          break;
        case "거부목록":
          endpoint = "/admin/approval/rejected";
          break;
      }

      const res = await fetch(`https://www.kcci.co.kr/back${endpoint}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data: ApprovalUser[] = await res.json();
        setApprovalUsers(data);
        setFilteredUsers(data);
        setSearchQuery(""); // 메뉴 변경시 검색 초기화
      } else {
        alert("목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("서버 연결 오류");
    }
  };

  // 승인 처리
  const handleApprove = async (approvalId: number) => {
    if (!confirm("이 사용자를 승인하시겠습니까?")) return;

    try {
      const adminId = 1;
      const res = await fetch(
        `https://www.kcci.co.kr/back/admin/approval/approve/${approvalId}?adminId=${adminId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const message = await res.text();
      alert(message);
      
      if (res.ok) {
        fetchApprovalUsers();
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  // 거부 처리 (승인대기 → 거절)
  const openRejectModal = (user: ApprovalUser) => {
    setSelectedUser(user);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    if (!rejectionReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    try {
      const adminId = 1;
      const res = await fetch(
        `https://www.kcci.co.kr/back/admin/approval/reject/${selectedUser.approvalId}?adminId=${adminId}&reason=${encodeURIComponent(rejectionReason)}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const message = await res.text();
      alert(message);
      
      if (res.ok) {
        setShowRejectModal(false);
        setSelectedUser(null);
        fetchApprovalUsers();
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  // 승인 취소 (승인 → 승인대기)
  const handleCancelApproval = async (approvalId: number, userName: string) => {
    if (!confirm(`${userName}님의 승인을 취소하시겠습니까?\n승인 대기 상태로 돌아갑니다.`)) return;

    try {
      const adminId = 1;
      const res = await fetch(
        `https://www.kcci.co.kr/back/admin/approval/cancel-approval/${approvalId}?adminId=${adminId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const message = await res.text();
      alert(message);
      
      if (res.ok) {
        fetchApprovalUsers();
      }
    } catch (error) {
      console.error("Cancel approval error:", error);
      alert("승인 취소 중 오류가 발생했습니다.");
    }
  };

  // 거부 취소 (거절 → 승인대기)
  const handleCancelRejection = async (approvalId: number, userName: string) => {
    if (!confirm(`${userName}님의 거부를 취소하시겠습니까?\n승인 대기 상태로 돌아갑니다.`)) return;

    try {
      const adminId = 1;
      const res = await fetch(
        `https://www.kcci.co.kr/back/admin/approval/cancel-rejection/${approvalId}?adminId=${adminId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const message = await res.text();
      alert(message);
      
      if (res.ok) {
        fetchApprovalUsers();
      }
    } catch (error) {
      console.error("Cancel rejection error:", error);
      alert("거부 취소 중 오류가 발생했습니다.");
    }
  };

  // 승인된 사용자를 거부로 변경
  const openRejectApprovedModal = (user: ApprovalUser) => {
    setSelectedUser(user);
    setRejectionReason("");
    setShowRejectApprovedModal(true);
  };

  const handleRejectApproved = async () => {
    if (!selectedUser) return;
    if (!rejectionReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    try {
      const adminId = 1;
      const res = await fetch(
        `https://www.kcci.co.kr/back/admin/approval/reject-approved/${selectedUser.approvalId}?adminId=${adminId}&reason=${encodeURIComponent(rejectionReason)}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const message = await res.text();
      alert(message);
      
      if (res.ok) {
        setShowRejectApprovedModal(false);
        setSelectedUser(null);
        fetchApprovalUsers();
      }
    } catch (error) {
      console.error("Reject approved error:", error);
      alert("거부 처리 중 오류가 발생했습니다.");
    }
  };

  // 거부된 사용자를 바로 승인
  const handleApproveRejected = async (approvalId: number, userName: string) => {
    if (!confirm(`${userName}님을 바로 승인하시겠습니까?`)) return;

    try {
      const adminId = 1;
      const res = await fetch(
        `https://www.kcci.co.kr/back/admin/approval/approve-rejected/${approvalId}?adminId=${adminId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const message = await res.text();
      alert(message);
      
      if (res.ok) {
        fetchApprovalUsers();
      }
    } catch (error) {
      console.error("Approve rejected error:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "승인대기":
        return "bg-yellow-100 text-yellow-800";
      case "승인":
        return "bg-green-100 text-green-800";
      case "거절":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 관리자 프로필 + 메뉴 */}
      <aside className="w-full md:w-72 bg-white rounded-2xl shadow-lg p-6 flex-shrink-0">
        {/* 관리자 프로필 */}
        <div className="flex flex-col items-center pb-6 border-b border-gray-200">
          <div className="w-20 h-20 rounded-full border-4 border-blue-500 relative overflow-hidden mb-3">
            {admin.avatar ? (
              <Image
                src={admin.avatar}
                alt="관리자 프로필"
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-400" />
            )}
          </div>
          <p className="text-lg font-bold text-gray-800">{admin.name}</p>
          <p className="text-sm text-gray-500">{admin.grade}</p>
        </div>

        {/* 메뉴 */}
        <nav className="mt-6 space-y-6">
          {/* 가입 요청 섹션 */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              가입 요청
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveMenu("전체가입요청")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "전체가입요청"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                전체 가입 요청
              </button>
              <button
                onClick={() => setActiveMenu("심사원요청")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "심사원요청"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                심사원 요청
              </button>
              <button
                onClick={() => setActiveMenu("기업요청")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "기업요청"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                기업 요청
              </button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200"></div>

          {/* 승인 목록 섹션 */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              승인 관리
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveMenu("전체승인목록")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "전체승인목록"
                    ? "bg-blue-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                전체 승인 목록
              </button>
              <button
                onClick={() => setActiveMenu("승인대기")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "승인대기"
                    ? "bg-yellow-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                승인 대기
              </button>
              <button
                onClick={() => setActiveMenu("승인완료목록")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "승인완료목록"
                    ? "bg-green-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                승인 완료 목록
              </button>
              <button
                onClick={() => setActiveMenu("거부목록")}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === "거부목록"
                    ? "bg-red-500 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                거부 목록
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* 우측 목록 */}
      <div className="flex-1 max-w-full">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaList className="text-blue-500" />
              {activeMenu.replace(/([A-Z])/g, ' $1').trim()} ({filteredUsers.length}건)
            </h2>
            
            {/* 검색 바 */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 아이디, 전화번호 등으로 검색..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xl">×</span>
                </button>
              )}
            </div>
          </div>

          {/* 검색 결과 안내 */}
          {searchQuery && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">&ldquo;{searchQuery}&rdquo;</span> 검색 결과: {filteredUsers.length}건
              </p>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <FaList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchQuery ? "검색 결과가 없습니다." : "목록이 비어있습니다."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-blue-500 hover:text-blue-600 font-semibold"
                >
                  검색 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.approvalId}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {user.classification} | {user.loginID}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusBadgeColor(user.approvalStatus)}`}>
                      {user.approvalStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <p className="text-gray-600">
                      <span className="font-semibold">전화번호:</span> {user.phnum}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">신청일:</span> {new Date(user.requestedAt).toLocaleDateString()}
                    </p>
                    {user.processedAt && (
                      <p className="col-span-2 text-gray-600">
                        <span className="font-semibold">처리일:</span> {new Date(user.processedAt).toLocaleString()}
                      </p>
                    )}
                    {user.address && (
                      <p className="col-span-2 text-gray-600">
                        <span className="font-semibold">주소:</span> {user.address}
                      </p>
                    )}
                    {user.referralID && (
                      <p className="text-gray-600">
                        <span className="font-semibold">추천인:</span> {user.referralID}
                      </p>
                    )}
                    {user.rejectionReason && (
                      <p className="col-span-2 text-red-600">
                        <span className="font-semibold">거부 사유:</span> {user.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* 심사원 추가 정보 */}
                  {user.classification === "심사원" && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 text-sm space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">은행:</span> {user.bankName || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">계좌번호:</span> {user.account || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">전문분야:</span> {user.expertises || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">교육장소:</span> {user.eduLocation || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">교육날짜:</span> {user.eduDate || "-"}
                      </p>
                    </div>
                  )}

                  {/* 기업 추가 정보 */}
                  {user.classification === "기업" && (
                    <div className="bg-green-50 rounded-lg p-4 mb-4 text-sm space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">이메일:</span> {user.email || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">사업분류:</span> {user.companycls || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">회사소개:</span> {user.introduction || "-"}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">주요판매상품:</span> {user.mainsales || "-"}
                      </p>
                    </div>
                  )}

                  {/* ✅ 액션 버튼: 가입 요청 섹션은 무조건 승인/거부만 */}
                  <div className="flex gap-3">
                    {isRequestSection && (
                      <>
                        <button
                          onClick={() => handleApprove(user.approvalId)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <FaCheckCircle /> 승인
                        </button>
                        <button
                          onClick={() => openRejectModal(user)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <FaTimesCircle /> 거부
                        </button>
                      </>
                    )}

                    {/* 승인 관리 섹션: 상태별 다양한 액션 */}
                    {!isRequestSection && (
                      <>
                        {user.approvalStatus === "승인대기" && (
                          <>
                            <button
                              onClick={() => handleApprove(user.approvalId)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaCheckCircle /> 승인
                            </button>
                            <button
                              onClick={() => openRejectModal(user)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaTimesCircle /> 거부
                            </button>
                          </>
                        )}

                        {user.approvalStatus === "승인" && (
                          <>
                            <button
                              onClick={() => handleCancelApproval(user.approvalId, user.name)}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaUndo /> 승인 취소
                            </button>
                            <button
                              onClick={() => openRejectApprovedModal(user)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaTimesCircle /> 거부로 변경
                            </button>
                          </>
                        )}

                        {user.approvalStatus === "거절" && (
                          <>
                            <button
                              onClick={() => handleCancelRejection(user.approvalId, user.name)}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaUndo /> 거부 취소
                            </button>
                            <button
                              onClick={() => handleApproveRejected(user.approvalId, user.name)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <FaCheckCircle /> 바로 승인
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 거부 사유 입력 모달 (승인대기 → 거절) */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">가입 거부</h2>
            <p className="text-gray-700 mb-6">
              <span className="font-semibold text-gray-900">{selectedUser.name}</span>님의 가입을 거부하시겠습니까?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="거부 사유를 입력해주세요"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                거부 확정
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거부 사유 입력 모달 (승인 → 거절) */}
      {showRejectApprovedModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">승인 취소 및 거부</h2>
            <p className="text-gray-700 mb-6">
              <span className="font-semibold text-gray-900">{selectedUser.name}</span>님의 승인을 취소하고 거부하시겠습니까?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="거부 사유를 입력해주세요"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectApproved}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                거부 확정
              </button>
              <button
                onClick={() => setShowRejectApprovedModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
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
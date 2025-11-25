"use client";

import Button from "../../../components/Button/Button";
import { useEffect, useState, useMemo } from "react";
import { FaUsers, FaSearch, FaChevronDown, FaChevronRight, FaEye } from "react-icons/fa";
import React from "react";

interface Reviewer {
  user_id: number;
  reviewer_id: number;
  name: string;
  loginID: string;
  phnum: string;
  ssn: string;
  address: string;
  bankname: string;
  account: string;
  expertises: string;
  reviewergrade: "심사원보" | "심사위원" | "수석심사위원";
  referralID?: string;
  referralGrade?: string;
  created_at: string;
}

interface ReviewerRaw {
  user_id: number;
  reviewer_id: number;
  name: string;
  loginID: string;
  phnum: string;
  ssn: string;
  address: string;
  bankname: string;
  account: string;
  expertises?: string;
  reviewergrade?: "심사원보" | "심사위원" | "수석심사위원";
  reviewerGrade?: "심사원보" | "심사위원" | "수석심사위원";
  referralID?: string;
  referralGrade?: string;
  created_at: string;
}

interface DownlineMember {
  name: string;
  loginID?: string;
  phnum: string;
  reviewerGrade: string;
  referralGrade: string;
}

// 상세 항목 헬퍼 컴포넌트
const DetailItem: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-indigo-50 px-4 py-2">
      <p className="text-sm font-bold text-indigo-800">{title}</p>
    </div>
    <div className="bg-white px-4 py-3">
      <p className="text-gray-800 break-words whitespace-pre-wrap">{content}</p>
    </div>
  </div>
);

// 상세 정보 모달
interface ReviewerDetailModalProps {
  reviewer: Reviewer | null;
  onClose: () => void;
}

const ReviewerDetailModal: React.FC<ReviewerDetailModalProps> = ({ reviewer, onClose }) => {
  if (!reviewer) return null;

  const maskedSsn = reviewer.ssn ? `${reviewer.ssn.substring(0, 8)}******` : "미입력";

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-2xl font-extrabold text-indigo-700">{reviewer.name} 님의 상세 정보</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <DetailItem title="주소" content={reviewer.address || "미입력"} />
          <DetailItem title="은행/계좌" content={reviewer.bankname && reviewer.account ? `${reviewer.bankname} / ${reviewer.account}` : "미입력"} />
          <DetailItem title="전문 분야" content={reviewer.expertises || "미입력"} />
          <DetailItem title="주민등록번호" content={maskedSsn} />
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <Button label="닫기" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default function ReviewerDashboard() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [originalReviewers, setOriginalReviewers] = useState<Reviewer[]>([]);
  const [filteredReviewers, setFilteredReviewers] = useState<Reviewer[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<"" | "심사원보" | "심사위원" | "수석심사위원">("");
  const [openToggles, setOpenToggles] = useState<Set<string>>(new Set());
  const [downlineData, setDownlineData] = useState<Record<string, DownlineMember[]>>({});
  const [loadingDownline, setLoadingDownline] = useState<Set<string>>(new Set());
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer |ixinull>(null);

  const roleOrder: Record<Reviewer["reviewergrade"], number> = {
    심사원보: 1,
    심사위원: 2,
    수석심사위원: 3,
  };

  // CSV 다운로드 (전화번호, 계좌번호 앞자리 0 보존)
  const exportToCSV = (data: Reviewer[]) => {
    const headers = [
      "이름", "아이디", "전화번호", "직책", "추천인ID", "주소",
      "은행명", "계좌번호", "전문분야", "가입일"
    ];

    const csvContent = data.map(r => [
      r.name,
      r.loginID,
      `="${r.phnum}"`,
      r.reviewergrade,
      r.referralID || "",
      `"${(r.address || "").replace(/"/g, '""')}"`,
      r.bankname || "",
      `="${r.account}"`,
      `"${(r.expertises || "").replace(/"/g, '""')}"`,
      r.created_at,
    ].join(',')).join('\n');

    const finalCsv = '\uFEFF' + headers.join(',') + '\n' + csvContent;

    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `심사원_목록_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const res = await fetch("http://petback.hysu.kr/back/mypage/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classification: "관리자" }),
          credentials: "include",
        });
        if (res.ok) {
          const rawData: ReviewerRaw[] = await res.json();
          const data: Reviewer[] = rawData.map(r => ({
            ...r,
            reviewergrade: r.reviewergrade || r.reviewerGrade || "심사원보",
            expertises: r.expertises || "-",
          }));
          setReviewers(data);
          setOriginalReviewers(data);
          setFilteredReviewers(data);
        } else {
          alert("심사원 목록을 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        alert("서버 연결 오류");
      }
    };
    fetchReviewers();
  }, []);

  useEffect(() => {
    let filtered = reviewers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.loginID.toLowerCase().includes(term) ||
        (r.address && r.address.toLowerCase().includes(term)) ||
        (r.referralID && r.referralID.toLowerCase().includes(term)) ||
        (r.expertises && r.expertises.toLowerCase().includes(term))
      );
    }
    if (selectedGrade) {
      filtered = filtered.filter(r => r.reviewergrade === selectedGrade);
    }
    setFilteredReviewers(filtered);
  }, [searchTerm, selectedGrade, reviewers]);

  const sortedReviewers = useMemo(() => {
    return [...filteredReviewers].sort((a, b) =>
      sortAsc
        ? roleOrder[a.reviewergrade] - roleOrder[b.reviewergrade]
        : roleOrder[b.reviewergrade] - roleOrder[a.reviewergrade]
    );
  }, [filteredReviewers, sortAsc, roleOrder]);

  const { newReviewersCount, totalReviewersCount } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const newCount = reviewers.filter(r => {
      if (!r.created_at) return false;
      const created = new Date(r.created_at + "T00:00:00");
      return created.getFullYear() === currentYear && created.getMonth() === currentMonth;
    }).length;
    return { newReviewersCount: newCount, totalReviewersCount: reviewers.length };
  }, [reviewers]);

  const findUplineName = (referralID?: string) => {
    if (!referralID) return "-";
    const upline = reviewers.find(r => r.loginID === referralID);
    return upline ? upline.name : "본사/관리자";
  };

  const toggleDownline = async (loginID: string) => {
    if (openToggles.has(loginID)) {
      setOpenToggles(prev => { const next = new Set(prev); next.delete(loginID); return next; });
      return;
    }
    if (downlineData[loginID]) {
      setOpenToggles(prev => new Set(prev).add(loginID));
      return;
    }
    setLoadingDownline(prev => new Set(prev).add(loginID));
    try {
      const res = await fetch("http://petback.hysu.kr/back/mypage/reviewer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginID }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDownlineData(prev => ({ ...prev, [loginID]: data }));
        setOpenToggles(prev => new Set(prev).add(loginID));
      }
    } catch (error) {
      console.error("하위 심사원 로드 실패:", error);
    } finally {
      setLoadingDownline(prev => { const next = new Set(prev); next.delete(loginID); return next; });
    }
  };

  const handleRoleChange = (loginID: string, newRole: Reviewer["reviewergrade"]) => {
    setReviewers(prev => prev.map(r => r.loginID === loginID ? { ...r, reviewergrade: newRole } : r));
  };

  const handleSave = async () => {
    const updates = reviewers
      .filter(r => {
        const original = originalReviewers.find(o => o.reviewer_id === r.reviewer_id);
        return original && original.reviewergrade !== r.reviewergrade;
      })
      .map(r => ({ reviewer_id: r.reviewer_id, reviewergrade: r.reviewergrade }));

    if (updates.length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    try {
      const res = await fetch("http://petback.hysu.kr/back/mypage/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
        credentials: "include",
      });
      if (res.ok) {
        alert("모든 변경사항이 성공적으로 저장되었습니다!");
        setOriginalReviewers(reviewers);
        setFilteredReviewers(reviewers);
      } else {
        const text = await res.text();
        alert("저장 실패: " + text);
      }
    } catch (error) {
      console.error("저장 중 오류:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const openModal = (reviewer: Reviewer) => setSelectedReviewer(reviewer);
  const closeModal = () => setSelectedReviewer(null);

  return (
    <div className="flex-1 w-full max-w-[calc(100vw-2rem)] p-4 md:p-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm w-full">

        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FaUsers className="text-indigo-600 w-7 h-7" />
                심사원 관리
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">신규</span>
                  <span className="font-bold text-xl text-red-600">{newReviewersCount}</span>
                </div>
                <span className="text-gray-400">/</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">전체</span>
                  <span className="font-bold text-xl text-gray-900">{totalReviewersCount}</span>
                </div>
              </div>
            </div>
            <Button label={`직책 ${sortAsc ? "오름차순" : "내림차순"}`} onClick={() => setSortAsc(!sortAsc)} />
          </div>
        </div>

        {/* 검색 + 필터 + 다운로드 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 아이디, 주소, 추천인, 전문분야 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as typeof selectedGrade)}
              className="px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="">전체 직책</option>
              <option value="심사원보">심사원보</option>
              <option value="심사위원">심사위원</option>
              <option value="수석심사위원">수석심사위원</option>
            </select>
            <button
              onClick={() => exportToCSV(sortedReviewers)}
              className="px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium whitespace-nowrap flex items-center gap-2"
            >
              CSV/엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 메인 테이블 */}
        <div className="overflow-x-auto w-full">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">아이디</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">전화번호</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">추천인 ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">상위 심사원</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">관리</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">직책</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedReviewers.map((r) => {
                  const isNew = r.created_at && new Date(r.created_at + "T00:00:00").getMonth() === new Date().getMonth() && new Date(r.created_at + "T00:00:00").getFullYear() === new Date().getFullYear();
                  const isOpen = openToggles.has(r.loginID);
                  const downline = downlineData[r.loginID] || [];
                  const isLoading = loadingDownline.has(r.loginID);

                  return (
                    <React.Fragment key={r.loginID}>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleDownline(r.loginID)} className="text-gray-500 hover:text-indigo-600 transition flex-shrink-0">
                              {isLoading ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : isOpen ? <FaChevronDown className="w-3 h-3" /> : <FaChevronRight className="w-3 h-3" />}
                            </button>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-semibold text-gray-900 whitespace-nowrap">{r.name}</span>
                              {isNew && <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded whitespace-nowrap">NEW</span>}
                              {downline.length > 0 && <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded whitespace-nowrap">리더</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{r.loginID}</td>
                        <td className="py-3 px-4 text-xs text-gray-700 whitespace-nowrap">{r.phnum}</td>
                        <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{r.referralID || "-"}</td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span className={`font-medium ${findUplineName(r.referralID) === "-" ? "text-gray-400" : "text-indigo-700"}`}>
                            {findUplineName(r.referralID)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openModal(r)}
                            className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                          >
                            <FaEye className="w-4 h-4" />
                            상세
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={r.reviewergrade}
                            onChange={(e) => handleRoleChange(r.loginID, e.target.value as Reviewer["reviewergrade"])}
                            className="px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="심사원보">심사원보</option>
                            <option value="심사위원">심사위원</option>
                            <option value="수석심사위원">수석심사위원</option>
                          </select>
                        </td>
                      </tr>

                      {/* 하위 심사원 펼침 영역 */}
                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="border-t border-gray-200 bg-gray-50/50 p-6">
                              {downline.length === 0 ? (
                                <p className="text-center py-12 text-gray-500 italic text-lg">아직 하위 심사원이 없습니다</p>
                              ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                  <table className="w-full min-w-[900px] bg-white text-sm">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="text-left py-4 px-6 font-medium text-gray-700">이름</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-700">아이디</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-700">전화번호</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-700">직책</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-700">구분</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {downline.map((member, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50 transition">
                                          <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-gray-900">{member.name}</span>
                                              <span className="px-2.5 py-1 text-xs font-bold text-white bg-gray-500 rounded">일반</span>
                                            </div>
                                          </td>
                                          <td className="py-4 px-6 text-gray-600">{member.loginID || "-"}</td>
                                          <td className="py-4 px-6 text-gray-700">{member.phnum}</td>
                                          <td className="py-4 px-6"><span className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">{member.reviewerGrade}</span></td>
                                          <td className="py-4 px-6"><span className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-full">하위 심사원</span></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <Button label="변경사항 저장" onClick={handleSave} />
        </div>
      </div>

      {/* 상세 모달 */}
      <ReviewerDetailModal reviewer={selectedReviewer} onClose={closeModal} />
    </div>
  );
}
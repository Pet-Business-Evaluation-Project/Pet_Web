"use client";

import Button from "../../../components/Button/Button";
import { useEffect, useState, useMemo } from "react";
import { FaUsers, FaSearch, FaChevronDown, FaChevronRight } from "react-icons/fa";
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
  // DB 업데이트 및 상태 관리용 필드
  reviewergrade: "심사원보" | "심사위원" | "수석심사위원"; 
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

  const roleOrder: Record<Reviewer["reviewergrade"], number> = {
    심사원보: 1,
    심사위원: 2,
    수석심사위원: 3,
  };

  // 데이터 로딩
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
          const rawData: any[] = await res.json();
          
          // ⭐⭐ 수정 1: 초기 로딩 시 서버 필드(예: reviewerGrade)를 
          // 상태 필드(reviewergrade)로 명시적 매핑하여 드롭다운 값 초기화 문제를 해결
          const data: Reviewer[] = rawData.map(r => ({
              ...r,
              // 서버에서 어떤 이름으로 오든, 상태에는 'reviewergrade'로 저장
              reviewergrade: r.reviewergrade || r.reviewerGrade || "심사원보",
          })) as Reviewer[]; // 안전을 위해 타입 캐스팅
          
          setReviewers(data);
          setOriginalReviewers(data); // 원본 저장
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

  // 검색 + 필터링
  useEffect(() => {
    let filtered = reviewers;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.loginID.toLowerCase().includes(term) ||
          (r.address && r.address.toLowerCase().includes(term)) ||
          (r.referralID && r.referralID.toLowerCase().includes(term))
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter((r) => r.reviewergrade === selectedGrade);
    }

    setFilteredReviewers(filtered);
  }, [searchTerm, selectedGrade, reviewers]);

  const sortedReviewers = useMemo(() => {
    return [...filteredReviewers].sort((a, b) =>
      sortAsc
        ? roleOrder[a.reviewergrade] - roleOrder[b.reviewergrade]
        : roleOrder[b.reviewergrade] - roleOrder[a.reviewergrade]
    );
  }, [filteredReviewers, sortAsc]);

  const { newReviewersCount, totalReviewersCount } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const newCount = reviewers.filter((r) => {
      if (!r.created_at) return false;
      const created = new Date(r.created_at + "T00:00:00");
      return created.getFullYear() === currentYear && created.getMonth() === currentMonth;
    }).length;

    return { newReviewersCount: newCount, totalReviewersCount: reviewers.length };
  }, [reviewers]);

  const findUplineName = (referralID?: string) => {
    if (!referralID) return "-";
    const upline = reviewers.find((r) => r.loginID === referralID);
    return upline ? upline.name : "본사/관리자";
  };

  const toggleDownline = async (loginID: string) => {
    if (openToggles.has(loginID)) {
      setOpenToggles((prev) => {
        const next = new Set(prev);
        next.delete(loginID);
        return next;
      });
      return;
    }

    if (downlineData[loginID]) {
      setOpenToggles((prev) => new Set(prev).add(loginID));
      return;
    }

    setLoadingDownline((prev) => new Set(prev).add(loginID));
    try {
      const res = await fetch("http://petback.hysu.kr/back/mypage/reviewer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginID }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDownlineData((prev) => ({ ...prev, [loginID]: data }));
        setOpenToggles((prev) => new Set(prev).add(loginID));
      }
    } catch (error) {
      console.error("하위 심사원 로드 실패:", error);
    } finally {
      setLoadingDownline((prev) => {
        const next = new Set(prev);
        next.delete(loginID);
        return next;
      });
    }
  };

  const handleRoleChange = (loginID: string, newRole: Reviewer["reviewergrade"]) => {
    setReviewers((prev) =>
      // 이전 수정: reviewerGrade (대문자 G) 대신 reviewergrade (소문자 g)를 사용하여 상태를 업데이트
      prev.map((r) => (r.loginID === loginID ? { ...r, reviewergrade: newRole } : r))
    );
  };

  // 변경된 것만 저장
  const handleSave = async () => {
    const updates = reviewers
      .filter((r) => {
        const original = originalReviewers.find((o) => o.reviewer_id === r.reviewer_id);
        // 원본과 현재 상태의 'reviewergrade' (소문자 g) 필드를 비교
        return original && original.reviewergrade !== r.reviewergrade;
      })
      .map((r) => ({
        reviewer_id: r.reviewer_id,
        // 백엔드로 전송 시 'reviewergrade' (소문자 g)를 사용
        reviewergrade: r.reviewergrade,
      }));

    if (updates.length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    console.log("전송할 데이터:", JSON.stringify({ updates }, null, 2));

    try {
      const res = await fetch("http://petback.hysu.kr/back/mypage/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
        credentials: "include",
      });

      const text = await res.text();
      console.log("응답 상태:", res.status);
      console.log("응답 내용:", text);

      if (res.ok) {
        alert("모든 변경사항이 성공적으로 저장되었습니다!");
        
        // 이전 수정: 새로고침 대신 상태를 업데이트하여 즉시 반영
        setOriginalReviewers(reviewers);
        setFilteredReviewers(reviewers); // 필터링된 목록도 최신으로 업데이트
      } else {
        alert("저장 실패: " + text);
      }
    } catch (error) {
      console.error("저장 중 오류:", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

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

        {/* 검색 + 필터 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 아이디, 주소, 추천인 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as any)}
              className="px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="">전체 직책</option>
              <option value="심사원보">심사원보</option>
              <option value="심사위원">심사위원</option>
              <option value="수석심사위원">수석심사위원</option>
            </select>
          </div>
        </div>

        {/* 메인 테이블 */}
        <div className="overflow-x-auto w-full">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">아이디</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">전화번호</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">주소</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">은행/계좌</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">추천인 ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">상위 심사원</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm whitespace-nowrap">직책</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedReviewers.map((r) => {
                  const isNew =
                    r.created_at &&
                    new Date(r.created_at + "T00:00:00").getMonth() === new Date().getMonth() &&
                    new Date(r.created_at + "T00:00:00").getFullYear() === new Date().getFullYear();
                  const isOpen = openToggles.has(r.loginID);
                  const downline = downlineData[r.loginID] || [];
                  const isLoading = loadingDownline.has(r.loginID);

                  return (
                    <React.Fragment key={r.loginID}>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleDownline(r.loginID)}
                              className="text-gray-500 hover:text-indigo-600 transition flex-shrink-0"
                            >
                              {isLoading ? (
                                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              ) : isOpen ? (
                                <FaChevronDown className="w-3 h-3" />
                              ) : (
                                <FaChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-semibold text-gray-900 whitespace-nowrap">{r.name}</span>
                              {isNew && (
                                <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded whitespace-nowrap">
                                  NEW
                                </span>
                              )}
                              {downline.length > 0 && (
                                <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded whitespace-nowrap">
                                  리더
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{r.loginID}</td>
                        <td className="py-3 px-4 text-xs text-gray-700 whitespace-nowrap">{r.phnum}</td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-[200px] break-words">{r.address || "-"}</td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-[180px] break-words">
                          {r.bankname && r.account ? `${r.bankname} / ${r.account}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{r.referralID || "-"}</td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span className={`font-medium ${findUplineName(r.referralID) === "-" ? "text-gray-400" : "text-indigo-700"}`}>
                            {findUplineName(r.referralID)}
                          </span>
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

                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="border-t border-gray-200">
                              <div className="bg-gray-50/50">
                                <div className="p-6">
                                  {downline.length === 0 ? (
                                    <p className="text-center py-12 text-gray-500 italic text-lg">
                                      아직 하위 심사원이 없습니다
                                    </p>
                                  ) : (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                      <table className="w-full min-w-[900px] bg-white text-sm leading-tight">
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
                                                  <span className="font-semibold text-gray-900 whitespace-nowrap">
                                                    {member.name}
                                                  </span>
                                                  <span className="px-2.5 py-1 text-xs font-bold text-white bg-gray-500 rounded flex-shrink-0">
                                                    일반
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                                                {member.loginID || "-"}
                                              </td>
                                              <td className="py-4 px-6 text-gray-700 whitespace-nowrap">
                                                {member.phnum}
                                              </td>
                                              <td className="py-4 px-6">
                                                <span className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                                                  {member.reviewerGrade}
                                                </span>
                                              </td>
                                              <td className="py-4 px-6">
                                                <span className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                                                  하위 심사원
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
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
    </div>
  );
}
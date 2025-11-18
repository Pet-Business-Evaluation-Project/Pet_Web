"use client";

import Button from "../../../components/Button/Button";
import { useEffect, useState, useMemo } from "react";
import { FaUsers, FaSearch } from "react-icons/fa";

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
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
  referralID?: string;
  created_at: string; 
}

export default function ReviewerDashboard() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [filteredReviewers, setFilteredReviewers] = useState<Reviewer[]>([]);
  const [sortAsc, setSortAsc] = useState(true);

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<
    "" | "심사원보" | "심사위원" | "수석심사위원"
  >("");

  // 직책 순서
  const roleOrder: Record<Reviewer["reviewerGrade"], number> = {
    심사원보: 1,
    심사위원: 2,
    수석심사위원: 3,
  };

  // 백엔드에서 심사원 목록 가져오기
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
          const data = await res.json();
          setReviewers(data);
          setFilteredReviewers(data);
        } else {
          alert("데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchReviewers();
  }, []);

  // 검색 + 필터링 로직
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
      filtered = filtered.filter((r) => r.reviewerGrade === selectedGrade);
    }

    setFilteredReviewers(filtered);
  }, [searchTerm, selectedGrade, reviewers]);

  // 정렬된 리스트
  const sortedReviewers = useMemo(() => {
    return [...filteredReviewers].sort((a, b) =>
      sortAsc
        ? roleOrder[a.reviewerGrade] - roleOrder[b.reviewerGrade]
        : roleOrder[b.reviewerGrade] - roleOrder[a.reviewerGrade]
    );
  }, [filteredReviewers, sortAsc]);

  // 신규 심사원 계산 (이번 달 가입자)
  const { newReviewersCount, totalReviewersCount } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const newCount = reviewers.filter((r) => {
      if (!r.created_at) return false;
      const created = new Date(r.created_at + "T00:00:00"); // LocalDate → Date 변환 보장
      return (
        created.getFullYear() === currentYear &&
        created.getMonth() === currentMonth
      );
    }).length;

    return {
      newReviewersCount: newCount,
      totalReviewersCount: reviewers.length,
    };
  }, [reviewers]);

  // 직책 변경 핸들러
  const handleRoleChange = (loginID: string, newRole: Reviewer["reviewerGrade"]) => {
    setReviewers((prev) =>
      prev.map((r) => (r.loginID === loginID ? { ...r, reviewerGrade: newRole } : r))
    );
  };

  // 저장 버튼
  const handleSave = async () => {
    try {
      const payload = reviewers.map((r) => ({
        reviewer_id: r.reviewer_id,
        reviewergrade: r.reviewerGrade,
      }));

      const res = await fetch("http://petback.hysu.kr/back/mypage/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: payload }),
        credentials: "include",
      });

      if (res.ok) {
        alert("직책 변경이 성공적으로 저장되었습니다.");
      } else {
        alert("직책 변경 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex-1 max-w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
        {/* 헤더: 제목 + 신규/전체 카운트 + 정렬 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FaUsers className="text-blue-600 w-8 h-8" />
              심사원 관리
            </h2>

            {/* 신규 / 전체 카운트 */}
            <div className="flex items-center gap-3 text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 rounded-xl border border-blue-200">
              <span className="text-gray-600">신규</span>
              <span className="text-2xl text-blue-600">{newReviewersCount}</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-600">전체</span>
              <span className="text-2xl text-indigo-600">{totalReviewersCount}</span>
              {newReviewersCount > 0 && (
                <span className="ml-3 text-xs bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                  {new Date().getMonth() + 1}월 신규
                </span>
              )}
            </div>
          </div>

          <Button
            label={`직책 ${sortAsc ? "오름차순" : "내림차순"}`}
            onClick={() => setSortAsc(!sortAsc)}
          />
        </div>

        {/* 검색 + 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 아이디, 주소, 추천인으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) =>
              setSelectedGrade(
                e.target.value as "" | "심사원보" | "심사위원" | "수석심사위원"
              )
            }
            className="px-6 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 직책</option>
            <option value="심사원보">심사원보</option>
            <option value="심사위원">심사위원</option>
            <option value="수석심사위원">수석심사위원</option>
          </select>
        </div>

        {/* 검색 결과 안내 */}
        {(searchTerm || selectedGrade) && (
          <div className="text-sm text-gray-600 mb-4 bg-gray-50 px-4 py-2 rounded-lg">
            검색 결과: <strong>{sortedReviewers.length}명</strong>
            {searchTerm && ` (검색어: "${searchTerm}")`}
            {selectedGrade && ` (직책: ${selectedGrade})`}
          </div>
        )}

        {/* 테이블 */}
        <div className="overflow-x-auto border rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
              <tr className="text-left border-b-2 border-gray-300">
                <th className="py-4 px-4 font-semibold text-gray-700">이름</th>
                <th className="py-4 px-4 font-semibold text-gray-700">아이디</th>
                <th className="py-4 px-4 font-semibold text-gray-700">전화번호</th>
                <th className="py-4 px-4 font-semibold text-gray-700">주소</th>
                <th className="py-4 px-4 font-semibold text-gray-700">은행/계좌</th>
                <th className="py-4 px-4 font-semibold text-gray-700">추천인</th>
                <th className="py-4 px-4 font-semibold text-gray-700">직책</th>
              </tr>
            </thead>
            <tbody>
              {sortedReviewers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500 text-lg">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedReviewers.map((r) => {
                  const isNew =
                    r.created_at &&
                    new Date(r.created_at + "T00:00:00").getFullYear() ===
                      new Date().getFullYear() &&
                    new Date(r.created_at + "T00:00:00").getMonth() ===
                      new Date().getMonth();

                  return (
                    <tr
                      key={r.loginID}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          {r.name}
                          {isNew && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-md animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{r.loginID}</td>
                      <td className="py-4 px-4">{r.phnum}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {r.address || "-"}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {r.bankname && r.account
                          ? `${r.bankname} / ${r.account}`
                          : "-"}
                      </td>
                      <td className="py-4 px-4">{r.referralID || "-"}</td>
                      <td className="py-4 px-4">
                        <select
                          value={r.reviewerGrade}
                          onChange={(e) =>
                            handleRoleChange(
                              r.loginID,
                              e.target.value as Reviewer["reviewerGrade"]
                            )
                          }
                          className="border rounded-lg px-4 py-2 w-full text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="심사원보">심사원보</option>
                          <option value="심사위원">심사위원</option>
                          <option value="수석심사위원">수석심사위원</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 flex justify-end">
          <Button label="변경사항 저장" onClick={handleSave} />
        </div>
      </div>
    </div>
  );
}
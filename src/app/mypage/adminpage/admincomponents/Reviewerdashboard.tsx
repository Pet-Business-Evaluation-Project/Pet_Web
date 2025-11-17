"use client";

import Button from "../../../components/Button/Button";
import { useEffect, useState } from "react";
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
          setFilteredReviewers(data); // 초기값도 설정
        } else {
          alert("데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchReviewers();
  }, []);

  // 검색 + 필터링 로직 (searchTerm 또는 selectedGrade 변경 시 실행)
  useEffect(() => {
    let filtered = reviewers;

    // 1. 검색어 필터링 (이름, 아이디, 주소, 추천인)
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

    // 2. 직책 필터링
    if (selectedGrade) {
      filtered = filtered.filter((r) => r.reviewerGrade === selectedGrade);
    }

    setFilteredReviewers(filtered);
  }, [searchTerm, selectedGrade, reviewers]);

  // 정렬 적용 (filteredReviewers 기준으로 정렬)
  const sortedReviewers = [...filteredReviewers].sort((a, b) =>
    sortAsc
      ? roleOrder[a.reviewerGrade] - roleOrder[b.reviewerGrade]
      : roleOrder[b.reviewerGrade] - roleOrder[a.reviewerGrade]
  );

  // 직책 변경
  const handleRoleChange = (loginID: string, newRole: Reviewer["reviewerGrade"]) => {
    setReviewers((prev) =>
      prev.map((r) => (r.loginID === loginID ? { ...r, reviewerGrade: newRole } : r))
    );
  };

  // 저장 버튼 클릭
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaUsers className="text-blue-500 w-6 h-6" /> 심사원 관리
          </h2>
          <Button
            label={`직책 ${sortAsc ? "오름차순" : "내림차순"}`}
            onClick={() => setSortAsc(!sortAsc)}
          />
        </div>

        {/* 검색 + 필터 영역 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 아이디, 주소, 추천인으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) =>
              setSelectedGrade(
                e.target.value as "" | "심사원보" | "심사위원" | "수석심사위원"
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 직책</option>
            <option value="심사원보">심사원보</option>
            <option value="심사위원">심사위원</option>
            <option value="수석심사위원">수석심사위원</option>
          </select>
        </div>

        {/* 검색 결과 안내 */}
        {searchTerm || selectedGrade ? (
          <div className="text-sm text-gray-600 mb-3">
            검색 결과: {sortedReviewers.length}명
            {searchTerm && ` (검색어: "${searchTerm}")`}
            {selectedGrade && ` (직책: ${selectedGrade})`}
          </div>
        ) : null}

        {/* 테이블 */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] border rounded">
          <table className="w-full table-fixed border-collapse table-auto">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left border-b border-gray-300">
                <th className="py-3 px-3 min-w-[120px]">이름</th>
                <th className="py-3 px-3 min-w-[120px]">아이디</th>
                <th className="py-3 px-3 min-w-[120px]">전화번호</th>
                <th className="py-3 px-3 min-w-[200px]">주소</th>
                <th className="py-3 px-3 min-w-[160px]">은행/계좌</th>
                <th className="py-3 px-3 min-w-[120px]">추천인</th>
                <th className="py-3 px-3 min-w-[140px]">직책</th>
              </tr>
            </thead>
            <tbody>
              {sortedReviewers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedReviewers.map((r) => (
                  <tr key={r.loginID} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{r.name}</td>
                    <td className="py-3 px-3 text-gray-600">{r.loginID}</td>
                    <td className="py-3 px-3">{r.phnum}</td>
                    <td className="py-3 px-3 text-sm">{r.address || "-"}</td>
                    <td className="py-3 px-3 text-sm">
                      {r.bankname && r.account
                        ? `${r.bankname} / ${r.account}`
                        : "-"}
                    </td>
                    <td className="py-3 px-3">{r.referralID || "-"}</td>
                    <td className="py-3 px-3">
                      <select
                        value={r.reviewerGrade}
                        onChange={(e) =>
                          handleRoleChange(
                            r.loginID,
                            e.target.value as Reviewer["reviewerGrade"]
                          )
                        }
                        className="border rounded px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="심사원보">심사원보</option>
                        <option value="심사위원">심사위원</option>
                        <option value="수석심사위원">수석심사위원</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6 flex justify-end">
          <Button label="변경사항 저장" onClick={handleSave} />
        </div>
      </div>
    </div>
  );
}
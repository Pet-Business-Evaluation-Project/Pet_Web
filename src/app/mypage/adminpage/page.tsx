"use client";

import Button from "../../components/Button/Button";
import { useEffect, useState } from "react";
import { FaUserCircle, FaUsers } from "react-icons/fa";
import Image from "next/image"; // 💡 추가: Image 컴포넌트 import

interface Reviewer {
  user_id: number;
  reviewer_id: number;
  loginID: string;
  name: string;
  phnum: string;
  ssn: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
  referralID?: string;
}

export default function AdminPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const admin = {
    name: "관리자",
    grade: "Admin",
    avatar: "/img/profile.png",
  };

  // 직책 순서
  const roleOrder: Record<Reviewer["reviewerGrade"], number> = {
    "심사원보": 1,
    "심사위원": 2,
    "수석심사위원": 3,
  };

  // 백엔드에서 심사원 목록 가져오기
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const res = await fetch("https://www.kcci.co.kr/back/mypage/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classification: "관리자" }),
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setReviewers(data);
        } else {
          alert("데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchReviewers();
  }, []);

  // 직책 변경
  const handleRoleChange = (loginID: string, newRole: Reviewer["reviewerGrade"]) => {
    setReviewers((prev) =>
      prev.map((r) => (r.loginID === loginID ? { ...r, reviewerGrade: newRole } : r))
    );
  };

  // 정렬 적용
  const sortedReviewers = [...reviewers].sort((a, b) =>
    sortAsc
      ? roleOrder[a.reviewerGrade] - roleOrder[b.reviewerGrade]
      : roleOrder[b.reviewerGrade] - roleOrder[a.reviewerGrade]
  );

  // 저장 버튼 클릭
  const handleSave = async () => {
    try {
      const payload = reviewers.map((r) => ({
        reviewer_id: r.reviewer_id,
        reviewergrade: r.reviewerGrade,
      }));

      const res = await fetch("https://www.kcci.co.kr/back/mypage/admin/update", {
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
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 관리자 프로필 */}
      <div className="flex flex-col items-center md:items-start w-full md:w-64 bg-blue-100 rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-4 border-blue-500 relative overflow-hidden">
          {admin.avatar ? (
            // 💡 수정: <img> 태그 대신 <Image /> 컴포넌트 사용
            <Image
              src={admin.avatar}
              alt="관리자 프로필"
              fill // 부모 div의 크기에 맞춤
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw" // 반응형 크기 명시
            />
          ) : (
            <FaUserCircle className="w-full h-full text-gray-400" />
          )}
        </div>
        <p className="text-lg font-semibold text-center md:text-left">{admin.name}</p>
        <p className="text-gray-600 text-center md:text-left">{admin.grade}</p>

        {/* 심사원 관리 버튼 */}
        <Button
          label="심사원 관리"
          onClick={() => setShowTable(!showTable)}
          className="mt-4 w-full"
        />
      </div>

      {/* 우측 심사원 관리 테이블 */}
      {showTable && (
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

            {/* 테이블 스크롤 */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] border rounded">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-300">
                    <th className="py-2 px-3 min-w-[120px]">이름</th>
                    <th className="py-2 px-3 min-w-[120px]">전화번호</th>
                    <th className="py-2 px-3 min-w-[120px]">추천인</th>
                    <th className="py-2 px-3 min-w-[140px]">직책</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReviewers.map((r) => (
                    <tr key={r.loginID} className="border-b border-gray-200">
                      <td className="py-2 px-3">{r.name}</td>
                      <td className="py-2 px-3">{r.phnum}</td>
                      <td className="py-2 px-3">{r.referralID || "-"}</td>
                      <td className="py-2 px-3">
                        <select
                          value={r.reviewerGrade}
                          onChange={(e) =>
                            handleRoleChange(
                              r.loginID,
                              e.target.value as Reviewer["reviewerGrade"]
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        >
                          <option value="심사원보">심사원보</option>
                          <option value="심사위원">심사위원</option>
                          <option value="수석심사위원">수석심사위원</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 저장 버튼 */}
            <div className="mt-4 flex justify-end">
              <Button label="저장" onClick={handleSave} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
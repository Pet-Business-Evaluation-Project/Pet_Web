"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaUsers } from "react-icons/fa";
import Button from "../../components/Button/Button";

interface ReviewerInfo {
  loginID: string;
  name: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
}

interface OrgMember {
  name: string;
  phnum: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
}

export default function ReviewerPage() {
  const [userId, setUserId] = useState<number | null>(null); // 로그인 후 userId
  const [reviewer, setReviewer] = useState<ReviewerInfo | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [showOrg, setShowOrg] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const roleOrder: Record<OrgMember["reviewerGrade"], number> = {
    "심사원보": 1,
    "심사위원": 2,
    "수석심사위원": 3,
  };

  // 🔹 로그인 정보에서 userId 가져오기 (클라이언트 사이드)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserId(user.userId);
        } catch (e) {
          console.error("localStorage user parsing error:", e);
        }
      } else {
        setUserId(30); // 테스트용: 로그인 안 되어 있을 때
      }
    }
  }, []);

  // 🔹 DB에서 심사원 정보 불러오기
  useEffect(() => {
    if (!userId) return;

    const fetchReviewer = async () => {
      try {
        const res = await fetch("http://petback.hysu.kr/back/mypage/reviewer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (res.ok) {
          const data: ReviewerInfo = await res.json();
          setReviewer(data);
        } else {
          alert("심사원 정보를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        alert("심사원 정보 불러오기 중 오류가 발생했습니다.");
      }
    };

    fetchReviewer();
  }, [userId]);

  // 🔹 조직 구성원 가져오기 및 토글
  const toggleOrgMembers = async () => {
    if (!reviewer) return;

    if (showOrg) {
      setShowOrg(false);
      return;
    }

    try {
      const res = await fetch("http://petback.hysu.kr/back/mypage/reviewer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginID: reviewer.loginID }),
      });

      if (res.ok) {
        const data: OrgMember[] = await res.json();
        setOrgMembers(data);
        setShowOrg(true);
      } else {
        alert("조직 구성원을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("조직 구성원 불러오기 중 오류가 발생했습니다.");
    }
  };

  if (!reviewer) return <div className="p-6">불러오는 중...</div>;

  const sortedOrgMembers = [...orgMembers].sort((a, b) =>
    sortAsc
      ? roleOrder[a.reviewerGrade] - roleOrder[b.reviewerGrade]
      : roleOrder[b.reviewerGrade] - roleOrder[a.reviewerGrade]
  );

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 프로필 */}
      <div className="flex flex-col items-center md:items-start w-full md:w-64 bg-yellow-100 rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 relative overflow-hidden">
          <FaUserCircle className="w-full h-full text-gray-400" />
        </div>
        <p className="text-lg font-semibold text-center md:text-left">{reviewer.name}</p>
        <p className="text-gray-600 text-center md:text-left">{reviewer.reviewerGrade}</p>

        <div className="flex flex-col gap-3 w-full mt-4">
          <Button label="개인정보 수정" onClick={() => alert("개인정보 수정 테스트")} />
        </div>
      </div>

      {/* 우측 기능: 조직 관리 */}
      <div className="flex-1 flex flex-col gap-6">
        <div
          className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 cursor-pointer"
          onClick={toggleOrgMembers}
        >
          <FaUsers className="text-yellow-500 w-6 h-6 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-1">조직 관리</h2>
            <p className="text-gray-500">나의 조직 확인 및 관리 가능</p>
          </div>
        </div>

        {showOrg && (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 overflow-x-auto mt-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaUsers className="text-yellow-500 w-6 h-6" /> 나의 조직 구성원
            </h2>
            <table className="w-full min-w-[500px] border-collapse table-auto">
              <thead>
                <tr className="text-left border-b border-gray-300">
                  <th className="py-2 px-3">이름</th>
                  <th className="py-2 px-3">전화번호</th>
                  <th
                    className="py-2 px-3 cursor-pointer"
                    onClick={() => setSortAsc(!sortAsc)}
                  >
                    직책 {sortAsc ? "▲" : "▼"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOrgMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-gray-500 text-center">
                      조직 구성원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedOrgMembers.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 px-3">{m.name}</td>
                      <td className="py-2 px-3">{m.phnum}</td>
                      <td className="py-2 px-3">{m.reviewerGrade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}


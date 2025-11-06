"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaUsers } from "react-icons/fa";
import Button from "../../components/Button/Button";

interface ReviewerInfo {
  loginID: string;
  name: string;
  phnum: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
}

interface OrgMember {
  name: string;
  phnum: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
}

export default function ReviewerPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [reviewer, setReviewer] = useState<ReviewerInfo | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [showOrg, setShowOrg] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  // 개인정보 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhnum, setEditPhnum] = useState("");
  const [editingField, setEditingField] = useState<"name" | "phnum" | null>(null);

  const roleOrder: Record<OrgMember["reviewerGrade"], number> = {
    "심사원보": 1,
    "심사위원": 2,
    "수석심사위원": 3,
  };

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
        setUserId(30); 
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchReviewer = async () => {
      try {
        const res = await fetch("https://test.kcci.co.kr/back/mypage/reviewer", {
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

  const toggleOrgMembers = async () => {
    if (!reviewer) return;

    if (showOrg) {
      setShowOrg(false);
      return;
    }

    try {
      const res = await fetch("https://test.kcci.co.kr/back/mypage/reviewer/invite", {
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

  const openEditModal = () => {
    if (!reviewer) return;
    setEditName(reviewer.name);
    setEditPhnum(reviewer.phnum || "");
    setEditingField(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!userId) return;

    try {
      const res = await fetch("https://test.kcci.co.kr/back/mypage/reviewer/infoUpdate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: editName,
          phnum: editPhnum,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewer((prev) =>
          prev ? { ...prev, name: data.name, phnum: data.phnum } : prev
        );
        
        // ✅ 이 한 줄만 추가! Header가 자동으로 업데이트됨
        window.dispatchEvent(new Event("userUpdated"));
        
        alert("개인정보가 성공적으로 수정되었습니다!");
        setShowEditModal(false);
      } else {
        alert("수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("정보 수정 중 오류가 발생했습니다.");
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
          <Button label="개인정보 수정" onClick={openEditModal} />
        </div>
      </div>

      {/* 우측 조직 관리 */}
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

      {/* 개인정보 수정 모달 */}
      {showEditModal && reviewer && (
        <div className="fixed inset-0 flex items-center justify-center z-50
                            bg-[rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">회원 정보</h2>

            {/* 이름 */}
            <div className="flex items-center justify-between mb-4">
              {editingField === "name" ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded-lg p-2 w-full mr-2"
                />
              ) : (
                <span className="text-gray-700 font-medium">{editName}</span>
              )}
              <Button
                label={editingField === "name" ? "완료" : "수정"}
                onClick={() =>
                  setEditingField(editingField === "name" ? null : "name")
                }
                className="text-sm px-3 py-1"
              />
            </div>

            {/* 전화번호 */}
            <div className="flex items-center justify-between mb-6">
              {editingField === "phnum" ? (
                <input
                  type="text"
                  value={editPhnum}
                  onChange={(e) => setEditPhnum(e.target.value)}
                  className="border rounded-lg p-2 w-full mr-2"
                />
              ) : (
                <span className="text-gray-700 font-medium">{editPhnum}</span>
              )}
              <Button
                label={editingField === "phnum" ? "완료" : "수정"}
                onClick={() =>
                  setEditingField(editingField === "phnum" ? null : "phnum")
                }
                className="text-sm px-3 py-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button label="취소" onClick={() => setShowEditModal(false)} />
              <Button label="저장" onClick={handleSaveEdit} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
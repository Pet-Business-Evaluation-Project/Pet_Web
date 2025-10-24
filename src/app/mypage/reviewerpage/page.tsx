"use client";

import { useRouter } from "next/navigation";
import Button from "../../components/Button/Button";
import { useState } from "react";
import { FaUserCircle, FaUsers, FaClipboardList } from "react-icons/fa";

// 조직원 타입
interface Member {
  name: string;
  role: "심사원보" | "심사위원" | "수석심사위원";
  leader?: string;
}

// 테스트용 조직 데이터
const allMembers: Member[] = [
  { name: "김철수", role: "심사원보", leader: "홍길동" },
  { name: "이영희", role: "심사원보", leader: "홍길동" },
  { name: "홍길동", role: "심사위원", leader: "최수석" },
  { name: "박민수", role: "심사위원", leader: "최수석" },
  { name: "최수석", role: "수석심사위원" },
];

export default function ReviewerPage() {
  const reviewer = {
    name: "홍길동",
    grade: "심사위원",
    avatar: "/img/profile.png",
  };

  const [showOrg, setShowOrg] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // 특정 리더의 팀원 가져오기
  const getTeam = (leaderName: string): Member[] =>
    allMembers.filter((m) => m.leader === leaderName);

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "심사원보":
        return "text-blue-500";
      case "심사위원":
        return "text-green-500";
      case "수석심사위원":
        return "text-red-500";
      default:
        return "text-gray-700";
    }
  };

  // 하위 조직 수 계산
  const countSubordinates = (leaderName: string): number => {
    const team = getTeam(leaderName);
    let count = team.length;
    team.forEach((m) => {
      count += countSubordinates(m.name);
    });
    return count;
  };

  // 트리 렌더링
  const renderTeam = (leaderName: string) => {
    const team = getTeam(leaderName);
    if (team.length === 0) return null;

    return (
      <ul className="pl-4">
        {team.map((member) => (
          <li key={member.name} className="py-1">
            <div
              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                highlighted === member.name ? "bg-yellow-200" : ""
              }`}
              onClick={() => setHighlighted(member.name)}
            >
              <div
                className={`font-medium ${getRoleColor(member.role)}`}
                onClick={() =>
                  getTeam(member.name).length && toggleExpand(member.name)
                }
              >
                {member.name} ({member.role})
              </div>
              {getTeam(member.name).length > 0 && (
                <div
                  className="ml-2 text-gray-400"
                  onClick={() => toggleExpand(member.name)}
                >
                  {expanded[member.name] ? "▼" : "▶"} ({countSubordinates(member.name)})
                </div>
              )}
            </div>
            {expanded[member.name] && renderTeam(member.name)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 프로필 */}
      <div className="flex flex-col items-center md:items-start w-full md:w-64 bg-yellow-100 rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 relative overflow-hidden">
          {reviewer.avatar ? (
            <img
              src={reviewer.avatar}
              alt="리뷰어 프로필"
              className="w-full h-full object-cover"
            />
          ) : (
            <FaUserCircle className="w-full h-full text-gray-400" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 rounded-full">
            <span className="text-white text-xs font-semibold text-center px-1">
              리뷰어 프로필
            </span>
          </div>
        </div>
        <p className="text-lg font-semibold text-center md:text-left">{reviewer.name}</p>
        <p className="text-gray-600 text-center md:text-left">{reviewer.grade} 등급</p>

        <div className="flex flex-col gap-3 w-full mt-4">
          <Button label="개인정보 수정" onClick={() => alert("개인정보 수정 테스트")} />
          <Button label="나의 조직 관리" onClick={() => setShowOrg(!showOrg)} />
        </div>
      </div>

      {/* 우측 기능 + 조직 트리 */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
          <FaUsers className="text-yellow-500 w-6 h-6 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-1">조직 관리</h2>
            <p className="text-gray-500">나의 조직 확인 및 관리 가능</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
          <FaClipboardList className="text-yellow-500 w-6 h-6 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-1">리뷰 현황</h2>
            <p className="text-gray-500">리뷰 진행 상태 및 통계 확인</p>
          </div>
        </div>

        {/* 조직 트리 */}
        {showOrg && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">내 조직 구성원</h2>
            {renderTeam(reviewer.name) || (
              <p className="text-gray-500">속한 조직원이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
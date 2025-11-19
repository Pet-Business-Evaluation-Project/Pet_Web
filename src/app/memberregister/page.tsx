"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface SignStart {
  signstartId: number;
  signId: number;
  reviewerId: number;
  signtype?: string;
  membergrade?: string;
  signstate?: string;
  signdate?: string;
  effectivedate?: string;
  reviewcomplete?: string;
  affairdo?: string;
  signcount?: number;
}

export default function MemberRegister() {
  const [signs, setSigns] = useState<SignStart[]>([]);
  const [currentSign, setCurrentSign] = useState<SignStart | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  
  // 새 상태: 심사원 목록 모달
  const [reviewersModalOpen, setReviewersModalOpen] = useState(false);
  const [reviewersList, setReviewersList] = useState<{ reviewerId: number; signcount?: number }[]>([]);

  const signtypeOptions = ['동물기업인증','우수제품인증','친환경기업인증','동물복지기업인증','동물복지제품인증'];
  const signstateOptions = ['보완','부적합','완료'];
  const reviewcompleteOptions = ['진행중','심사완료'];
  const affairdoOptions = ['시행','미시행'];

  const membergradeMap: Record<string, string> = {
    level1: "1단계",
    level2: "2단계",
    level3: "3단계",
    level4: "4단계",
    level5: "5단계"
  };

  const reverseMembergradeMap: Record<string, string> = {
    "1단계": "level1",
    "2단계": "level2",
    "3단계": "level3",
    "4단계": "level4",
    "5단계": "level5"
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      else setError("로그인 후 이용 가능합니다.");
    }
  }, []);

  const fetchMySigns = async () => {
    if (!currentUser?.id) return;
    try {
      if (currentUser.id === 117) {
        const res = await axios.get<SignStart[]>(
          "http://petback.hysu.kr/back/signstart/all",
          { headers: { "X-USER-ID": currentUser.id } }
        );
        const uniqueMap = new Map<number, SignStart>();
        res.data.forEach(sign => {
          if (!uniqueMap.has(sign.signId)) uniqueMap.set(sign.signId, sign);
        });
        setSigns(Array.from(uniqueMap.values()));
      } else {
        const reviewerRes = await axios.post(
          "http://petback.hysu.kr/back/user/reviwerinfo",
          { userId: currentUser.id },
          { headers: { "Content-Type": "application/json" } }
        );
        const myReviewerId: number = reviewerRes.data.reviewerId;

        const allSignsRes = await axios.get<SignStart[]>(
          "http://petback.hysu.kr/back/signstart/all",
          { headers: { "X-USER-ID": currentUser.id } }
        );
        const mySigns = allSignsRes.data.filter(sign => sign.reviewerId === myReviewerId);
        const uniqueMap = new Map<number, SignStart>();
        mySigns.forEach(sign => {
          if (!uniqueMap.has(sign.signId)) uniqueMap.set(sign.signId, sign);
        });
        setSigns(Array.from(uniqueMap.values()));
      }
    } catch (err) {
      console.error(err);
      setError("인증 정보를 불러오는데 실패했습니다.");
    }
  };

  useEffect(() => { fetchMySigns(); }, [currentUser]);

  const handleClick = async (sign: SignStart) => {
    if (!currentUser?.id) return;
    try {
      if (currentUser.id !== 117) {
        const reviewerRes = await axios.post(
          "http://petback.hysu.kr/back/user/reviwerinfo",
          { userId: currentUser.id },
          { headers: { "Content-Type": "application/json" } }
        );
        const myReviewerId: number = reviewerRes.data.reviewerId;
        if (sign.reviewerId !== myReviewerId) {
          alert("접근 권한이 없습니다.");
          return;
        }
      }
      const res = await axios.get<SignStart>(
        `http://petback.hysu.kr/back/signstart/detail/${sign.signstartId}`,
        { headers: { "X-USER-ID": currentUser.id } }
      );
      setCurrentSign(res.data);
    } catch (err) {
      console.error(err);
      alert("상세 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleChange = (field: keyof SignStart, value: string) => {
    if (!currentSign) return;
    if (field === "signcount") {
      if (isNaN(Number(value))) { alert("심사 횟수는 숫자만 입력 가능합니다."); return; }
      setCurrentSign({ ...currentSign, [field]: Number(value) });
    } else if (field === "membergrade") {
      setCurrentSign({ ...currentSign, [field]: reverseMembergradeMap[value] });
    } else {
      setCurrentSign({ ...currentSign, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!currentSign) return;
    setSaving(true);
    try {
      if (currentUser.id === 117 && currentSign.membergrade) {
        await axios.put(
          `http://petback.hysu.kr/back/signstart/updatebysign/${currentSign.signId}`,
          currentSign,
          { headers: { "X-USER-ID": currentUser.id, "Content-Type": "application/json" } }
        );
      } else {
        await axios.put(
          `http://petback.hysu.kr/back/signstart/update/${currentSign.signstartId}`,
          currentSign,
          { headers: { "X-USER-ID": currentUser.id, "Content-Type": "application/json" } }
        );
      }
      alert("저장 완료!");
      setSaving(false);
      fetchMySigns();
    } catch (err) {
      console.error(err);
      alert("저장 실패. 관리자에게 문의하세요.");
      setSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentSign(null);
    setReviewersModalOpen(false);
    setReviewersList([]);
  };

  const handleViewReviewers = async () => {
    if (!currentSign) return;
    try {
      const res = await axios.get<SignStart[]>(
        `http://petback.hysu.kr/back/signstart/bysign/${currentSign.signId}`,
        { headers: { "X-USER-ID": currentUser.id } }
      );
      const list = res.data.map(r => ({ reviewerId: r.reviewerId, signcount: r.signcount }));
      setReviewersList(list);
      setReviewersModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("심사원 정보를 불러오는데 실패했습니다.");
    }
  };

  if (currentSign) {
    const isAdmin = currentUser?.id === 117;
    const isReviewer = currentUser?.id !== 117;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">인증 상세 정보 수정</h1>
        <div className="bg-white p-6 rounded shadow space-y-4 max-w-2xl mx-auto">

          {/* signtype */}
          <div className="flex flex-col">
            <label className="font-semibold">인증 종류</label>
            <select
              value={currentSign.signtype || ""}
              onChange={e => handleChange("signtype", e.target.value)}
              className="border px-2 py-1 rounded"
            >
              {signtypeOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>

          {/* membergrade */}
          <div className="flex flex-col">
            <label className="font-semibold">기업 규모</label>
            <select
              value={membergradeMap[currentSign.membergrade || "level1"]}
              onChange={e => handleChange("membergrade", e.target.value)}
              className="border px-2 py-1 rounded"
              disabled={!isAdmin}
            >
              {Object.values(membergradeMap).map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>

          {/* signstate */}
          <div className="flex flex-col">
            <label className="font-semibold">인증 상태</label>
            <select
              value={currentSign.signstate || ""}
              onChange={e => handleChange("signstate", e.target.value)}
              className="border px-2 py-1 rounded"
              disabled={isReviewer && currentSign.signstate ? true : false}
            >
              {signstateOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>

          {/* signdate */}
          <div className="flex flex-col">
            <label className="font-semibold">인증 날짜</label>
            <input
              type="date"
              value={currentSign.signdate?.split("T")[0] || ""}
              onChange={e => handleChange("signdate", e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>

          {/* effectivedate */}
          <div className="flex flex-col">
            <label className="font-semibold">유효 날짜</label>
            <input
              type="date"
              value={currentSign.effectivedate?.split("T")[0] || ""}
              onChange={e => handleChange("effectivedate", e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>

          {/* reviewcomplete */}
          <div className="flex flex-col">
            <label className="font-semibold">심사 완료 여부</label>
            <select
              value={currentSign.reviewcomplete || ""}
              onChange={e => handleChange("reviewcomplete", e.target.value)}
              className="border px-2 py-1 rounded"
            >
              {reviewcompleteOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>

          {/* affairdo */}
          <div className="flex flex-col">
            <label className="font-semibold">공정심사위원회 시행 여부</label>
            <select
              value={currentSign.affairdo || ""}
              onChange={e => handleChange("affairdo", e.target.value)}
              className="border px-2 py-1 rounded"
            >
              {affairdoOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>

          {/* signcount: 심사원만 표시 */}
          {!isAdmin && (
            <div className="flex flex-col">
              <label className="font-semibold">심사 횟수</label>
              <input
                type="number"
                value={currentSign.signcount || 0}
                onChange={e => handleChange("signcount", e.target.value)}
                className="border px-2 py-1 rounded"
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-2 mt-6">
            {isAdmin && (
              <button
                onClick={handleViewReviewers}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                심사원 보기
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>

        {/* 심사원 모달 */}
        {reviewersModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">배정된 심사원 목록</h2>
              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">심사원명</th>
                    <th className="px-4 py-2 border">심사 횟수</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewersList.map(r => (
                    <tr key={r.reviewerId} className="text-center border-b">
                      <td className="px-4 py-2">{r.reviewerId}</td>
                      <td className="px-4 py-2">{r.signcount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setReviewersModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 목록 화면은 기존 그대로
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">인증 현황</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 font-medium">기업명</th>
              <th className="px-6 py-3 text-left text-gray-700 font-medium">기업 규모</th>
              <th className="px-6 py-3 text-left text-gray-700 font-medium">인증 상태</th>
            </tr>
          </thead>
          <tbody>
            {signs.map(sign => (
              <tr
                key={sign.signstartId}
                className="cursor-pointer hover:bg-gray-50 transition"
                onClick={() => handleClick(sign)}
              >
                <td className="px-6 py-4 border-b">{sign.signId}</td>
                <td className="px-6 py-4 border-b">{membergradeMap[sign.membergrade || "level1"]}</td>
                <td className="px-6 py-4 border-b">{sign.signstate || "정보 없음"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

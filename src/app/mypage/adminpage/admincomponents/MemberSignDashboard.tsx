"use client";
import { useEffect, useState } from "react";

interface Member {
  memberId: number;
  name: string;
}

interface Reviewer {
  user_id: number;
  reviewer_id: number;
  name: string;
  loginID: string;
  phnum: string;
  grade: string;
}

interface SignStart {
  signstartId: number;
  signId: number;
  reviewerId: number;
  reviewerName: string;
  membergrade: string;
  memberName: string;
  reviewComplete: string;
  signtype?: string | null;
}

export default function MemberSignDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedSignType, setSelectedSignType] = useState<string | null>(null);
  const [assignedSignStarts, setAssignedSignStarts] = useState<SignStart[]>([]);
  const [selectedSignId, setSelectedSignId] = useState<number | null>(null);
  const [allSignStarts, setAllSignStarts] = useState<SignStart[]>([]);

  const adminUserId = 117;
  const BASE_URL = "http://petback.hysu.kr/back";

  // 전체 SignStart 목록 가져오기
  useEffect(() => {
    fetch(`${BASE_URL}/signstart/all`, {
      headers: { "X-USER-ID": adminUserId.toString() },
    })
      .then(res => res.json())
      .then(data => {
        const mappedData = Array.isArray(data) ? data.map(item => ({
          signstartId: item.signstartId || item.signStartId || item.id,
          signId: item.signId,
          reviewerId: item.reviewerId || item.reviewer_id,
          reviewerName: item.reviewerName || item.reviewer_name || item.name || '-',
          membergrade: item.membergrade || item.memberGrade || item.grade,
          memberName: item.name || item.memberName || item.member_name || '-',
          reviewComplete: item.reviewComplete || item.review_complete || 'N',
          signtype: item.signtype || item.signType || null
        })) : [];
        setAllSignStarts(mappedData);
      })
      .catch(err => {
        console.error("전체 SignStart 조회 실패:", err);
        setAllSignStarts([]);
      });
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/mypage/admin/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ classification: "관리자" })
    })
      .then(res => res.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        setMembers(list.filter(d => d.memberId != null)
          .map(d => ({
            memberId: d.memberId,
            name: d.name || `기업${d.memberId}`
          })));
      })
      .catch(err => {
        console.error("Member fetch 실패:", err);
        setMembers([]);
      });
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/mypage/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ classification: "관리자" })
    })
      .then(res => res.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        setReviewers(list.filter(d => d.reviewer_id != null)
          .map(d => ({
            user_id: d.user_id,
            reviewer_id: d.reviewer_id,
            name: d.name || `심사원${d.reviewer_id}`,
            loginID: d.loginID,
            phnum: d.phnum,
            grade: d.reviewerGrade || d.grade || d.reviewer_grade || '-'
          })));
      })
      .catch(err => {
        console.error("Reviewer fetch 실패:", err);
        setReviewers([]);
      });
  }, []);

  // 선택된 기업의 SignStart 필터링
  useEffect(() => {
    if (!selectedMember) {
      setAssignedSignStarts([]);
      setSelectedSignId(null);
      return;
    }

    // 전체 SignStart 중에서 선택된 memberId와 연결된 Sign을 찾기
    // Sign 테이블을 조회하는 대신, 기업명으로 필터링하거나
    // 기존 데이터에서 찾기

    // 임시로: 전체 목록에서 필터링 (실제로는 API 호출 필요)
    fetch(`${BASE_URL}/signstart/all`, {
      headers: { "X-USER-ID": adminUserId.toString() },
    })
      .then(res => res.json())
      .then(data => {
        const mappedData = Array.isArray(data) ? data.map(item => ({
          signstartId: item.signstartId || item.signStartId || item.id,
          signId: item.signId,
          reviewerId: item.reviewerId || item.reviewer_id,
          reviewerName: item.reviewerName || item.reviewer_name || item.name || '-',
          membergrade: item.membergrade || item.memberGrade || item.grade,
          memberName: item.name || item.memberName || item.member_name || '-',
          reviewComplete: item.reviewComplete || item.review_complete || 'N',
          memberId: item.memberId,
          signtype: item.signtype || item.signType || null
        })) : [];

        // 선택된 기업의 이름으로 필터링
        const selectedMemberName = members.find(m => m.memberId === selectedMember)?.name;
        const filtered = mappedData.filter(item =>
          item.memberName === selectedMemberName
        );

        setAssignedSignStarts(filtered);
      })
      .catch(err => {
        console.error(err);
        setAssignedSignStarts([]);
      });
  }, [selectedMember, members]);

  const toggleReviewer = (reviewerId: number) => {
    setSelectedReviewers(prev =>
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const createSignWithReviewers = async () => {
    if (!selectedMember || selectedReviewers.length === 0)
      return alert("기업 및 심사원을 선택하세요.");

    const payload = {
      memberId: selectedMember,
      reviewerIds: selectedReviewers,
      membergrade: `level${selectedGrade}`,
      signtype: selectedSignType === null ? null : selectedSignType
    };

    try {
      const res = await fetch(`${BASE_URL}/signstart/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-USER-ID": adminUserId.toString()
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("인증 생성 실패");

      const data = await res.json();
      const mappedData = Array.isArray(data) ? data.map(item => ({
        signstartId: item.signstartId || item.signStartId || item.id,
        signId: item.signId,
        reviewerId: item.reviewerId || item.reviewer_id,
        reviewerName: item.reviewerName || item.reviewer_name || item.name || '-',
        membergrade: item.membergrade || item.memberGrade || item.grade,
        memberName: item.name || item.memberName || item.member_name || '-',
        reviewComplete: item.reviewComplete || item.review_complete || 'N',
        signtype: item.signtype || item.signType || null
      })) : [];

      setAssignedSignStarts(mappedData);

      setSelectedReviewers([]);
      alert("신규 인증 등록 완료");
    } catch (err) {
      console.error(err);
      alert("Sign 생성 실패");
    }
  };

  const addReviewersToSign = async () => {
    if (!selectedMember || selectedReviewers.length === 0)
      return alert("기업 및 심사원을 선택하세요.");

    // selectedSignId가 있으면 사용, 없으면 첫 번째 Sign 사용
    const targetSignId = selectedSignId || (assignedSignStarts.length > 0 ? assignedSignStarts[0].signId : null);

    if (!targetSignId) {
      return alert("기존 인증이 없습니다. 먼저 '신규 인증 등록' 버튼을 사용하세요.");
    }

    const payload = {
      signId: targetSignId,
      reviewerIds: selectedReviewers
    };

    try {
      const res = await fetch(`${BASE_URL}/signstart/addreviewers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-USER-ID": adminUserId.toString()
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("심사원 추가 실패");

      const data = await res.json();

      const newSignStarts = Array.isArray(data) ? data.map(item => ({
        signstartId: item.signstartId || item.signStartId || item.id,
        signId: item.signId,
        reviewerId: item.reviewerId || item.reviewer_id,
        reviewerName: item.reviewerName || item.reviewer_name || item.name || '-',
        membergrade: item.membergrade || item.memberGrade || item.grade,
        memberName: item.name || item.memberName || item.member_name || '-',
        reviewComplete: item.reviewComplete || item.review_complete || 'N',
        signtype: item.signtype || item.signType || null
      })) : [];

      setAssignedSignStarts([...assignedSignStarts, ...newSignStarts]);

      setSelectedReviewers([]);
      alert(`${newSignStarts.length}명의 심사원이 추가되었습니다.`);
    } catch (err) {
      console.error(err);
      alert("심사원 추가 실패");
    }
  };

  const deleteSignStart = async (signstartId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`${BASE_URL}/signstart/delete/${signstartId}`, {
        method: "DELETE",
        headers: { "X-USER-ID": adminUserId.toString() },
      });

      if (!res.ok) throw new Error("삭제 실패");

      setAssignedSignStarts(prev => prev.filter(a => a.signstartId !== signstartId));
      alert("삭제 완료");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const deleteEntireSign = async (signId: number) => {
    try {
     await fetch(`${BASE_URL}/signstart/deletesign/${signId}`, { method: "DELETE", headers: { "X-USER-ID": adminUserId.toString() }});

      setAssignedSignStarts(prev => prev.filter(a => a.signId !== signId));
      alert("인증 정보 삭제 완료");
    } catch(err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const selectedSignInfo = selectedSignId
    ? assignedSignStarts.find(s => s.signId === selectedSignId)
    : null;


  const filteredMembers = members.filter(m => m.name.includes(memberSearch));

  return (
    <div className="flex-1 max-w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 p-6">기업 인증 배정</h2>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 flex flex-col">
            <label className="font-semibold text-gray-600 mb-2">기업 검색:</label>
            <input
              type="text"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="기업명 검색"
              className="border rounded px-3 py-2 mb-2"
            />
            <div className="border rounded h-40 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="px-3 py-2 text-gray-500">검색된 기업이 없습니다.</div>
              ) : (
                filteredMembers.map(m => (
                  <div
                    key={m.memberId}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      selectedMember === m.memberId ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setSelectedMember(m.memberId)}
                  >
                    {m.name}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-600">기업 등급:</label>
            <select
              className="border rounded px-3 py-2"
              value={selectedGrade}
              onChange={e => setSelectedGrade(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}단계</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-600">인증 유형:</label>
            <select
              className="border rounded px-3 py-2"
              value={selectedSignType === null ? "" : selectedSignType}
              onChange={e => setSelectedSignType(e.target.value === "" ? null : e.target.value)}
            >
              <option value="">미정</option>
              <option value="동물기업인증">동물기업인증</option>
              <option value="우수제품인증">우수제품인증</option>
              <option value="친환경기업인증">친환경기업인증</option>
              <option value="동물복지제품인증">동물복지제품인증</option>
              <option value="동물복지기업인증">동물복지기업인증</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <label className="font-semibold text-gray-600 mb-2">심사원 검색:</label>
          <input
            type="text"
            value={reviewerSearch}
            onChange={e => setReviewerSearch(e.target.value)}
            placeholder="이름 검색"
            className="border rounded px-3 py-2"
          />
          <div className="border rounded mt-2 h-80 overflow-y-auto">
            {reviewers.filter(r => r.name.includes(reviewerSearch)).map(r => (
              <div
                key={r.reviewer_id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 border-b"
              >
                <input
                  type="checkbox"
                  checked={selectedReviewers.includes(r.reviewer_id)}
                  onChange={() => toggleReviewer(r.reviewer_id)}
                  className="mr-3 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="text-sm text-gray-500">{r.loginID} | {r.phnum} | {r.grade}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-medium text-gray-700">
            선택된 심사원: {selectedReviewers.length}명
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition"
            onClick={createSignWithReviewers}
            disabled={!selectedMember || selectedReviewers.length === 0}
          >
            신규 인증 생성
          </button>
          <button
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition"
            onClick={addReviewersToSign}
            disabled={!selectedMember || selectedReviewers.length === 0 || assignedSignStarts.length === 0}
          >
            기존 인증 심사원 추가
            {selectedSignId && <span className="ml-2 text-xs">(Sign ID: {selectedSignId})</span>}
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            인증 현황
            {selectedSignId && (
              <span className="ml-3 text-sm text-blue-600">
                (기업명: 수정해야됨{}, 인증 종류 : {})
              </span>
            )}
          </h3>
          {assignedSignStarts.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">배정된 심사원이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-3 text-left font-semibold">기업명</th>
                    <th className="border px-4 py-3 text-left font-semibold">기업 등급</th>
                    <th className="border px-4 py-3 text-left font-semibold">인증 종류</th>
                    <th className="border px-4 py-3 text-left font-semibold">심사원 목록</th>
                    <th className="border px-4 py-3 text-left font-semibold">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // signId로 그룹화
                    const groupedBySignId = assignedSignStarts.reduce((acc, item) => {
                      if (!acc[item.signId]) {
                        acc[item.signId] = [];
                      }
                      acc[item.signId].push(item);
                      return acc;
                    }, {} as Record<number, SignStart[]>);

                    return Object.values(groupedBySignId).map(group => {
                      const first = group[0];
                      const allComplete = group.every(item => item.reviewComplete === 'Y');
                      const someComplete = group.some(item => item.reviewComplete === 'Y');
                      const isSelected = selectedSignId === first.signId;

                      return (
                        <tr
                          key={first.signId}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            isSelected ? 'bg-blue-100 border-2 border-blue-500' : ''}`}
                          onClick={() => setSelectedSignId(first.signId)}
                        >
                          <td className="border px-4 py-3">{first.memberName}</td>
                          <td className="border px-4 py-3">{first.membergrade?.replace("level", "") + "단계"}</td>
                          <td className="border px-4 py-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                              {first.signtype || "미정"}
                            </span>
                          </td>
                          <td className="border px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {group.map(item => (
                                <div key={item.signstartId} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
                                  <span className="text-sm">{item.reviewerName}</span>
                                  <button
                                    className="text-red-500 hover:text-red-700 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation(); // 행 클릭 이벤트 방지
                                      deleteSignStart(item.signstartId);
                                    }}
                                    title="삭제"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border px-4 py-3">
                            <button
                              className="text-red-500 hover:text-red-700 font-medium hover:underline"
                              onClick={async (e) => {
                                e.stopPropagation(); // 행 클릭 이벤트 방지
                                if (!confirm(`인증을 삭제하시겠습니까?`)) return;

                                try {
                                  const res = await fetch(`${BASE_URL}/signstart/deletesign/${first.signId}`, {
                                    method: "DELETE",
                                    headers: { "X-USER-ID": adminUserId.toString() },
                                  });

                                  if (!res.ok) {
                                    const errorBody = await res.json();
                                    console.error("DELETE 에러:", errorBody);
                                    throw new Error(errorBody?.message || "삭제 실패");
                                  }

                                  // 삭제 성공 시 상태 업데이트
                                  setAssignedSignStarts(prev => prev.filter(a => a.signId !== first.signId));
                                  alert("인증 삭제 완료");
                                } catch (err) {
                                  console.error("삭제 실패:", err);
                                  alert("삭제 실패");
                                }
                              }}
                            >
                              전체삭제
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
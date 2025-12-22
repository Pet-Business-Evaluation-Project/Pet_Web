"use client";
import { useEffect, useState } from "react";
import { FaFileSignature } from "react-icons/fa";

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

interface SignStartRaw {
  signstartId?: number;
  signStartId?: number;
  id?: number;
  signId: number;
  reviewerId?: number;
  reviewer_id?: number;
  reviewerName?: string;
  reviewer_name?: string;
  name?: string;
  membergrade?: string;
  memberGrade?: string;
  grade?: string;
  memberName?: string;
  member_name?: string;
  reviewComplete?: string;
  review_complete?: string;
  memberId?: number;
  signtype?: string | null;
  signType?: string | null;
}

export default function MemberSignDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [selectedSalesReviewer, setSelectedSalesReviewer] = useState<
    number | null
  >(null);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedSignType, setSelectedSignType] = useState<string | null>(null);
  const [assignedSignStarts, setAssignedSignStarts] = useState<SignStart[]>([]);
  const [selectedSignId, setSelectedSignId] = useState<number | null>(null);
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const BASE_URL = "http://petback.hysu.kr/back";

  // 🔥 공통 fetch 함수 - credentials를 항상 포함
  const fetchWithAuth = (url: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // adminUserId가 있으면 X-USER-ID 헤더 추가
    if (adminUserId) {
      (headers as Record<string, string>)["X-USER-ID"] = adminUserId.toString();
    }

    return fetch(url, {
      credentials: "include", // 항상 세션 쿠키 포함
      ...options,
      headers,
    });
  };

  // Helper function to map raw data to SignStart
  const mapToSignStart = (item: SignStartRaw): SignStart => ({
    signstartId: item.signstartId || item.signStartId || item.id || 0,
    signId: item.signId,
    reviewerId: item.reviewerId || item.reviewer_id || 0,
    reviewerName: item.reviewerName || item.reviewer_name || item.name || "-",
    membergrade: item.membergrade || item.memberGrade || item.grade || "",
    memberName: item.name || item.memberName || item.member_name || "-",
    reviewComplete: item.reviewComplete || item.review_complete || "N",
    signtype: item.signtype || item.signType || null,
  });

  // localStorage에서 사용자 정보 확인 및 관리자 권한 체크
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const userStr = localStorage.getItem("user");
        console.log("📦 userStr:", userStr);

        if (!userStr) {
          alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
          setIsAuthorized(false);
          return;
        }

        const user = JSON.parse(userStr);
        console.log("👤 파싱된 user:", user);

        // classification이 "관리자"인지 확인
        if (user.classification !== "관리자") {
          alert("관리자 권한이 필요합니다.");
          setIsAuthorized(false);
          return;
        }

        // userId 확인
        const userId = user.id;
        console.log("🆔 추출된 userId:", userId);

        if (!userId) {
          alert("사용자 ID를 찾을 수 없습니다.");
          setIsAuthorized(false);
          return;
        }

        setAdminUserId(userId);
        setIsAuthorized(true);
        console.log("✅ 관리자 인증 완료, userId:", userId);
      } catch (error) {
        console.error("❌ 사용자 정보 확인 중 오류:", error);
        alert("사용자 정보를 확인할 수 없습니다.");
        setIsAuthorized(false);
      }
    };

    checkAdminAuth();
  }, []);

  // 전체 SignStart 목록 가져오기
  useEffect(() => {
    if (!isAuthorized || !adminUserId) return;

    fetchWithAuth(`${BASE_URL}/signstart/all`)
      .then((res) => res.json())
      .then((data: SignStartRaw[]) => {
        const mappedData = Array.isArray(data) ? data.map(mapToSignStart) : [];
        console.log("✅ 전체 SignStart 목록 로드 성공:", mappedData.length);
      })
      .catch((err) => {
        console.error("❌ 전체 인증 목록 조회 실패:", err);
      });
  }, [isAuthorized, adminUserId]);

  // Member 목록 가져오기
  useEffect(() => {
    if (!isAuthorized || !adminUserId) return;

    fetchWithAuth(`${BASE_URL}/mypage/admin/members`, {
      method: "POST",
      body: JSON.stringify({ classification: "관리자" }),
    })
      .then((res) => res.json())
      .then((data: Member[]) => {
        const list = Array.isArray(data) ? data : [];
        setMembers(
          list
            .filter((d) => d.memberId != null)
            .map((d) => ({
              memberId: d.memberId,
              name: d.name || `기업${d.memberId}`,
            }))
        );
        console.log("✅ Member 목록 로드 성공:", list.length);
      })
      .catch((err) => {
        console.error("❌ Member fetch 실패:", err);
        setMembers([]);
      });
  }, [isAuthorized, adminUserId]);

  // Reviewer 목록 가져오기
  useEffect(() => {
    if (!isAuthorized || !adminUserId) return;

    fetchWithAuth(`${BASE_URL}/mypage/admin`, {
      method: "POST",
      body: JSON.stringify({ classification: "관리자" }),
    })
      .then((res) => res.json())
      .then((data: Reviewer[]) => {
        const list = Array.isArray(data) ? data : [];
        setReviewers(
          list
            .filter((d) => d.reviewer_id != null)
            .map((d) => ({
              user_id: d.user_id,
              reviewer_id: d.reviewer_id,
              name: d.name || `심사원${d.reviewer_id}`,
              loginID: d.loginID,
              phnum: d.phnum,
              grade: d.grade || "-",
            }))
        );
        console.log("✅ Reviewer 목록 로드 성공:", list.length);
      })
      .catch((err) => {
        console.error("❌ Reviewer fetch 실패:", err);
        setReviewers([]);
      });
  }, [isAuthorized, adminUserId]);

  // 선택된 기업의 SignStart 필터링
  useEffect(() => {
    if (!isAuthorized || !adminUserId) return;

    if (!selectedMember) {
      setAssignedSignStarts([]);
      setSelectedSignId(null);
      return;
    }

    fetchWithAuth(`${BASE_URL}/signstart/all`)
      .then((res) => res.json())
      .then((data: SignStartRaw[]) => {
        const mappedData = Array.isArray(data) ? data.map(mapToSignStart) : [];

        const selectedMemberName = members.find(
          (m) => m.memberId === selectedMember
        )?.name;
        const filtered = mappedData.filter(
          (item) => item.memberName === selectedMemberName
        );

        setAssignedSignStarts(filtered);
        console.log("✅ 선택된 기업의 SignStart 필터링 완료:", filtered.length);
      })
      .catch((err) => {
        console.error("❌ SignStart 필터링 실패:", err);
        setAssignedSignStarts([]);
      });
  }, [selectedMember, members, isAuthorized, adminUserId]);

  const toggleReviewer = (reviewerId: number) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId)
        ? prev.filter((id) => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const createSignWithReviewers = async () => {
    if (!isAuthorized || !adminUserId) {
      alert("관리자 권한이 필요합니다.");
      return;
    }

    if (!selectedMember || selectedReviewers.length === 0) {
      alert("기업 및 심사원을 선택하세요.");
      return;
    }

    const payload = {
      memberId: selectedMember,
      reviewerIds: selectedReviewers,
      salesReviewerId: selectedSalesReviewer,
      membergrade: `level${selectedGrade}`,
      signtype: selectedSignType === null ? null : selectedSignType,
    };

    try {
      const res = await fetchWithAuth(`${BASE_URL}/signstart/create`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("인증 생성 실패");

      const data: SignStartRaw[] = await res.json();
      const mappedData = Array.isArray(data) ? data.map(mapToSignStart) : [];

      setAssignedSignStarts(mappedData);
      setSelectedReviewers([]);
      alert("신규 인증 생성 완료!");
      console.log("✅ 신규 인증 생성 성공:", mappedData.length);
    } catch (err) {
      console.error("❌ 인증 생성 실패:", err);
      alert("인증 생성 실패");
    }
  };

  const addReviewersToSign = async () => {
    if (!isAuthorized || !adminUserId) {
      alert("관리자 권한이 필요합니다.");
      return;
    }

    if (!selectedMember || selectedReviewers.length === 0) {
      alert("기업 및 심사원을 선택하세요.");
      return;
    }

    const targetSignId =
      selectedSignId ||
      (assignedSignStarts.length > 0 ? assignedSignStarts[0].signId : null);

    if (!targetSignId) {
      alert("기존 인증이 없습니다. 먼저 '신규 인증 생성' 버튼을 사용하세요.");
      return;
    }

    const payload = {
      signId: targetSignId,
      reviewerIds: selectedReviewers,
    };

    try {
      const res = await fetchWithAuth(`${BASE_URL}/signstart/addreviewers`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("심사원 추가 실패");

      const data: SignStartRaw[] = await res.json();
      const newSignStarts = Array.isArray(data) ? data.map(mapToSignStart) : [];

      setAssignedSignStarts([...assignedSignStarts, ...newSignStarts]);
      setSelectedReviewers([]);
      alert(`${newSignStarts.length}명의 심사원이 추가되었습니다.`);
      console.log("✅ 심사원 추가 성공:", newSignStarts.length);
    } catch (err) {
      console.error("❌ 심사원 추가 실패:", err);
      alert("심사원 추가 실패");
    }
  };

  const deleteSignStart = async (signstartId: number) => {
    if (!isAuthorized || !adminUserId) {
      alert("관리자 권한이 필요합니다.");
      return;
    }

    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/signstart/delete/${signstartId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("삭제 실패");

      setAssignedSignStarts((prev) =>
        prev.filter((a) => a.signstartId !== signstartId)
      );
      alert("삭제 완료");
      console.log("✅ SignStart 삭제 성공:", signstartId);
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      alert("삭제 실패");
    }
  };

  const filteredMembers = members.filter((m) => m.name.includes(memberSearch));

  // 권한이 없을 때 표시할 화면
  if (!isAuthorized) {
    return (
      <div className="flex-1 max-w-full">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              접근 권한 없음
            </h2>
            <p className="text-gray-600">관리자 권한이 필요한 페이지입니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 p-6">
          <FaFileSignature className="text-blue-500 w-6 h-6" />
          기업 인증 배정
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 flex flex-col">
            <label className="font-semibold text-gray-600 mb-2">
              기업 검색:
            </label>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="기업명 검색"
              className="border rounded px-3 py-2 mb-2"
            />
            <div className="border rounded h-40 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="px-3 py-2 text-gray-500">
                  검색된 기업이 없습니다.
                </div>
              ) : (
                filteredMembers.map((m) => (
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
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}단계
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-600">인증 유형:</label>
            <select
              className="border rounded px-3 py-2"
              value={selectedSignType === null ? "" : selectedSignType}
              onChange={(e) =>
                setSelectedSignType(
                  e.target.value === "" ? null : e.target.value
                )
              }
            >
              <option value="">미정</option>
              <option value="동물기업인증">동물기업인증</option>
              <option value="우수제품인증">우수제품인증</option>
              <option value="친환경기업인증">친환경기업인증</option>
              <option value="동물복지제품인증">동물복지제품인증</option>
              <option value="동물복지기업인증">동물복지기업인증</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold text-gray-600">영업 심사원:</label>
            <select
              className="border rounded px-3 py-2"
              value={
                selectedSalesReviewer === null ? "" : selectedSalesReviewer
              }
              onChange={(e) =>
                setSelectedSalesReviewer(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            >
              <option value="">선택하세요</option>
              {reviewers.map((r) => (
                <option key={r.reviewer_id} value={r.reviewer_id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <label className="font-semibold text-gray-600 mb-2">
            심사원 검색:
          </label>
          <input
            type="text"
            value={reviewerSearch}
            onChange={(e) => setReviewerSearch(e.target.value)}
            placeholder="이름 검색"
            className="border rounded px-3 py-2"
          />
          <div className="border rounded mt-2 h-80 overflow-y-auto">
            {reviewers
              .filter((r) => r.name.includes(reviewerSearch))
              .map((r) => (
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
                    <div className="text-sm text-gray-500">
                      {r.loginID} | {r.phnum} | {r.grade}
                    </div>
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
            disabled={
              !selectedMember ||
              selectedReviewers.length === 0 ||
              assignedSignStarts.length === 0
            }
          >
            기존 인증에 심사원 추가
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            배정 현황
            {selectedSignId &&
              (() => {
                const selectedSign = assignedSignStarts.find(
                  (item) => item.signId === selectedSignId
                );
                return selectedSign ? (
                  <span className="ml-3 text-sm text-blue-600">
                    (기업명: {selectedSign.memberName}, 인증 종류:{" "}
                    {selectedSign.signtype || "미정"})
                  </span>
                ) : null;
              })()}
          </h3>
          {assignedSignStarts.length === 0 ? (
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              배정된 심사원이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-3 text-left font-semibold">
                      기업명
                    </th>
                    <th className="border px-4 py-3 text-left font-semibold">
                      기업 등급
                    </th>
                    <th className="border px-4 py-3 text-left font-semibold">
                      인증 종류
                    </th>
                    <th className="border px-4 py-3 text-left font-semibold">
                      심사원 목록
                    </th>
                    <th className="border px-4 py-3 text-left font-semibold">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groupedBySignId = assignedSignStarts.reduce(
                      (acc, item) => {
                        if (!acc[item.signId]) {
                          acc[item.signId] = [];
                        }
                        acc[item.signId].push(item);
                        return acc;
                      },
                      {} as Record<number, SignStart[]>
                    );

                    return Object.values(groupedBySignId).map((group) => {
                      const first = group[0];
                      const isSelected = selectedSignId === first.signId;

                      return (
                        <tr
                          key={first.signId}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            isSelected
                              ? "bg-blue-100 border-2 border-blue-500"
                              : ""
                          }`}
                          onClick={() => setSelectedSignId(first.signId)}
                        >
                          <td className="border px-4 py-3">
                            {first.memberName}
                          </td>
                          <td className="border px-4 py-3">
                            {first.membergrade?.replace("level", "") + "단계"}
                          </td>
                          <td className="border px-4 py-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                              {first.signtype || "미정"}
                            </span>
                          </td>
                          <td className="border px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {group.map((item) => (
                                <div
                                  key={item.signstartId}
                                  className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded"
                                >
                                  <span className="text-sm">
                                    {item.reviewerName}
                                  </span>
                                  <button
                                    className="text-red-500 hover:text-red-700 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                                e.stopPropagation();
                                if (
                                  !confirm(
                                    `이 인증(기업명: ${
                                      first.memberName
                                    }, 인증 종류: ${
                                      first.signtype || "미정"
                                    })의 모든 심사원 배정을 삭제하시겠습니까?`
                                  )
                                )
                                  return;

                                try {
                                  const res = await fetchWithAuth(
                                    `${BASE_URL}/signstart/deletesign/${first.signId}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );

                                  if (!res.ok) {
                                    const errorBody = await res.json();
                                    console.error("❌ DELETE 에러:", errorBody);
                                    throw new Error(
                                      errorBody?.message || "삭제 실패"
                                    );
                                  }

                                  setAssignedSignStarts((prev) =>
                                    prev.filter(
                                      (a) => a.signId !== first.signId
                                    )
                                  );
                                  alert("인증 삭제 완료!");
                                  console.log(
                                    "✅ 인증 전체 삭제 성공:",
                                    first.signId
                                  );
                                } catch (err) {
                                  console.error("❌ 삭제 실패:", err);
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

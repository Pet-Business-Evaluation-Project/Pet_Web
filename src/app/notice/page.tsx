"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const BASE_URL = "https://www.kcci.co.kr/back/community/notice";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  author: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface CommunityRequestDto {
  loginID: string;
  title: string;
  content: string;
}

export default function NoticePage() {
  // 로그인 정보
  let storedLoginID = "";
  let storedUserName = "";
  let storedClass = "";
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        storedLoginID = parsed.email || "";
        storedUserName = parsed.name || "";
        storedClass = parsed.classification || "";
      } catch (e) {
        console.error("localStorage parsing error:", e);
      }
    }
  }

  const [loginID] = useState(storedLoginID);
  const [userName] = useState(storedUserName);
  const [userClass] = useState(storedClass);
  const [notices, setNotices] = useState<CommunityPost[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<CommunityPost | null>(null);
  const [isFixedNotice, setIsFixedNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newNotice, setNewNotice] = useState<CommunityRequestDto>({
    loginID: storedLoginID,
    title: "",
    content: "",
  });
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ title: string; content: string }>({
    title: "",
    content: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const isAdmin = userClass === "관리자";

  // 고정 공지의 총 섹션 수
  const totalSections = 5; // 인트로 + Step 1~4

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleNextSection = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  // 공지 목록 가져오기
  const fetchAllNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error("공지사항 목록 조회 실패");
      const data: CommunityPost[] = await res.json();
      setNotices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 공지 작성
  const createNotice = async () => {
    if (!isAdmin) {
      alert("관리자만 공지사항을 작성할 수 있습니다.");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/create/${loginID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotice),
      });
      if (!res.ok) throw new Error("공지사항 작성 실패");
      await fetchAllNotices();
      setNewNotice({ loginID, title: "", content: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "공지사항 작성 중 오류 발생");
    }
  };

  // 공지 수정
  const updateNotice = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}/${loginID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editData.title,
          content: editData.content,
        }),
      });
      if (!res.ok) throw new Error("공지사항 수정 실패");
      const updatedNotice: CommunityPost = await res.json();
      setNotices((prev) => prev.map((n) => (n.id === id ? updatedNotice : n)));
      setSelectedNotice(updatedNotice);
      setEditingNoticeId(null);
    } catch (err) {
      alert("공지사항 수정 중 오류가 발생했습니다.");
    }
  };

  // 공지 삭제
  const deleteNotice = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}/${loginID}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("공지사항 삭제 실패");
      await fetchAllNotices();
      setSelectedNotice(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      alert("공지사항 삭제 중 오류가 발생했습니다.");
    }
  };

  // 고정 공지 클릭 핸들러
  const handleFixedNoticeClick = () => {
    setSelectedNotice({
      id: -1, // 고정 공지는 음수 ID 사용
      title: "KCCI 심사원 회원가입 방법",
      content: "심사원 회원가입 절차를 안내드립니다.",
      author: "KCCI 관리자",
      type: "notice",
      createdAt: "2025-11-06T00:00:00",
      updatedAt: "2025-11-06T00:00:00",
    });
    setIsFixedNotice(true);
    setCurrentSection(0);
  };

  useEffect(() => {
    fetchAllNotices();
  }, []);

  // 날짜 포맷 (UTC -> KST)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(date.getHours() + 9);
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const DD = String(date.getDate()).padStart(2, "0");
    const HH = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${MM}/${DD} ${HH}:${mm}`;
  };

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        color: "#222",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Pretendard, Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>📢 공지사항</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 목록 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          maxWidth: "1500px",
          margin: "20px auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "10px" }}>제목</th>
              <th style={{ textAlign: "right", padding: "10px" }}>작성자</th>
            </tr>
          </thead>
          <tbody>
            {/* 고정 공지사항 */}
            <tr
              onClick={handleFixedNoticeClick}
              style={{
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                transition: "background-color 0.2s",
                backgroundColor: "#f0f8ff",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e6f3ff")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f0f8ff")}
            >
              <td style={{ padding: "10px", fontWeight: "bold" }}>
                📌 KCCI 심사원 회원가입 방법
              </td>
              <td style={{ textAlign: "right", padding: "10px" }}>KCCI 관리자</td>
            </tr>
            {/* 일반 공지사항 */}
            {notices.map((n) => (
              <tr
                key={n.id}
                onClick={() => {
                  setSelectedNotice(n);
                  setIsFixedNotice(false);
                }}
                style={{
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <td style={{ padding: "10px" }}>{n.title}</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{n.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 공지 모달 */}
      {selectedNotice && (
        <div
          onClick={() => {
            setSelectedNotice(null);
            setIsFixedNotice(false);
            setEditingNoticeId(null);
            setShowDeleteConfirm(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              maxWidth: "1200px",
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {/* 고정 공지사항 상세 보기 */}
            {isFixedNotice ? (
              <>
                {/* 헤더 */}
                <div
                  style={{
                    background: "linear-gradient(to right, #2563eb, #4f46e5)",
                    padding: "32px",
                    color: "white",
                    borderRadius: "10px 10px 0 0",
                    marginBottom: "0",
                  }}
                >
                  <h2 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "12px" }}>
                    {selectedNotice.title}
                  </h2>
                  <p style={{ fontSize: "16px", color: "#bfdbfe" }}>
                    {selectedNotice.author} • 2025. 11. 06.
                  </p>
                </div>

                {/* 섹션 컨텐츠 */}
                <div style={{ padding: "48px", minHeight: "500px", position: "relative" }}>
                  {/* 섹션 0: 인트로 */}
                  {currentSection === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <h3 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", marginBottom: "24px" }}>
                        KCCI 심사원 회원가입 안내
                      </h3>
                      <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px", lineHeight: "1.8" }}>
                        심사원으로 활동하기 위한 회원가입 절차를 단계별로 안내해드립니다.
                      </p>
                      <div
                        style={{
                          background: "linear-gradient(to right, #eff6ff, #e0e7ff)",
                          border: "2px solid #bfdbfe",
                          padding: "32px",
                          borderRadius: "12px",
                          marginTop: "40px",
                        }}
                      >
                        <h4 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", marginBottom: "16px" }}>
                          💡 안내사항
                        </h4>
                        <p style={{ fontSize: "16px", color: "#374151", lineHeight: "1.8" }}>
                          회원가입 최초시 심사원 등급은 자동으로 <strong>심사원보</strong>가 됩니다.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 섹션 1: Step 1 */}
                  {currentSection === 1 && (
                    <div>
                      <div style={{ borderLeft: "6px solid #3b82f6", paddingLeft: "32px", marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#3b82f6",
                              color: "white",
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            1
                          </span>
                          우측 상단 회원가입 클릭
                        </h3>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            padding: "24px",
                            borderRadius: "12px",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src="/img/notice1.png"
                            alt="회원가입 버튼"
                            width={1000}
                            height={500}
                            style={{ maxWidth: "100%", width: "100%", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 섹션 2: Step 2 */}
                  {currentSection === 2 && (
                    <div>
                      <div style={{ borderLeft: "6px solid #6366f1", paddingLeft: "32px", marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#6366f1",
                              color: "white",
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            2
                          </span>
                          동의 약관 읽은 후 동의 약관 체크 후 넘어가기
                        </h3>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            padding: "24px",
                            borderRadius: "12px",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src="/img/notice2.png"
                            alt="약관 동의"
                            width={1000}
                            height={500}
                            style={{ maxWidth: "50%", width: "50%", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 섹션 3: Step 3 */}
                  {currentSection === 3 && (
                    <div>
                      <div style={{ borderLeft: "6px solid #a855f7", paddingLeft: "32px", marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#a855f7",
                              color: "white",
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            3
                          </span>
                          심사원 가입 클릭
                        </h3>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            padding: "24px",
                            borderRadius: "12px",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src="/img/notice3.png"
                            alt="심사원 가입"
                            width={800}
                            height={600}
                            style={{ maxWidth: "50%", width: "auto", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 섹션 4: Step 4 */}
                  {currentSection === 4 && (
                    <div>
                      <div style={{ borderLeft: "6px solid #22c55e", paddingLeft: "32px", marginBottom: "32px" }}>
                        <h3
                          style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#1f2937",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#22c55e",
                              color: "white",
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            4
                          </span>
                          회원 정보 입력
                        </h3>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            padding: "24px",
                            borderRadius: "12px",
                            marginBottom: "24px",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src="/img/notice4.png"
                            alt="회원 정보 입력"
                            width={700}
                            height={900}
                            style={{ maxWidth: "50%", width: "auto", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.15)" }}
                          />
                        </div>

                        <div
                          style={{
                            backgroundColor: "#dbeafe",
                            padding: "32px",
                            borderRadius: "12px",
                            marginTop: "24px",
                          }}
                        >
                          <h4 style={{ fontWeight: "bold", color: "#1f2937", marginBottom: "20px", fontSize: "22px" }}>
                            📝 입력 정보 안내
                          </h4>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            <li style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "16px" }}>
                              <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>•</span>
                              <span style={{ color: "#374151", fontSize: "17px" }}>
                                <strong>이름:</strong> 3글자 이상 이름
                              </span>
                            </li>
                            <li style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "16px" }}>
                              <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>•</span>
                              <span style={{ color: "#374151", fontSize: "17px" }}>
                                <strong>아이디:</strong> 중복 불가, 4자 이상
                              </span>
                            </li>
                            <li style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "16px" }}>
                              <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>•</span>
                              <span style={{ color: "#374151", fontSize: "17px" }}>
                                <strong>비밀번호:</strong> 영문, 숫자, 특수문자를 포함한 8자 이상
                              </span>
                            </li>
                            <li style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "16px" }}>
                              <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>•</span>
                              <span style={{ color: "#374151", fontSize: "17px" }}>
                                <strong>휴대폰:</strong> 01012345678
                              </span>
                            </li>
                            <li style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "16px" }}>
                              <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>•</span>
                              <span style={{ color: "#374151", fontSize: "17px" }}>
                                <strong>주민등록번호:</strong> 앞6자리 + 뒷1자리
                              </span>
                            </li>
                            <li style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                              <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px" }}>•</span>
                              <span style={{ color: "#374151", fontSize: "17px" }}>
                                <strong>추천인ID:</strong> 회원가입된 회원의 ID
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 좌우 네비게이션 버튼 */}
                  {currentSection > 0 && (
                    <button
                      onClick={handlePrevSection}
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "56px",
                        height: "56px",
                        fontSize: "24px",
                        cursor: "pointer",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                      }}
                    >
                      ←
                    </button>
                  )}
                  
                  {currentSection < totalSections - 1 && (
                    <button
                      onClick={handleNextSection}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "56px",
                        height: "56px",
                        fontSize: "24px",
                        cursor: "pointer",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                      }}
                    >
                      →
                    </button>
                  )}
                </div>

                {/* 진행 표시 및 버튼 영역 */}
                <div style={{ padding: "24px 48px 48px", borderTop: "1px solid #e5e7eb" }}>
                  {/* 진행 표시 점 */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
                    {[...Array(totalSections)].map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: idx === currentSection ? "#2563eb" : "#d1d5db",
                          cursor: "pointer",
                          transition: "all 0.3s",
                        }}
                        onClick={() => setCurrentSection(idx)}
                      />
                    ))}
                  </div>

                  {/* 하단 버튼 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => {
                        setSelectedNotice(null);
                        setIsFixedNotice(false);
                        setCurrentSection(0);
                      }}
                      style={{
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 24px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "500",
                      }}
                    >
                      닫기
                    </button>

                    <div style={{ display: "flex", gap: "12px" }}>
                      {currentSection > 0 && (
                        <button
                          onClick={handlePrevSection}
                          style={{
                            backgroundColor: "#e5e7eb",
                            color: "#374151",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px 24px",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "500",
                          }}
                        >
                          이전
                        </button>
                      )}
                      
                      {currentSection < totalSections - 1 && (
                        <button
                          onClick={handleNextSection}
                          style={{
                            backgroundColor: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px 24px",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "500",
                          }}
                        >
                          다음
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* 일반 공지사항 상세 보기 */
              <>
                {editingNoticeId === selectedNotice.id ? (
                  <>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "20px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    />
                    <textarea
                      value={editData.content}
                      onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                      style={{
                        width: "100%",
                        height: "200px",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginBottom: "20px",
                      }}
                    />
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={() => updateNotice(selectedNotice.id)}
                        style={{
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "6px 12px",
                          marginRight: "8px",
                        }}
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingNoticeId(null)}
                        style={{
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "6px 12px",
                        }}
                      >
                        닫기
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ color: "#007bff", marginBottom: "10px" }}>{selectedNotice.title}</h2>
                    <p style={{ color: "#666", marginBottom: "4px" }}>{selectedNotice.author}</p>
                    <p style={{ color: "#999", marginBottom: "15px" }}>
                      작성일: {formatDate(selectedNotice.createdAt)}
                      {selectedNotice.updatedAt !== selectedNotice.createdAt &&
                        ` | 수정일: ${formatDate(selectedNotice.updatedAt)}`}
                    </p>
                    <hr />
                    <p style={{ whiteSpace: "pre-wrap", marginTop: "20px" }}>{selectedNotice.content}</p>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "6px 12px",
                          }}
                        >
                          삭제
                        </button>

                        {showDeleteConfirm && (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              backgroundColor: "white",
                              padding: "20px",
                              borderRadius: "10px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                              zIndex: 10,
                            }}
                          >
                            <p>정말 삭제하시겠습니까?</p>
                            <div style={{ textAlign: "right", marginTop: "10px" }}>
                              <button
                                onClick={() => deleteNotice(selectedNotice.id)}
                                style={{
                                  backgroundColor: "#dc3545",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "5px",
                                  padding: "6px 12px",
                                  marginRight: "10px",
                                }}
                              >
                                예
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                  backgroundColor: "#6c757d",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "5px",
                                  padding: "6px 12px",
                                }}
                              >
                                아니오
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{ textAlign: "right", marginTop: "15px" }}>
                          <button
                            onClick={() => {
                              setEditingNoticeId(selectedNotice.id);
                              setEditData({ title: selectedNotice.title, content: selectedNotice.content });
                            }}
                            style={{
                              backgroundColor: "#ffc107",
                              border: "none",
                              borderRadius: "5px",
                              padding: "6px 12px",
                              color: "white",
                              marginRight: "10px",
                            }}
                          >
                            ✏️ 수정
                          </button>
                          <button
                            onClick={() => setSelectedNotice(null)}
                            style={{
                              backgroundColor: "#6c757d",
                              border: "none",
                              borderRadius: "5px",
                              padding: "6px 12px",
                              color: "white",
                            }}
                          >
                            닫기
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 작성 모달 */}
      {showWriteModal && (
        <div
          onClick={() => setShowWriteModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2>공지사항 작성</h2>
            <input
              type="text"
              placeholder="제목"
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <textarea
              placeholder="내용"
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              style={{
                width: "100%",
                height: "150px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <button
                onClick={() => {
                  createNotice();
                  setShowWriteModal(false);
                }}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                작성
              </button>
              <button
                onClick={() => setShowWriteModal(false)}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* + 버튼 */}
      {isAdmin && (
        <button
          onClick={() => setShowWriteModal(true)}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            fontSize: "30px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          +
        </button>
      )}
    </div>
  );
}
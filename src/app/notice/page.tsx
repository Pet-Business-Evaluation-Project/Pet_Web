"use client";

import React, { useEffect, useState } from "react";

const BASE_URL = "http://petback.hysu.kr/back/community/notice";

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

  const isAdmin = userClass === "관리자";

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
            {notices.map((n) => (
              <tr
                key={n.id}
                onClick={() => setSelectedNotice(n)}
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

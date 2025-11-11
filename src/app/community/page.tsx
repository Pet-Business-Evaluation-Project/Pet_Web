"use client";

import React, { useEffect, useState } from "react";

const BASE_URL = "http://petback.hysu.kr/back/community/board";

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

export default function BoardPage() {
  /** 로그인 정보 가져오기 */
  let storedLoginID = "";
  let storedUserName = "";
  let storedClassification = "";
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        storedLoginID = parsed.email || "";
        storedUserName = parsed.name || "";
        storedClassification = parsed.classification || "";
      } catch (e) {
        console.error("localStorage parsing error:", e);
      }
    }
  }

  const [loginID] = useState(storedLoginID);
  const [userName] = useState(storedUserName);
  const [userClassification] = useState(storedClassification);
  const [boards, setBoards] = useState<CommunityPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState<CommunityRequestDto>({
    loginID: storedLoginID,
    title: "",
    content: "",
  });
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ title: string; content: string }>({
    title: "",
    content: "",
  });
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CommunityPost | null>(null);

  /** 전체 게시글 가져오기 */
  const fetchAllBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error("게시글 목록 조회 실패");
      const data: CommunityPost[] = await res.json();
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 게시글 작성 */
  const createBoard = async () => {
    if (!loginID) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 권한 체크: 심사원 or 관리자
    if (userClassification !== "심사원" && userClassification !== "관리자") {
      alert("글 작성 권한이 없습니다.");
      return;
    }

    const payload: CommunityRequestDto = {
      loginID: loginID.toLowerCase(),
      title: newPost.title,
      content: newPost.content,
    };

    try {
      const res = await fetch(`${BASE_URL}/create/${payload.loginID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`게시글 작성 실패: ${text}`);
      }

      await fetchAllBoards();
      setNewPost({ loginID, title: "", content: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "게시글 작성 중 오류가 발생했습니다.");
    }
  };

  /** 게시글 삭제 */
  const deleteBoard = async (id: number) => {
    if (!loginID) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/${id}/${loginID}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("게시글 삭제 실패");

      await fetchAllBoards();
      setSelectedPost(null);
      setConfirmDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  /** 게시글 수정 */
  const updateBoard = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}/${loginID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editData.title,
          content: editData.content,
        }),
      });

      if (!res.ok) throw new Error("게시글 수정 실패");

      const updatedPost: CommunityPost = await res.json();
      setBoards((prev) => prev.map((b) => (b.id === id ? updatedPost : b)));
      setSelectedPost(updatedPost);
      setEditingPostId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "게시글 수정 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchAllBoards();
  }, []);

  /** 날짜 포맷팅 (UTC -> KST) */
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
      <h1 style={{ textAlign: "center", color: "#333" }}>🐾 커뮤니티 게시판</h1>

      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 게시글 목록 */}
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
            {boards.map((b) => (
              <tr
                key={b.id}
                onClick={() => setSelectedPost(b)}
                style={{
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9f9f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <td style={{ padding: "10px" }}>{b.title}</td>
                <td style={{ textAlign: "right", padding: "10px" }}>
                  {b.author}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상세/수정 모달 */}
      {selectedPost && (
        <div
          onClick={() => {
            setSelectedPost(null);
            setEditingPostId(null);
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
            {editingPostId === selectedPost.id ? (
              <>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
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
                  onChange={(e) =>
                    setEditData({ ...editData, content: e.target.value })
                  }
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
                    onClick={() => updateBoard(selectedPost.id)}
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
                    onClick={() => setEditingPostId(null)}
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
                <h2
                  style={{ color: "#007bff", marginBottom: "10px" }}
                >
                  {selectedPost.title}
                </h2>
                <p style={{ color: "#666", marginBottom: "4px" }}>
                  {selectedPost.author}
                </p>
                <p style={{ color: "#999", marginBottom: "15px" }}>
                  작성일: {formatDate(selectedPost.createdAt)}
                  {selectedPost.updatedAt !== selectedPost.createdAt &&
                    ` | 수정일: ${formatDate(selectedPost.updatedAt)}`}
                </p>
                <hr />
                <p style={{ whiteSpace: "pre-wrap", marginTop: "20px" }}>
                  {selectedPost.content}
                </p>

                {/* ✅ 수정/삭제 버튼: 작성자만 보이도록 */}
                {userName === selectedPost.author && (
                  <>
                    <button
                      onClick={() => setConfirmDelete(selectedPost)}
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
                    <div
                      style={{
                        textAlign: "right",
                        marginTop: "15px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditingPostId(selectedPost.id);
                          setEditData({
                            title: selectedPost.title,
                            content: selectedPost.content,
                          });
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

                      {/* ✅ 새로 추가된 닫기 버튼 */}
                      <button
                        onClick={() => {
                          setSelectedPost(null);
                          setEditingPostId(null);
                        }}
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

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
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
            zIndex: 1100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <p>정말 삭제하시겠습니까?</p>
            <div style={{ textAlign: "right", marginTop: "15px" }}>
              <button
                onClick={() => deleteBoard(confirmDelete.id)}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  padding: "6px 12px",
                  marginRight: "8px",
                }}
              >
                예
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
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
            <h2>게시글 작성</h2>
            <input
              type="text"
              placeholder="제목"
              value={newPost.title}
              onChange={(e) =>
                setNewPost({ ...newPost, title: e.target.value })
              }
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
              value={newPost.content}
              onChange={(e) =>
                setNewPost({ ...newPost, content: e.target.value })
              }
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
                  createBoard();
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

      {/* 오른쪽 아래 + 버튼 */}
      {(userClassification === "심사원" ||
        userClassification === "관리자") && (
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

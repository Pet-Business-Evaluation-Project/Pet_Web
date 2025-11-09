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
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        storedLoginID = parsed.loginID || "";
        storedUserName = parsed.name || "";
      } catch (e) {
        console.error("localStorage parsing error:", e);
      }
    }
  }

  const [loginID, setLoginID] = useState(storedLoginID);
  const [userName, setUserName] = useState(storedUserName);
  const [boards, setBoards] = useState<CommunityPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState<CommunityRequestDto>({
    loginID: storedLoginID,
    title: "",
    content: "",
  });

  // 수정 상태
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ title: string; content: string }>({
    title: "",
    content: "",
  });

  /** 전체 게시글 가져오기 */
  const fetchAllBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error("게시글 목록 조회 실패");
      const data: CommunityPost[] = await res.json();
      setBoards(data);
    } catch (err: any) {
      setError(err.message);
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

    try {
      const res = await fetch(`${BASE_URL}/create/${loginID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) throw new Error("게시글 작성 실패");

      await fetchAllBoards();
      setNewPost({ loginID, title: "", content: "" });
    } catch (err: any) {
      alert(err.message);
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
    } catch (err: any) {
      alert(err.message);
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

      // 서버에서 갱신된 게시글 받아오기
      const updatedPost: CommunityPost = await res.json();

      // boards와 selectedPost 업데이트
      setBoards((prev) => prev.map((b) => (b.id === id ? updatedPost : b)));
      setSelectedPost(updatedPost);

      setEditingPostId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchAllBoards();
  }, []);

  /** 날짜를 한국 시간으로 변환 */
  const formatToKST = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Date(date.getTime() + 9 * 60 * 60 * 1000).toLocaleString();
  };

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        color: "#222",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        position: "relative",
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
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h2>전체 게시글</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {boards.map((b) => (
            <React.Fragment key={b.id}>
              <li
                onClick={() =>
                  setSelectedPost((prev) => (prev?.id === b.id ? null : b))
                }
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "10px 0",
                  cursor: "pointer",
                }}
              >
                <strong style={{ color: "#007bff" }}>{b.title}</strong>{" "}
                <span style={{ color: "#555" }}>
                  — {b.author} ({formatToKST(b.createdAt)})
                  {b.updatedAt !== b.createdAt && (
                    <> | 수정됨: {formatToKST(b.updatedAt)}</>
                  )}
                </span>
              </li>

              {selectedPost?.id === b.id && (
                <div
                  style={{
                    backgroundColor: "#fafafa",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "10px",
                    margin: "10px 0 20px 0",
                  }}
                >
                  {/* 수정 모드 */}
                  {editingPostId === b.id ? (
                    <div>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                          marginBottom: "8px",
                        }}
                      />
                      <textarea
                        value={editData.content}
                        onChange={(e) =>
                          setEditData({ ...editData, content: e.target.value })
                        }
                        style={{
                          width: "100%",
                          height: "100px",
                          padding: "8px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                        }}
                      />
                      <div style={{ marginTop: "10px", textAlign: "right" }}>
                        <button
                          onClick={() => updateBoard(b.id)}
                          style={{
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "5px 10px",
                            marginRight: "8px",
                            cursor: "pointer",
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
                            padding: "5px 10px",
                            cursor: "pointer",
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ whiteSpace: "pre-wrap" }}>{b.content}</p>
                      {userName === b.author && (
                        <div style={{ marginTop: "10px", textAlign: "right" }}>
                          <button
                            onClick={() => {
                              setEditingPostId(b.id);
                              setEditData({ title: b.title, content: b.content });
                            }}
                            style={{
                              backgroundColor: "#ffc107",
                              border: "none",
                              borderRadius: "5px",
                              padding: "5px 10px",
                              color: "white",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          >
                            ✏️ 수정
                          </button>
                          <button
                            onClick={() => deleteBoard(b.id)}
                            style={{
                              backgroundColor: "#dc3545",
                              border: "none",
                              borderRadius: "5px",
                              padding: "5px 10px",
                              color: "white",
                              cursor: "pointer",
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>

      {/* 오른쪽 아래 + 버튼 */}
      <button
        onClick={() => {
          const modal = document.getElementById("writeModal");
          if (modal) modal.style.display = "flex";
        }}
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

      {/* 작성 모달 */}
      <div
        id="writeModal"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            maxWidth: "600px",
            width: "90%",
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
              height: "100px",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <button
              onClick={() => {
                createBoard();
                document.getElementById("writeModal")!.style.display = "none";
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
              onClick={() =>
                (document.getElementById("writeModal")!.style.display = "none")
              }
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
    </div>
  );
}

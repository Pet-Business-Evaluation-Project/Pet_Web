"use client";

import { useState, useEffect } from "react";
import Button from "../components/Button/Button";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [user, setUser] = useState<User | null>(null); // ✅ 로그인 사용자

  // ✅ 페이지 로드시 localStorage에서 게시글 + 로그인 정보 불러오기
  useEffect(() => {
    const storedPosts = localStorage.getItem("communityPosts");
    const storedUser = localStorage.getItem("user");

    if (storedPosts) setPosts(JSON.parse(storedPosts));
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // ✅ 게시글 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("communityPosts", JSON.stringify(posts));
  }, [posts]);

  // ✅ 글쓰기 버튼 클릭 (로그인 확인)
  const handleWriteClick = () => {
    if (!user) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      return;
    }
    setIsWriting(true);
  };

  // ✅ 글 등록
  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    if (!user) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      title,
      content,
      author: user.name, // ✅ 로그인 사용자 이름 자동 입력
      date: new Date().toLocaleString(),
    };

    setPosts([newPost, ...posts]);
    setTitle("");
    setContent("");
    setIsWriting(false);
  };

  // ✅ 글 삭제
  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      const updatedPosts = posts.filter((post) => post.id !== id);
      setPosts(updatedPosts);
      localStorage.setItem("communityPosts", JSON.stringify(updatedPosts));
      setSelectedPost(null);
    }
  };

  // ✅ 글 수정
  const handleUpdate = () => {
    if (!editingPost) return;
    const updatedPosts = posts.map((p) =>
      p.id === editingPost.id ? editingPost : p
    );
    setPosts(updatedPosts);
    setEditingPost(null);
    setSelectedPost(editingPost);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6 lg:px-32">
      <h1 className="text-3xl font-bold mb-6 text-center">커뮤니티 게시판</h1>

      {/* ✅ 로그인한 사용자만 글쓰기 가능 */}
      {!isWriting && !selectedPost && (
        <div className="flex justify-end mb-4">
          <Button label="글쓰기" onClick={handleWriteClick} />
        </div>
      )}

      {/* ✅ 글쓰기 폼 */}
      {isWriting && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">새 게시글 작성</h2>

          <p className="text-gray-600 mb-2">
            작성자: <span className="font-semibold">{user?.name ?? "익명"}</span>
          </p>

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md p-2 mb-3"
          />
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full border rounded-md p-2 mb-4 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button label="취소" onClick={() => setIsWriting(false)} />
            <Button label="등록" onClick={handleSubmit} />
          </div>
        </div>
      )}

      {/* ✅ 게시글 상세보기 */}
      {selectedPost && !editingPost && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">{selectedPost.title}</h2>
          <p className="text-gray-600 mb-4">
            {selectedPost.author} • {selectedPost.date}
          </p>
          <p className="whitespace-pre-line text-gray-800 mb-6">
            {selectedPost.content}
          </p>
          <div className="flex justify-end gap-3">
            <Button label="뒤로가기" onClick={() => setSelectedPost(null)} />
            <Button label="수정" onClick={() => setEditingPost(selectedPost)} />
            <Button label="삭제" onClick={() => handleDelete(selectedPost.id)} />
          </div>
        </div>
      )}

      {/* ✅ 게시글 수정 모드 */}
      {editingPost && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">게시글 수정</h2>
          <input
            type="text"
            value={editingPost.title}
            onChange={(e) =>
              setEditingPost({ ...editingPost, title: e.target.value })
            }
            className="w-full border rounded-md p-2 mb-3"
          />
          <textarea
            value={editingPost.content}
            onChange={(e) =>
              setEditingPost({ ...editingPost, content: e.target.value })
            }
            rows={6}
            className="w-full border rounded-md p-2 mb-4 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button label="취소" onClick={() => setEditingPost(null)} />
            <Button label="완료" onClick={handleUpdate} />
          </div>
        </div>
      )}

      {/* ✅ 게시글 목록 */}
      {!isWriting && !selectedPost && (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-xl font-bold">{post.title}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {post.author} • {post.date}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              게시글 쓰기는 되지만 저장은 아직 구현되지않았습니다. 회원사 페이지도 구현되지않았습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

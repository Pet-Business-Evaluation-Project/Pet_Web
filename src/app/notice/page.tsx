"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button/Button";

interface Notice {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
}

interface User {
  name: string;
  loginID: string;
  classification: string; // 관리자 / 심사원 / 기업
}

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // ✅ localStorage에서 유저정보 + 공지 불러오기
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedNotices = localStorage.getItem("notices");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedNotices) setNotices(JSON.parse(storedNotices));
  }, []);

  // ✅ 공지 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem("notices", JSON.stringify(notices));
  }, [notices]);

  const canWrite = user?.classification === "관리자";

  // ✅ 글 등록
  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    const newNotice: Notice = {
      id: Date.now(),
      title,
      content,
      author: user?.name || "관리자",
      date: new Date().toLocaleString(),
    };

    setNotices([newNotice, ...notices]);
    setTitle("");
    setContent("");
    setIsWriting(false);
  };

  // ✅ 글 삭제
  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      const updated = notices.filter((n) => n.id !== id);
      setNotices(updated);
      setSelectedNotice(null);
    }
  };

  // ✅ 글 수정 완료
  const handleUpdate = () => {
    if (!editingNotice) return;
    const updated = notices.map((n) =>
      n.id === editingNotice.id ? editingNotice : n
    );
    setNotices(updated);
    setEditingNotice(null);
    setSelectedNotice(editingNotice);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-10 px-6 lg:px-32">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        📢 공지사항
      </h1>

      {/* ✅ 관리자만 글쓰기 가능 */}
      {canWrite && !isWriting && !selectedNotice && (
        <div className="flex justify-end mb-4">
          <Button
            label="✏️ 글쓰기"
            onClick={() => setIsWriting(true)}
            className="!bg-blue-600 hover:!bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow"
          />
        </div>
      )}

      {/* ✅ 글쓰기 모달 */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-[90%] max-w-lg shadow-2xl relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">📝 새 공지 작성</h2>
              <p className="text-sm text-gray-600 mb-3">
                작성자: <span className="font-semibold">{user?.name ?? "관리자"}</span>
              </p>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <textarea
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full border rounded-lg p-3 mb-4 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsWriting(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                >
                  등록
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ 상세보기 */}
      {selectedNotice && !editingNotice && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800">{selectedNotice.title}</h2>
          <p className="text-gray-600 text-sm mb-4">
            {selectedNotice.author} • {selectedNotice.date}
          </p>
          <p className="whitespace-pre-line text-gray-800 mb-6">
            {selectedNotice.content}
          </p>
          <div className="flex justify-end gap-3">
            <Button label="뒤로가기" onClick={() => setSelectedNotice(null)} />
            {canWrite && (
              <>
                <Button label="수정" onClick={() => setEditingNotice(selectedNotice)} />
                <Button label="삭제" onClick={() => handleDelete(selectedNotice.id)} />
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ✅ 수정 모드 */}
      {editingNotice && (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">공지 수정</h2>
          <input
            type="text"
            value={editingNotice.title}
            onChange={(e) =>
              setEditingNotice({ ...editingNotice, title: e.target.value })
            }
            className="w-full border rounded-lg p-3 mb-3"
          />
          <textarea
            value={editingNotice.content}
            onChange={(e) =>
              setEditingNotice({ ...editingNotice, content: e.target.value })
            }
            rows={6}
            className="w-full border rounded-lg p-3 mb-4 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button label="취소" onClick={() => setEditingNotice(null)} />
            <Button label="완료" onClick={handleUpdate} />
          </div>
        </div>
      )}

      {/* ✅ 기본 고정 공지 (KCCI 심사원 소개) */}
      {!isWriting && !selectedNotice && !editingNotice && (
        <section className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition duration-500 hover:shadow-3xl hover:scale-[1.01] border border-blue-100 mb-10">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 text-white border-b-4 border-blue-800">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center tracking-tight">
              KCCI 심사원 회원가입 방법
            </h2>
          </div>
          <div className="p-8 md:p-12 lg:p-16 space-y-8 text-gray-700 text-lg leading-relaxed">
            <p className="border-l-4 border-blue-500 pl-4">
              반려동물 산업의 지속적인 성장에 발맞춰, 기업과 제품의 수준을 체계적으로 평가할 수 있는 
              <span className="font-bold text-blue-600 ml-1">전문 심사원 양성 과정</span>입니다.
            </p>
            <div className="bg-blue-50/70 rounded-xl p-6 lg:p-8 shadow-inner">
              <p className="font-semibold text-gray-800 mb-3 text-xl">
                💡 KCCI 한국기업인증원이 추구하는 인재상:
              </p>
              <p className="text-gray-800 text-xl font-medium">
                단순한 '심사원'을 넘어, 기업의 가치를 발굴하고 성공을 함께 설계하는 
                <span className="font-extrabold text-indigo-600 block mt-1">
                  '가치 순환 전문가'
                </span>를 양성합니다.
              </p>
            </div>
            <p className="text-center text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
              시장의 트렌드를 읽는 <span className="text-indigo-600">통찰력</span>과 KCCI의 인증 시스템을 마스터하여,
              <br className="hidden sm:inline" /> 반려동물 산업을 이끌어 나갈 <span className="text-blue-600">차세대 전문가</span>로 도약하십시오.
            </p>
          </div>
        </section>
      )}

      {/* ✅ 공지 목록 */}
      {!isWriting && !selectedNotice && !editingNotice && (
        <div className="space-y-4">
          {notices.length > 0 ? (
            notices.map((n) => (
              <motion.div
                key={n.id}
                onClick={() => setSelectedNotice(n)}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold text-gray-800">{n.title}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {n.author} • {n.date}
                </p>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-gray-500">등록된 공지가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

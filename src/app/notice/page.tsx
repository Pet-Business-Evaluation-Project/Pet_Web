"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
  classification: string;
}

interface ButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

const Button = ({ label, onClick, className = "" }: ButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition ${className}`}
  >
    {label}
  </button>
);

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedNotices = localStorage.getItem("notices");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedNotices) setNotices(JSON.parse(storedNotices));
  }, []);

  useEffect(() => {
    localStorage.setItem("notices", JSON.stringify(notices));
  }, [notices]);

  const canWrite = user?.classification === "관리자";

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

  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      const updated = notices.filter((n) => n.id !== id);
      setNotices(updated);
      setSelectedNotice(null);
    }
  };

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

      {canWrite && !isWriting && !selectedNotice && (
        <div className="flex justify-end mb-4">
          <Button
            label="✏️ 글쓰기"
            onClick={() => setIsWriting(true)}
            className="!bg-blue-600 hover:!bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow"
          />
        </div>
      )}

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

      {selectedNotice && !editingNotice && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto"
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{selectedNotice.title}</h2>
            <p className="text-blue-100 text-sm">
              {selectedNotice.author} • {selectedNotice.date}
            </p>
          </div>
          
          {/* 내용 영역 */}
          <div className="p-8">     
            {/* 본문 */}
            <div className="prose max-w-none">
       
              {/* 추가 섹션 (고정 공지에만 표시) */}
              {selectedNotice.id === 0 && (
                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                      우측 상단 회원가입 클릭
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
                      <Image 
                        src="/img/notice1.png" 
                        alt="회원가입 버튼"
                        width={800}
                        height={400}
                        className="max-w-2xl w-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="border-l-4 border-indigo-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                      동의 약관 읽은 후 동의 약관 체크 후 넘어가기
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
                      <Image 
                        src="/img/notice2.png" 
                        alt="약관 동의"
                        width={800}
                        height={400}
                        className="max-w-2xl w-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                      심사원 가입 클릭
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
                      <Image 
                        src="/img/notice3.png" 
                        alt="심사원 가입"
                        width={600}
                        height={400}
                        className="max-w-md w-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>

                  {/* Step 4 - 입력 정보 */}
                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                      회원 정보 입력
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
                      <Image 
                        src="/img/notice4.png" 
                        alt="회원 정보 입력"
                        width={600}
                        height={800}
                        className="max-w-md w-full rounded-lg shadow-md"
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg mt-4">
                      <h4 className="font-bold text-gray-800 mb-3 text-lg">📝 입력 정보 안내</h4>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><strong>이름:</strong> 3글자 이상 이름</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><strong>아이디:</strong> 중복 불가, 4자 이상</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><strong>비밀번호:</strong> 영문, 숫자, 특수문자를 포함한 8자 이상</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><strong>휴대폰:</strong> 01012345678</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><strong>주민등록번호:</strong> 앞6자리 + 뒷1자리</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span><strong>추천인ID:</strong> 회원가입된 회원의 ID</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* 추가 안내 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center gap-2">
                      💡 추가 안내사항
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                        회원가입 최초시 심사원 등급은 자동으로 심사원보가 됩니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 버튼 영역 */}
          <div className="px-8 pb-8 flex justify-end gap-3">
            <Button label="뒤로가기" onClick={() => setSelectedNotice(null)} />
            {canWrite && selectedNotice.id !== 0 && (
              <>
                <Button label="수정" onClick={() => setEditingNotice(selectedNotice)} />
                <Button label="삭제" onClick={() => handleDelete(selectedNotice.id)} />
              </>
            )}
          </div>
        </motion.div>
      )}

      {editingNotice && (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
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

      {!isWriting && !selectedNotice && !editingNotice && (
        <>
          <motion.div
            onClick={() =>
              setSelectedNotice({
                id: 0,
                title: "📌 KCCI 심사원 회원가입 방법",
                content: `심사원 회원가입 절차를 안내드립니다.`,
                author: "KCCI 관리자",
                date: "2025. 11. 06.",
              })
            }
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition border-2 border-blue-200 mb-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📌</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">KCCI 심사원 회원가입 방법</h3>
                <p className="text-gray-500 text-sm mt-1">KCCI 관리자 • 2025. 11. 06.</p>
              </div>
            </div>
          </motion.div>

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
        </>
      )}
    </div>
  );
}
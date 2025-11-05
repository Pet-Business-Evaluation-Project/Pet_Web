"use client";

import { useState } from "react";

export default function MemberRegisterPage() {
  const [representative, setRepresentative] = useState("");
  const [company, setCompany] = useState("");
  const [manager, setManager] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 🔹 실제 서버 요청은 아직 없음 (보여주기용)
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-10">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          회원사 등록
        </h1>
        <p className="text-gray-600 text-center mb-10">
          아래 정보를 입력하여 회원사 등록 요청을 진행하세요.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 대표명 */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                대표명
              </label>
              <input
                type="text"
                value={representative}
                onChange={(e) => setRepresentative(e.target.value)}
                placeholder="대표자 이름을 입력하세요"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            {/* 기업명 */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                기업명
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="기업명을 입력하세요"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                담당자
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="담당자 이름을 입력하세요"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            {/* 첨부파일 */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                첨부파일
              </label>

              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <input
                  type="file"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />

                <div className="mt-3 text-sm text-gray-600 border-t pt-3">
                  {file ? (
                    <span className="font-medium text-blue-700">
                      선택된 파일: {file.name}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">
                      선택된 파일 없음
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="text-center pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-all"
              >
                등록 요청
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              등록 요청이 완료되었습니다!
            </h2>
            <p className="text-gray-600">
              관리자가 확인 후 승인 절차를 진행할 예정입니다.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              다시 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


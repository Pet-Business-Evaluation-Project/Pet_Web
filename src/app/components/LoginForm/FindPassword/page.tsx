"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import FindreviewerPassword from "./FindreviewerPassword/page";
import ChangeReviewerPassword from "./FindreviewerPassword/ChangeReviewerPassword/page";
import FindmemberPassword from "./FindmemberPassword/page";

export default function FindPassword() {
  
  // 심사원 비밀번호 찾기 플로우 상태
  const [showReviewerFlow, setShowReviewerFlow] = useState<boolean>(false);
  const [reviewerStep, setReviewerStep] = useState<number>(1);
  const [reviewerUserId, setReviewerUserId] = useState<number | null>(null);

  // 심사원 1단계 인증 성공 시
  const handleReviewerAuthSuccess = (userId: number) => {
    setReviewerUserId(userId);
    setReviewerStep(2);
  };

  // 심사원 비밀번호 변경 완료 시
  const handleReviewerPasswordChangeSuccess = () => {
    // 🚨 수정된 부분: URL 중복 문제를 피하기 위해 window.location.href 사용 및 '/home'으로 절대 경로 지정
    alert('비밀번호가 성공적으로 변경되었습니다. 홈 페이지로 이동합니다.');
    window.location.href = '/'; // 홈 페이지로 이동
  };

  // 심사원 플로우 닫기
  const handleReviewerClose = () => {
    setShowReviewerFlow(false);
    setReviewerStep(1);
    setReviewerUserId(null);
  };

  // 심사원 비밀번호 찾기 시작
  const startReviewerFlow = () => {
    setShowReviewerFlow(true);
    setReviewerStep(1);
  };

  // 기업 비밀번호 찾기 버튼 클릭 시
  const handleMemberFlowClick = () => {
    // 🚨 수정된 부분: URL 중복 문제를 피하기 위해 window.location.href 사용 및 절대 경로 지정
    // URL을 http://localhost:3000/components/LoginForm/FindPassword/FindmemberPassword 로 이동시키려면
    // 단순히 '/components/LoginForm/FindPassword/FindmemberPassword'로 절대 경로를 지정해야 합니다.
    window.location.href = "/components/LoginForm/FindPassword/FindmemberPassword";
  };


  // 메인 화면 렌더링
  if (!showReviewerFlow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-3xl font-bold mb-12">비밀번호 찾기</h1>

        <div className="flex gap-8">
          {/* 1. 심사원 비밀번호 찾기 버튼 */}
          <button
            onClick={startReviewerFlow}
            className="bg-gray-300 hover:bg-gray-400 text-lg font-medium px-12 py-6 rounded shadow transition duration-150"
          >
            심사원 비밀번호 찾기
          </button>

          {/* 2. 판매 기업 비밀번호 찾기 버튼 */}
          <button
            onClick={handleMemberFlowClick} // 수정된 핸들러 사용
            className="bg-gray-300 hover:bg-gray-400 text-lg font-medium px-12 py-6 rounded shadow transition duration-150"
          >
            기업 비밀번호 찾기
          </button>
        </div>
      </div>
    );
  }

  // 심사원 비밀번호 찾기 플로우 렌더링
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 box-border">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 m-0">
            {reviewerStep === 1 ? '비밀번호 찾기' : '새 비밀번호 설정'}
          </h2>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none p-1"
            onClick={handleReviewerClose}
          >
            &times;
          </button>
        </div>

        {/* 단계별 컴포넌트 렌더링 */}
        {reviewerStep === 1 && (
          <FindreviewerPassword onAuthSuccess={handleReviewerAuthSuccess} handleClose={handleReviewerClose} />
        )}
        {reviewerStep === 2 && reviewerUserId && (
          <ChangeReviewerPassword 
            userId={reviewerUserId} 
            onPasswordChangeSuccess={handleReviewerPasswordChangeSuccess}
          />
        )}
      </div>
    </div>
  );
}
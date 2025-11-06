"use client";

import React, { useState, useMemo } from 'react';

// =========================================================================================
// 2. 🔒 ChangeReviewerPassword (2단계: 비밀번호 변경) 컴포넌트 - FindPassword 내부 정의
// =========================================================================================

interface ChangePasswordProps {
    userId: number;
    onPasswordChangeSuccess: () => void;
}

function ChangeReviewerPassword({ userId, onPasswordChangeSuccess }: ChangePasswordProps) {
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [isPasswordChanging, setIsPasswordChanging] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');


    // 두 비밀번호 일치 여부 확인
    const passwordsMatch = useMemo(() => {
        if (!newPassword || !confirmPassword) return true;
        return newPassword === confirmPassword;
    }, [newPassword, confirmPassword]);

    // 폼 제출 핸들러 (비밀번호 변경 버튼 클릭 시)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg('');

        if (!passwordsMatch) {
            setErrorMsg('새로운 비밀번호와 비밀번호 확인 값이 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 8) { // 최소 비밀번호 길이 설정 (예시)
            setErrorMsg('비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }

        setIsPasswordChanging(true);
        
        const requestData = {
            userId: userId, // 1단계에서 받은 userId 사용
            password: newPassword,
            confirmPassword: confirmPassword,
        };

        try {
            // 🚨 2단계 API 호출: 비밀번호 변경
            const response = await fetch('https://test.kcci.co.kr/back/findpassword/changepassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                // 성공 처리
                onPasswordChangeSuccess();
            } else if (response.status >= 400 && response.status < 500) {
                const errorBody = await response.json();
                setErrorMsg(errorBody.message || '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.');
            } else {
                setErrorMsg('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            }

        } catch (error) {
            console.error('비밀번호 변경 중 오류 발생:', error);
            setErrorMsg('네트워크 통신 중 오류가 발생했습니다.');
        } finally {
            setIsPasswordChanging(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* 1. 새로운 비밀번호 입력란 */}
            <div className="mb-5">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    새로운 비밀번호
                </label>
                <input
                    type="password"
                    id="new-password"
                    placeholder="새 비밀번호를 입력하세요 (최소 8자)"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
            </div>

            {/* 2. 비밀번호 확인 입력란 */}
            <div className="mb-5">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인
                </label>
                <input
                    type="password"
                    id="confirm-password"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    className={`w-full px-4 py-2 border rounded-md shadow-sm text-base ${
                        !passwordsMatch && confirmPassword
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                
                {/* ⚠️ 경고 메시지 (일치하지 않을 때) */}
                {!passwordsMatch && confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">
                        비밀번호가 다릅니다.
                    </p>
                )}
            </div>

            {/* 에러 메시지 표시 */}
            {errorMsg && (
                <p className="mb-4 text-sm text-red-600 font-medium text-center">
                    {errorMsg}
                </p>
            )}

            {/* 3. 비밀번호 변경 버튼 */}
            <div className="mt-8">
                <button
                    type="submit"
                    disabled={!passwordsMatch || isPasswordChanging || !newPassword || newPassword.length < 8} // 비활성화 조건 추가
                    className={`w-full py-3 font-semibold rounded-md shadow-md transition ease-in-out duration-150 ${
                        !passwordsMatch || !newPassword || newPassword.length < 8
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                >
                    {isPasswordChanging ? '변경 중...' : '비밀번호 변경'}
                </button>
            </div>
        </form>
    );
}
export default ChangeReviewerPassword;
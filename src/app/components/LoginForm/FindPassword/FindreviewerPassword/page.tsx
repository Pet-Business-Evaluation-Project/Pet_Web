"use client";

import React, { useState, useMemo } from "react";

// =========================================================================================
// 1. 🔑 FindreviewerPassword (1단계: 유저 인증) 컴포넌트 - FindPassword 내부 정의
// =========================================================================================

interface FindPasswordProps {
    onAuthSuccess: (userId: number) => void;
    // handleClose prop은 메인 컴포넌트에서 전달하지만, 실제 이 컴포넌트 내에서는 사용되지 않을 수 있습니다.
    handleClose: () => void; 
}

function FindreviewerPassword({ onAuthSuccess }: FindPasswordProps) {
    const [userId, setUserId] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    // 실제 백엔드로 전송할 값 (마스킹된 문자열, 예: "000622-3******")
    const [residentId, setResidentId] = useState<string>(''); 
    // 사용자 화면에 표시할 마스킹된 값
    const [displayedSsn, setDisplayedSsn] = useState<string>(''); 
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');

    // 주민번호 입력 변경 핸들러 (마스킹 로직)
    const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

        if (input.length > 13) {
            input = input.substring(0, 13);
        }

        let formattedSsn = '';

        if (input.length > 6) {
            formattedSsn += input.substring(0, 6) + '-';
            formattedSsn += input.substring(6, 7);
            const remainingStars = 6;
            formattedSsn += '*'.repeat(remainingStars);
            
        } else {
            formattedSsn = input;
        }

        setDisplayedSsn(formattedSsn);
        setResidentId(formattedSsn); 
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // 유효성 검사: 마스킹된 최종 문자열 (6+1+7 = 14자리) 완성 확인
        if (residentId.length !== 14 || residentId.charAt(6) !== '-') {
            setErrorMsg('주민등록번호는 앞 6자리와 뒤 1자리를 입력하여 전체 14자리를 완성해야 합니다.');
            return;
        }
        
        setIsLoading(true);
        setErrorMsg('');
        
        const requestData = {
            loginID: userId,
            phnum: phoneNumber,
            ssn: residentId,
        };
        
        try {
            // 🚨 1단계 API 호출: 사용자 인증
            const response = await fetch('http://petback.hysu.kr/back/findpassword/check', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (response.ok) { 
                const data = await response.json();
                onAuthSuccess(data.userId); // 2단계로 전환
                
            } else if (response.status >= 400 && response.status < 500) {
                const errorBody = await response.json();
                setErrorMsg(errorBody.message || '입력하신 정보가 일치하는 사용자가 없습니다.'); 
            } else {
                 setErrorMsg('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            }

        } catch (error) {
            console.error('인증 요청 실패:', error);
            setErrorMsg('네트워크 통신 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* 아이디 필드 */}
            <div className="mb-5">
                <label htmlFor="user-id" className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                <input
                    type="text" id="user-id" placeholder="아이디를 입력하세요" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={userId} onChange={(e) => setUserId(e.target.value)}
                />
            </div>
            {/* 휴대폰 번호 필드 */}
            <div className="mb-5">
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">휴대폰 번호</label>
                <input
                    type="text" id="phone-number" placeholder="01012345678 또는 010-1234-5678" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>
            {/* 주민등록번호 필드 (마스킹 적용) */}
            <div className="mb-8">
                <label htmlFor="resident-id" className="block text-sm font-medium text-gray-700 mb-2">주민등록번호</label>
                <input
                    type="text" id="resident-id" placeholder="앞 6자리-뒷 1자리까지 (예: 010101-3******)" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    maxLength={14} 
                    value={displayedSsn} 
                    onChange={handleSsnChange}
                />
            </div>

            {/* 에러 메시지 표시 */}
            {errorMsg && (
                <p className="mb-4 text-sm text-red-600 font-medium text-center">
                    {errorMsg}
                </p>
            )}

            {/* 제출 버튼 */}
            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 font-semibold rounded-md shadow-md transition ease-in-out duration-150 ${
                    isLoading 
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
            >
                {isLoading ? '사용자 확인 중...' : '비밀번호 변경하러 가기'}
            </button>
        </form>
    );
}
export default FindreviewerPassword;
"use client";

import React, { useState, useRef } from "react";

// =========================================================================================
// 1. 🔑 FindreviewerPassword (1단계: 유저 인증) 컴포넌트
// =========================================================================================

interface FindPasswordProps {
    onAuthSuccess: (userId: number) => void;
    handleClose: () => void; 
}

function FindreviewerPassword({ onAuthSuccess }: FindPasswordProps) {
    const [userId, setUserId] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [ssnInput, setSsnInput] = useState<string>(''); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    // 화면에 표시할 값 계산
    const getDisplayValue = () => {
        if (ssnInput.length === 7) {
            const front = ssnInput.substring(0, 6);
            const back = ssnInput.substring(6, 7);
            return `${front}-${back}${'*'.repeat(6)}`;
        }
        return ssnInput;
    };

    // 마스킹된 주민번호 생성 (API 전송용)
    const getMaskedSsn = () => {
        if (ssnInput.length === 7) {
            const front = ssnInput.substring(0, 6);
            const back = ssnInput.substring(6, 7);
            return `${front}-${back}${'*'.repeat(6)}`;
        }
        return '';
    };

    // 키보드 이벤트 핸들러 (백스페이스 처리)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && ssnInput.length > 0) {
            e.preventDefault();
            setSsnInput(prev => prev.slice(0, -1));
        }
    };

    // 입력 변경 핸들러
    const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cursorPosition = e.target.selectionStart || 0;
        const prevLength = getDisplayValue().length;
        
        const input = e.target.value.replace(/[^0-9]/g, '');

        // 이전 입력보다 길이가 늘어난 경우에만 새 입력 추가
        if (input.length > ssnInput.length) {
            // 최대 7자리까지만 허용
            if (input.length <= 7) {
                setSsnInput(input);
            }
        }
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (ssnInput.length !== 7) {
            setErrorMsg('주민등록번호는 앞 6자리와 뒤 1자리를 모두 입력해야 합니다.');
            return;
        }
        
        setIsLoading(true);
        setErrorMsg('');
        
        const requestData = {
            loginID: userId,
            phnum: phoneNumber,
            ssn: getMaskedSsn(),
        };
        
        try {
            const response = await fetch(`https://www.kcci.co.kr/back/findpassword/check`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (response.ok) { 
                const data = await response.json();
                onAuthSuccess(data.userId);
                
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
                    type="text" 
                    id="user-id" 
                    placeholder="아이디를 입력하세요" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)}
                />
            </div>
            
            {/* 휴대폰 번호 필드 */}
            <div className="mb-5">
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">휴대폰 번호</label>
                <input
                    type="text" 
                    id="phone-number" 
                    placeholder="01012345678 또는 010-1234-5678" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>
            
            {/* 주민등록번호 필드 */}
            <div className="mb-8">
                <label htmlFor="resident-id" className="block text-sm font-medium text-gray-700 mb-2">주민등록번호</label>
                <input
                    ref={inputRef}
                    type="text" 
                    id="resident-id" 
                    placeholder="앞 6자리-뒷 1자리까지 (예: 010101-3******)" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={getDisplayValue()}
                    onChange={handleSsnChange}
                    onKeyDown={handleKeyDown}
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
'use client';

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowPopup(true);
    // 초기 위치를 왼쪽으로 설정
    const leftX = window.innerWidth * 0.15; // 화면 왼쪽에서 15% 위치
    const centerY = window.innerHeight / 2 - 300; // 600px / 2
    setPosition({ x: leftX, y: centerY });
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 닫기 버튼 클릭 시 드래그 방지
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <>
      {showPopup && (
        <div
          ref={popupRef}
          className="fixed z-50 cursor-move"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="relative bg-white shadow-2xl w-[450px] border border-gray-300">
            {/* 헤더 바 */}
            <div className="bg-gray-200 px-4 py-2 flex items-center justify-between border-b border-gray-300">
              <span className="text-sm font-medium text-gray-700">알림</span>
              <button
                onClick={closePopup}
                className="w-5 h-5 bg-gray-400 hover:bg-gray-500 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            {/* 팝업 이미지 */}
            <div>
              <Image
                src="/img/popupbanner.png"
                alt="반려동물 기업인증 심사원 교육과정"
                width={450}
                height={500}
                className="w-full h-auto"
              />
            </div>

            {/* 하단 버튼 영역 */}
            <div className="bg-white px-4 py-3 flex justify-end gap-2 border-t border-gray-300">

              <button
                onClick={closePopup}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded border border-gray-400"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-12 md:py-20">
        <section className="w-full flex flex-col items-center text-center px-4 mb-16">
          <div className="relative w-full max-w-5xl bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/img/Mainpagelogo.png"
              alt="한국기업인증원 로고"
              width={1400}
              height={700}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </section>

        <div className="flex flex-col md:flex-row w-full gap-8 px-4 max-w-7xl mx-auto">
          <section className="flex-1 bg-white py-12 px-8 text-center rounded-xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">심사원 소개</h2>
            <p className="text-gray-600 leading-relaxed">심사원에 대한 간단한 소개 문구가 들어갑니다.</p>
          </section>

          <section className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-8 text-center rounded-xl shadow-md border border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">회원사 소개</h2>
            <p className="text-gray-700 leading-relaxed">회원사 정보를 간단히 보여주는 영역입니다.</p>
          </section>

          <section className="flex-1 bg-gradient-to-br from-yellow-50 to-yellow-100 py-12 px-8 text-center rounded-xl shadow-md border border-yellow-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">회원사 등록</h2>
            <p className="text-gray-700 leading-relaxed">회원 등록 관련 안내 및 신청 영역입니다.</p>
          </section>
        </div>
      </div>
    </>
  );
}
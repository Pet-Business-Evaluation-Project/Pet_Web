'use client';

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    setShowPopup(false);
    // 모바일과 데스크톱에서 다른 위치 설정
    const isMobile = window.innerWidth < 768;
    const leftX = isMobile ? window.innerWidth * 0.05 : window.innerWidth * 0.15;
    const centerY = isMobile ? window.innerHeight * 0.1 : window.innerHeight / 2 - 300;
    setPosition({ x: leftX, y: centerY });
  }, []);

  const closePopup = () => setShowPopup(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <>
      {/* 팝업 */}
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
          <div className="relative bg-white shadow-2xl w-[280px] md:w-[450px] border border-gray-300">
            <div className="bg-gray-200 px-4 py-2 flex items-center justify-between border-b border-gray-300">
              <span className="text-sm font-medium text-gray-700">알림</span>
              <button
                onClick={closePopup}
                className="w-5 h-5 bg-gray-400 hover:bg-gray-500 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors duration-150"
              >
                ×
              </button>
            </div>

            <div>
              <Image
                src="/img/popupbanner.png"
                alt="반려동물 기업인증 심사원 교육과정"
                width={450}
                height={500}
                className="w-full h-auto"
                priority
              />
            </div>

            <div className="bg-white px-4 py-3 flex justify-end gap-2 border-t border-gray-300">
              <button
                onClick={closePopup}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded border border-gray-300 transition-colors duration-150"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-white border-t border-gray-200">
        {/* 로고 섹션 */}
        <section className="w-full flex flex-col items-center text-center px-4 mb-16">
          <div className="relative w-full max-w-5xl bg-gray-50 rounded-xl overflow-hidden shadow-lg border border-gray-100">
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

        {/* 버튼 영역 */}
        <div className="flex flex-col md:flex-row w-full gap-8 px-4 max-w-7xl mx-auto mb-16">
          {/* 심사원 소개 */}
          <section
            onClick={() => router.push("/reviewinfo")}
            className="flex-1 bg-white py-12 px-8 text-center rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              심사원 소개
            </h2>
          </section>

          {/* 회원사 소개 */}
          <section
            // onClick={() => router.push("/memberinfo")}
            className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-8 text-center rounded-xl shadow-lg border border-blue-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              회원사 소개
            </h2>
          </section>

          {/* 회원사 등록 */}
          <section
            onClick={() => router.push("/memberregister")}
            className="flex-1 bg-gradient-to-br from-indigo-50 to-indigo-100 py-12 px-8 text-center rounded-xl shadow-lg border border-indigo-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <h2 className="text-2xl font-bold mb-4 text-indigo-800">
              회원사 등록
            </h2>
          </section>
        </div>

        {/* 소개글 섹션 */}
        <section className="w-full max-w-5xl mx-auto px-4 mb-16">
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="space-y-6 text-gray-800">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  진심이 신뢰로 닿는 곳
                </h2>

                <div className="space-y-4 leading-relaxed text-base md:text-lg">
                  <p className="text-center font-semibold text-xl text-gray-900">
                    대표님의 <span className="text-blue-600">&apos;진심&apos;</span>을 어떻게 증명하시겠습니까?
                  </p>

                  <p className="text-gray-700">
                    우리는 진심을 다해 운영합니다. 하지만 소비자는 그 진심을 모릅니다.<br />
                    지금 시장에는 기준이 없습니다. 소비자는 불안하고, 진정성 있는 대표님들은 억울합니다.
                  </p>

                  <p className="text-gray-700">
                    &quot;우리는 다릅니다&quot;라고 백 번 말해도, 소비자를 설득시키기는 어렵습니다.
                  </p>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 my-6 border-l-4 border-blue-500">
                    <p className="font-semibold text-gray-900">
                      <span className="text-blue-600">KCCI</span>는 바로 이 문제를 해결하기 위해 만들어졌습니다.
                    </p>
                    <p className="mt-2 text-gray-700">
                      소비자가 안심하고 선택할 수 있도록. 대표님의 진심이 전해질 수 있도록.<br />
                      우리는 그 사이에 <span className="font-semibold text-blue-600">신뢰의 다리</span>를 놓고 싶었습니다.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    <span className="font-semibold text-gray-900">KCCI의 인증 마크</span>는 단순한 결과가 아닙니다.<br />
                    오늘만 잘하는 게 아니라, 내일도 모레도 같은 마음으로 고객을 대할 것이라는 약속입니다.<br />
                    대표님의 철학이 말에 그치지 않고, 일관되게 지켜진다는 증명입니다.
                  </p>

                  <p className="text-center font-semibold text-lg text-gray-900 italic py-4">
                    보이지 않던 진심을, 소비자가 믿을 수 있는 사실로 바꾸는 것.<br />
                    그것이 <span className="text-blue-600">KCCI 인증</span>의 의미입니다.
                  </p>

                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl p-6 my-6">
                    <p className="font-semibold text-lg mb-2">
                      우리는 대표님의 파트너입니다. 함께 성공을 만들어갑니다.
                    </p>
                    <p className="text-blue-50">
                      소비자는 신뢰할 수 있는 기업을 찾고, 대표님은 진정성을 인정받고,<br />
                      KCCI는 건강한 시장 문화를 만들어갑니다.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    대표님의 진심과 소비자의 신뢰 사이에 다리를 놓고,<br />
                    성실하게 운영하는 사업장이 정당한 평가를 받는 시장을 만듭니다.
                  </p>

                  <p className="text-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 pt-6">
                    진심이 신뢰로 닿는 곳, KCCI가 그 시작입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
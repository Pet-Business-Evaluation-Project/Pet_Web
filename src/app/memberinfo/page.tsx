'use client';

import { useState } from "react";

interface Member {
  id: number;
  name: string;
  description: string;
  emoji: string;
  details: string; // 🔹 추가: 상세 설명
}

export default function MemberInfoPage() {
  // ✅ 예시 데이터
  const members: Member[] = [
    {
      id: 1,
      name: "퍼피랜드",
      description: "반려견 맞춤형 케어 서비스를 제공합니다.",
      emoji: "🐶",
      details: "퍼피랜드는 반려견의 건강, 산책, 식단을 통합 관리하는 서비스를 제공합니다. 전국 50개 지점에서 전문 트레이너와 함께합니다.",
    },
    {
      id: 2,
      name: "캣하우스",
      description: "고양이 전문 용품 브랜드입니다.",
      emoji: "🐱",
      details: "캣하우스는 프리미엄 고양이 사료와 용품을 전문으로 하며, 고양이 맞춤형 제품을 연구·개발합니다.",
    },
    {
      id: 3,
      name: "펫닥터",
      description: "수의사와 함께하는 반려동물 건강 플랫폼.",
      emoji: "👩‍⚕️",
      details: "펫닥터는 실시간 수의사 상담과 건강 기록 관리 서비스를 제공하는 반려동물 헬스케어 플랫폼입니다.",
    },
    {
      id: 4,
      name: "러브펫",
      description: "사랑으로 돌보는 펫케어 전문기업.",
      emoji: "💖",
      details: "러브펫은 미용, 호텔, 산책, 케어 서비스를 통합 제공하는 반려동물 종합 케어 기업입니다.",
    },
    {
      id: 5,
      name: "펫스튜디오",
      description: "반려동물 촬영 전문 스튜디오입니다.",
      emoji: "📸",
      details: "펫스튜디오는 반려동물 전용 촬영 공간과 전문 사진작가 팀이 운영하는 프리미엄 포토 스튜디오입니다.",
    },
    {
      id: 6,
      name: "펫플러스",
      description: "프리미엄 펫푸드 브랜드.",
      emoji: "🍖",
      details: "펫플러스는 반려동물의 건강한 식습관을 위한 고단백, 저알러지 사료를 개발합니다.",
    },
    {
      id: 7,
      name: "펫모먼트",
      description: "감성 펫 액세서리 디자인 브랜드.",
      emoji: "🎀",
      details: "펫모먼트는 고급 소재와 감각적인 디자인으로 반려동물 패션을 선도합니다.",
    },
    {
      id: 8,
      name: "케이펫센터",
      description: "전국 반려동물 교육센터 운영.",
      emoji: "🏫",
      details: "케이펫센터는 전국 100여 개의 반려동물 교육기관을 운영하며, 훈련 및 사회화 프로그램을 제공합니다.",
    },
  ];

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-6">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">회원사 소개</h1>
        <p className="text-gray-600">
          KCCI와 함께하는 신뢰할 수 있는 파트너 기업들을 소개합니다.
        </p>
      </div>

      {/* ✅ 회원사 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 p-6 text-center cursor-pointer"
            onClick={() => setSelectedMember(member)} // ✅ 클릭 시 모달 열기
          >
            {/* 이모티콘 로고 */}
            <div className="text-6xl mb-4">{member.emoji}</div>

            {/* 회사 정보 */}
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {member.name}
            </h3>
            <p className="text-sm text-gray-600">{member.description}</p>
          </div>
        ))}
      </div>

      {/* ✅ 클릭 시 모달 표시 */}
      {selectedMember && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setSelectedMember(null)} // 바깥 클릭 시 닫기
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 w-11/12 max-w-md relative"
            onClick={(e) => e.stopPropagation()} // 내부 클릭은 닫히지 않게
          >
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setSelectedMember(null)}
            >
              ×
            </button>

            <div className="text-center">
              <div className="text-7xl mb-4">{selectedMember.emoji}</div>
              <h2 className="text-2xl font-bold mb-2">{selectedMember.name}</h2>
              <p className="text-gray-700 mb-4">{selectedMember.description}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{selectedMember.details}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewInfo() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* 메인 타이틀 */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            KCCI 심사원 소개
          </h1>
          <p className="text-gray-600 text-lg">
            한국기업인증원(KCCI)과 함께하는 전문 심사원 양성 과정
          </p>
          <div className="w-16 h-1 bg-gray-300 mt-4"></div>
        </header>

        {/* 핵심 메시지 섹션 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* 서브 타이틀 */}
          <div className="border-b border-gray-200 px-8 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              차별화된 전문가로 도약할 기회
            </h2>
          </div>
          
          {/* 본문 콘텐츠 */}
          <div className="p-8">
            <div className="space-y-8">
              
              {/* 과정 소개 */}
              <div>
                <p className="text-gray-700 leading-relaxed">
                  반려동물 산업의 지속적인 성장에 발맞춰, 기업과 제품의 수준을 체계적으로 평가할 수 있는 전문 심사원 양성 과정입니다.
                </p>
              </div>
              
              {/* 인재상 박스 */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex gap-3 mb-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    KCCI 한국기업인증원이 추구하는 인재상
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed ml-11">
                  단순한 &apos;심사원&apos;을 넘어, 기업의 가치를 발굴하고 성공을 함께 설계하는 
                  <span className="font-semibold text-gray-900"> &apos;가치 순환 전문가&apos;</span>를 양성합니다.
                </p>
              </div>
              
              {/* 비전 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">
                  시장의 트렌드를 읽는 <span className="font-semibold text-gray-900">통찰력</span>과 
                  KCCI의 인증 시스템을 마스터하여, 반려동물 산업을 이끌어 나갈 
                  <span className="font-semibold text-gray-900"> 차세대 전문가</span>로 도약하십시오.
                </p>
              </div>
              
            </div>
          </div>
        </section>

        {/* 추가 정보 섹션 (필요시) */}
        <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-8 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              교육 과정 안내
            </h2>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">체계적인 교육 프로그램</h3>
                  <p className="text-gray-600">전문 강사진의 실무 중심 교육으로 실전 역량을 키웁니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">인증 취득 지원</h3>
                  <p className="text-gray-600">교육 이수 후 KCCI 공식 심사원 자격을 취득할 수 있습니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">지속적인 성장 기회</h3>
                  <p className="text-gray-600">심사원 활동을 통해 업계 네트워크를 확장하고 전문성을 높입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
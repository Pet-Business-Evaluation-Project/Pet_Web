export default function ReviewInfo() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* 메인 타이틀 */}
        <header className="text-center mb-16 lg:mb-20">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
            KCCI 심사원 소개 
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            한국기업인증원(KCCI)과 함께하는 전문 심사원 양성 과정
          </p>
          <div className="w-24 h-1 mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
        </header>

        {/* 핵심 메시지 섹션 */}
        <section className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition duration-500 hover:shadow-3xl hover:scale-[1.01] border border-blue-100">
          
          {/* 하이라이트 배너 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 text-white border-b-4 border-blue-800">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center tracking-tight">
              차별화된 전문가로 도약할 기회!
            </h2>
          </div>
          
          {/* 본문 콘텐츠 */}
          <div className="p-8 md:p-12 lg:p-16">
            <div className="space-y-8 text-gray-700 text-lg leading-relaxed">
              
              <p className="border-l-4 border-blue-500 pl-4">
                반려동물 산업의 지속적인 성장에 발맞춰, 기업과 제품의 수준을 체계적으로 평가할 수 있는 
                <span className="font-bold text-blue-600 ml-1">전문 심사원 양성 과정</span>입니다.
              </p>
              
              {/* 강조 박스 - 가치 순환 전문가 */}
              <div className="bg-blue-50/70 rounded-xl p-6 lg:p-8 shadow-inner">
                <p className="font-semibold text-gray-800 mb-3 text-xl">
                  💡 KCCI 한국기업인증원이 추구하는 인재상:
                </p>
                <p className="text-gray-800 text-xl font-medium">
                  단순한 &apos;심사원&apos;을 넘어, 기업의 가치를 발굴하고 성공을 함께 설계하는 
                   <span className="font-extrabold text-indigo-600 block mt-1">
                    &apos;가치 순환 전문가&apos;
                  </span>를 양성합니다.
                </p>
              </div>
              
              <p className="text-center text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                시장의 트렌드를 읽는 <span className="text-indigo-600">통찰력</span>과 KCCI의 인증 시스템을 마스터하여,
                <br className="hidden sm:inline" /> 반려동물 산업을 이끌어 나갈 <span className="text-blue-600">차세대 전문가</span>로 도약하십시오.
              </p>
              
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
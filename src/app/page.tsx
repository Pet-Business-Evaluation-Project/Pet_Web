import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20">
      {/* 메인 이미지 섹션 */}
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
        {/* 심사원 소개 카드 */}
        <section className="flex-1 bg-white py-12 px-8 text-center rounded-xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">심사원 소개</h2>
          <p className="text-gray-600 leading-relaxed">심사원에 대한 간단한 소개 문구가 들어갑니다.</p>
        </section>

        {/* 회원사 소개 카드 */}
        <section className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-8 text-center rounded-xl shadow-md border border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">회원사 소개</h2>
          <p className="text-gray-700 leading-relaxed">회원사 정보를 간단히 보여주는 영역입니다.</p>
        </section>

        {/* 회원사 등록 카드 */}
        <section className="flex-1 bg-gradient-to-br from-yellow-50 to-yellow-100 py-12 px-8 text-center rounded-xl shadow-md border border-yellow-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">회원사 등록</h2>
          <p className="text-gray-700 leading-relaxed">회원 등록 관련 안내 및 신청 영역입니다.</p>
        </section>
      </div>
    </div>
  );
}
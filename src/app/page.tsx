export default function HomePage() {
  return (
  <div className="flex flex-col items-center justify-center py-20 space-y-10">
    <section className="w-full flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-4">사이트를 대표하는 사진 / 영상 첨부</h1>
        <div className="bg-gray-200 w-3/4 max-w-3xl h-64 flex items-center justify-center text-gray-600">
                 대표 이미지 또는 영상 영역
        </div>
    </section>


<div className="flex flex-row">
  <section className="flex-1 bg-white py-10 text-center">
    <h2 className="text-2xl font-semibold mb-6">협회 소개</h2>
    <p>협회에 대한 간단한 소개 문구가 들어갑니다.</p>
  </section>

  <section className="flex-1 bg-blue-50 py-10 text-center">
    <h2 className="text-2xl font-semibold mb-6">회원사 소개</h2>
    <p>회원사 정보를 간단히 보여주는 영역입니다.</p>
  </section>

  <section className="flex-1 bg-yellow-50 py-10 text-center">
    <h2 className="text-2xl font-semibold mb-6">회원사 등록</h2>
    <p>회원 등록 관련 안내 및 신청 영역입니다.</p>
  </section>
</div>

    </div>
  );
}

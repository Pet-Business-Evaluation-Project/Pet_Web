"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupAgree() {
  const router = useRouter();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleNext = () => {
    if (!agreeTerms || !agreePrivacy) {
      alert("모든 약관에 동의해야 회원가입을 진행할 수 있습니다.");
      return;
    }
    router.push("/signup"); // 다음 페이지 이동
  };

  const termsText = `제1장 총 칙
제1조 (목적)
이 약관은 한국인증협회(이하 "사이트"라 합니다)에서 제공하는 인터넷서비스(이하 "서비스"라 합니다)의 이용 조건 및 절차에 관한 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (약관의 효력 및 변경)
이 약관은 서비스 화면이나 기타의 방법으로 이용고객에게 공지함으로써 효력을 발생합니다.
사이트는 이 약관의 내용을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지 또는 통지함으로써 효력을 발생합니다.
제3조 (용어의 정의)
이 약관에서 사용하는 용어의 정의는 다음과 같습니다.

회원 : 사이트와 서비스 이용계약을 체결하거나 이용자 아이디(ID)를 부여받은 개인 또는 단체를 말합니다.
신청자 : 회원가입을 신청하는 개인 또는 단체를 말합니다.
아이디(ID) : 회원의 식별과 서비스 이용을 위하여 회원이 정하고 사이트가 승인하는 문자와 숫자의 조합을 말합니다.
비밀번호 : 회원이 부여 받은 아이디(ID)와 일치된 회원임을 확인하고, 회원 자신의 비밀을 보호하기 위하여 회원이 정한 문자와 숫자의 조합을 말합니다.
해지 : 사이트 또는 회원이 서비스 이용계약을 취소하는 것을 말합니다.
제2장 서비스 이용계약
제4조 (이용계약의 성립)
이용약관 하단의 동의 버튼을 누르면 이 약관에 동의하는 것으로 간주됩니다.
이용계약은 서비스 이용희망자의 이용약관 동의 후 이용 신청에 대하여 사이트가 승낙함으로써 성립합니다.
제5조 (이용신청)
신청자가 본 서비스를 이용하기 위해서는 사이트 소정의 가입신청 양식에서 요구하는 이용자 정보를 기록하여 제출해야 합니다.
가입신청 양식에 기재하는 모든 이용자 정보는 모두 실제 데이터인 것으로 간주됩니다. 실명이나 실제 정보를 입력하지 않은 사용자는 법적인 보호를 받을 수 없으며, 서비스의 제한을 받을 수 있습니다.
제6조 (이용신청의 승낙)
사이트는 신청자에 대하여 제2항, 제3항의 경우를 예외로 하여 서비스 이용신청을 승낙합니다.
사이트는 다음에 해당하는 경우에 그 신청에 대한 승낙 제한사유가 해소될 때까지 승낙을 유보할 수 있습니다.
서비스 관련 설비에 여유가 없는 경우
기술상 지장이 있는 경우
기타 사이트가 필요하다고 인정되는 경우
사이트는 신청자가 다음에 해당하는 경우에는 승낙을 거부할 수 있습니다.
다른 개인(사이트)의 명의를 사용하여 신청한 경우
이용자 정보를 허위로 기재하여 신청한 경우
사회의 안녕질서 또는 미풍양속을 저해할 목적으로 신청한 경우
기타 사이트 소정의 이용신청요건을 충족하지 못하는 경우
제7조 (이용자정보의 변경)
회원은 이용 신청시에 기재했던 회원정보가 변경되었을 경우에는, 온라인으로 수정하여야 하며 변경하지 않음으로 인하여 발생되는 모든 문제의 책임은 회원에게 있습니다.

제3장 계약 당사자의 의무
제8조 (사이트의 의무)
사이트는 회원에게 각 호의 서비스를 제공합니다.
신규서비스와 도메인 정보에 대한 뉴스레터 발송
추가 도메인 등록시 개인정보 자동 입력
도메인 등록, 관리를 위한 각종 부가서비스
사이트는 서비스 제공과 관련하여 취득한 회원의 개인정보를 회원의 동의없이 타인에게 누설, 공개 또는 배포할 수 없으며, 서비스관련 업무 이외의 상업적 목적으로 사용할 수 없습니다. 단, 다음 각 호의 1에 해당하는 경우는 예외입니다.
전기통신기본법 등 법률의 규정에 의해 국가기관의 요구가 있는 경우
범죄에 대한 수사상의 목적이 있거나 정보통신윤리 위원회의 요청이 있는 경우
기타 관계법령에서 정한 절차에 따른 요청이 있는 경우
사이트는 이 약관에서 정한 바에 따라 지속적, 안정적으로 서비스를 제공할 의무가 있습니다.
제9조 (회원의 의무)
회원은 서비스 이용 시 다음 각 호의 행위를 하지 않아야 합니다.
다른 회원의 ID를 부정하게 사용하는 행위
서비스에서 얻은 정보를 사이트의 사전승낙 없이 회원의 이용 이외의 목적으로 복제하거나 이를 변경, 출판 및 방송 등에 사용하거나 타인에게 제공하는 행위
사이트의 저작권, 타인의 저작권 등 기타 권리를 침해하는 행위
공공질서 및 미풍양속에 위반되는 내용의 정보, 문장, 도형 등을 타인에게 유포하는 행위
범죄와 결부된다고 객관적으로 판단되는 행위
기타 관계법령에 위배되는 행위
회원은 관계법령, 이 약관에서 규정하는 사항, 서비스 이용 안내 및 주의 사항을 준수하여야 합니다.
회원은 내용별로 사이트가 서비스 공지사항에 게시하거나 별도로 공지한 이용 제한 사항을 준수하여야 합니다.
제4장 서비스 제공 및 이용
제10조 (회원 아이디(ID)와 비밀번호 관리에 대한 회원의 의무)
아이디(ID)와 비밀번호에 대한 모든 관리는 회원에게 책임이 있습니다. 회원에게 부여된 아이디(ID)와 비밀번호의 관리소홀, 부정사용에 의하여 발생하는 모든 결과에 대한 전적인 책임은 회원에게 있습니다.
자신의 아이디(ID)가 부정하게 사용된 경우 또는 기타 보안 위반에 대하여, 회원은 반드시 사이트에 그 사실을 통보해야 합니다.
제11조 (서비스 제한 및 정지)
사이트는 전시, 사변, 천재지변 또는 이에 준하는 국가비상사태가 발생하거나 발생할 우려가 있는 경우와 전기통신사업법에 의한 기간통신 사업자가 전기통신서비스를 중지하는 등 기타 불가항력적 사유가 있는 경우에는 서비스의 전부 또는 일부를 제한하거나 정지할 수 있습니다.
사이트는 제1항의 규정에 의하여 서비스의 이용을 제한하거나 정지할 때에는 그 사유 및 제한기간 등을 지체없이 회원에게 알려야 합니다.
제5장 계약사항의 변경, 해지
제12조 (정보의 변경)
회원이 주소, 비밀번호 등 고객정보를 변경하고자 하는 경우에는 홈페이지의 회원정보 변경 서비스를 이용하여 변경할 수 있습니다.

제13조 (계약사항의 해지)
회원은 서비스 이용계약을 해지할 수 있으며, 해지할 경우에는 본인이 직접 서비스를 통하거나 전화 또는 온라인 등으로 사이트에 해지신청을 하여야 합니다. 사이트는 해지신청이 접수된 당일부터 해당 회원의 서비스 이용을 제한합니다. 사이트는 회원이 다음 각 항의 1에 해당하여 이용계약을 해지하고자 할 경우에는 해지조치 7일전까지 그 뜻을 이용고객에게 통지하여 소명할 기회를 주어야 합니다.

이용고객이 이용제한 규정을 위반하거나 그 이용제한 기간 내에 제한 사유를 해소하지 않는 경우
정보통신윤리위원회가 이용해지를 요구한 경우
이용고객이 정당한 사유 없이 의견진술에 응하지 아니한 경우
타인 명의로 신청을 하였거나 신청서 내용의 허위 기재 또는 허위서류를 첨부하여 이용계약을 체결한 경우 사이트는 상기 규정에 의하여 해지된 이용고객에 대해서는 별도로 정한 기간동안 가입을 제한할 수 있습니다.
제6장 손해배상
제14조 (면책조항)
사이트는 회원이 서비스 제공으로부터 기대되는 이익을 얻지 못하였거나 서비스 자료에 대한 취사선택 또는 이용으로 발생하는 손해 등에 대해서는 책임이 면제됩니다.
사이트는 회원의 귀책사유나 제3자의 고의로 인하여 서비스에 장애가 발생하거나 회원의 데이터가 훼손된 경우에 책임이 면제됩니다.
사이트는 회원이 게시 또는 전송한 자료의 내용에 대해서는 책임이 면제됩니다.
상표권이 있는 도메인의 경우, 이로 인해 발생할 수도 있는 손해나 배상에 대한 책임은 구매한 회원 당사자에게 있으며, 사이트는 이에 대한 일체의 책임을 지지 않습니다.
제15조 (관할법원)
서비스와 관련하여 사이트와 회원간에 분쟁이 발생할 경우 사이트의 본사 소재지를 관할하는 법원을 관할법원으로 합니다.

[부칙]
(시행일) 이 약관은 2020년 11월부터 시행합니다.

`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-12">
      <div className="w-full max-w-3xl bg-white p-10 rounded-2xl shadow-lg space-y-8">

        <section className="border border-gray-300 rounded-md">
          <header className="flex items-center bg-gray-100 p-3 border-b border-gray-300 font-semibold text-gray-800">
            <svg
              className="w-5 h-5 mr-2 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M3 4a1 1 0 011-1h5l2 2h7a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
            </svg>
            회원가입약관
          </header>
          <div className="p-6 max-h-60 overflow-y-auto bg-gray-50 text-gray-700 whitespace-pre-wrap">
            {termsText}
          </div>
          <div className="flex items-center p-3 border-t border-gray-300">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-5 h-5 text-blue-600 accent-blue-600 rounded"
            />
            <label htmlFor="agreeTerms" className="ml-2 text-gray-700 select-none">
              회원가입약관의 내용에 동의합니다.
            </label>
          </div>
        </section>

        <section className="border border-gray-300 rounded-md">
          <header className="flex justify-between items-center bg-gray-100 p-3 border-b border-gray-300 font-semibold text-gray-800">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              개인정보처리방침안내
            </div>
            
          </header>
          <div className="p-6 max-h-60 overflow-y-auto bg-gray-50 text-gray-700 text-sm">
            {/* 개인정보 처리방침 내용 */}
            <table className="w-full table-fixed border-collapse border border-gray-300 text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border border-gray-300 w-1/4">목적</th>
                  <th className="p-2 border border-gray-300 w-1/2">항목</th>
                  <th className="p-2 border border-gray-300 w-1/4">보유기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-gray-300 align-top">
                    이용자 식별 및 본인여부 확인
                  </td>
                  <td className="p-2 border border-gray-300 align-top">
                    아이디, 이름, 비밀번호 , 주민등록번호
                  </td>
                  <td className="p-2 border border-gray-300 align-top">회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 align-top">
                    고객서비스 이용에 관한 통지, CS대응을 위한 이용자 식별
                  </td>
                  <td className="p-2 border border-gray-300 align-top">
                    연락처 (이메일, 휴대전화번호)
                  </td>
                  <td className="p-2 border border-gray-300 align-top">회원 탈퇴 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center p-3 border-t border-gray-300">
            <input
              type="checkbox"
              id="agreePrivacy"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="w-5 h-5 text-blue-600 accent-blue-600 rounded"
            />
            <label htmlFor="agreePrivacy" className="ml-2 text-gray-700 select-none">
              개인정보처리방침안내의 내용에 동의합니다.
            </label>
          </div>
        </section>

        <button
          onClick={handleNext}
          disabled={!(agreeTerms && agreePrivacy)}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            agreeTerms && agreePrivacy
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
}

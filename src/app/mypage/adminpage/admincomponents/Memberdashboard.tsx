"use client";

import { useState, useEffect } from "react";
import { FaBuilding, FaTimes, FaEdit, FaEye } from "react-icons/fa";
import Button from "../../../components/Button/Button";

interface Company {
  userId: number;
  memberId: number;
  loginID: string;
  sno: string;
  address: string;
  phnum: string;
  referralID: string;
  name: string;
  email: string;
  companycls: string;
  introduction: string;
  mainsales: string; // 주요판매상품 추가
  createdAt: string;
}

interface EditableFields {
  email: string;
  companycls: string;
  introduction: string;
  mainsales: string; // 주요판매상품 추가
}

export default function MemberDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditableFields>({
    email: "",
    companycls: "",
    introduction: "",
    mainsales: "", // 주요판매상품 추가
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://www.kcci.co.kr/back/mypage/admin/members",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            classification: "관리자",
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      } else {
        console.error("Failed to fetch companies");
        alert("기업 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("기업 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 상세보기 모달 열기
  const openViewModal = (company: Company) => {
    setSelectedCompany(company);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // 수정 모달 열기
  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setEditData({
      email: company.email || "",
      companycls: company.companycls || "",
      introduction: company.introduction || "",
      mainsales: company.mainsales || "", // 주요판매상품 추가
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
    setIsEditMode(false);
  };

  // 수정 사항 저장
  const handleSave = async () => {
    if (!selectedCompany) return;

    try {
      const res = await fetch(
        "https://www.kcci.co.kr/back/mypage/admin/members/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            updates: [
              {
                member_id: selectedCompany.memberId,
                email: editData.email,
                companycls: editData.companycls,
                introduction: editData.introduction,
                mainsales: editData.mainsales, // 주요판매상품 추가
              },
            ],
          }),
        }
      );

      if (res.ok) {
        alert("기업 정보가 저장되었습니다.");
        closeModal();
        fetchCompanies();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  // 사업자 등록번호 포맷팅 (000-00-00000)
  const formatBusinessNumber = (sno: string) => {
    if (!sno) return "-";
    // 숫자만 추출
    const numbers = sno.replace(/\D/g, "");
    // 10자리인 경우 000-00-00000 형식으로
    if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(
        5
      )}`;
    }
    return sno; // 형식이 다르면 그대로 반환
  };

  return (
    <div className="flex-1 max-w-full p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaBuilding className="text-blue-500 w-6 h-6" /> 기업 회원 관리
          </h2>
          <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            총{" "}
            <span className="font-bold text-blue-600">{companies.length}</span>
            개 기업
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* 컴팩트한 테이블 - 핵심 정보만 표시 */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr className="text-left border-b-2 border-blue-200">
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      No
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      아이디
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      대표자명
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      사업자번호
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      연락처
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      이메일
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      가입일
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700 text-center">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-gray-500"
                      >
                        <FaBuilding
                          className="mx-auto mb-3 text-gray-300"
                          size={48}
                        />
                        <p>등록된 기업이 없습니다.</p>
                      </td>
                    </tr>
                  ) : (
                    companies.map((company, index) => (
                      <tr
                        key={company.memberId}
                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-blue-600">
                          {company.loginID}
                        </td>
                        <td className="py-3 px-4">{company.name}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatBusinessNumber(company.sno)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {company.phnum}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div
                            className="max-w-[200px] truncate"
                            title={company.email}
                          >
                            {company.email || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(company.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openViewModal(company)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              title="상세보기"
                            >
                              <FaEye size={14} />
                              <span className="text-xs">상세</span>
                            </button>
                            {/* <button
                              onClick={() => openEditModal(company)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="수정"
                            >
                              <FaEdit size={14} />
                              <span className="text-xs">수정</span>
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 새로고침 버튼 */}
            <div className="mt-4 flex justify-end">
              <Button
                label="새로고침"
                onClick={fetchCompanies}
                className="bg-gray-500 hover:bg-gray-600"
              />
            </div>
          </>
        )}
      </div>

      {/* 상세보기/수정 모달 */}
      {isModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isEditMode ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  {isEditMode ? (
                    <FaEdit className="text-blue-600 w-5 h-5" />
                  ) : (
                    <FaEye className="text-gray-600 w-5 h-5" />
                  )}
                </div>
                <span>
                  {isEditMode ? "기업 정보 수정" : "기업 정보 상세보기"}
                </span>
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 기본 정보 (읽기 전용) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded"></span>
                  기본 정보 (읽기 전용)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="아이디" value={selectedCompany.loginID} />
                  <InfoField label="대표자명" value={selectedCompany.name} />
                  <InfoField
                    label="사업자번호"
                    value={formatBusinessNumber(selectedCompany.sno)}
                  />
                  <InfoField label="연락처" value={selectedCompany.phnum} />
                  <InfoField label="주소" value={selectedCompany.address} />
                  <InfoField
                    label="담당자"
                    value={selectedCompany.referralID || "-"}
                  />
                  <InfoField
                    label="가입일"
                    value={formatDate(selectedCompany.createdAt)}
                  />
                </div>
              </div>

              {/* 수정 가능한 정보 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded"></span>
                  {isEditMode ? "수정 가능한 정보" : "회사 정보"}
                </h4>
                <div className="space-y-4">
                  {isEditMode ? (
                    <>
                      <EditField
                        label="이메일"
                        value={editData.email}
                        onChange={(value) =>
                          setEditData({ ...editData, email: value })
                        }
                        type="email"
                        placeholder="company@example.com"
                      />
                      <EditField
                        label="사업분류"
                        value={editData.companycls}
                        onChange={(value) =>
                          setEditData({ ...editData, companycls: value })
                        }
                        placeholder="예: 제조업, IT서비스업"
                      />
                      <EditField
                        label="회사소개"
                        value={editData.introduction}
                        onChange={(value) =>
                          setEditData({ ...editData, introduction: value })
                        }
                        multiline
                        placeholder="회사에 대한 간단한 소개를 입력하세요"
                      />
                      <EditField
                        label="주요판매상품"
                        value={editData.mainsales}
                        onChange={(value) =>
                          setEditData({ ...editData, mainsales: value })
                        }
                        placeholder="예: 전자제품, 소프트웨어"
                      />
                    </>
                  ) : (
                    <>
                      <InfoField
                        label="이메일"
                        value={selectedCompany.email || "-"}
                      />
                      <InfoField
                        label="사업분류"
                        value={selectedCompany.companycls || "-"}
                      />
                      <InfoField
                        label="회사소개"
                        value={selectedCompany.introduction || "-"}
                        multiline
                      />
                      <InfoField
                        label="주요판매상품"
                        value={selectedCompany.mainsales || "-"}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-white p-6 rounded-b-2xl flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {isEditMode ? "취소" : "닫기"}
              </button>
              {isEditMode && (
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
                >
                  저장
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 읽기 전용 정보 표시 컴포넌트
function InfoField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      {multiline ? (
        <div className="bg-white p-3 rounded border border-gray-200 text-gray-800 min-h-[80px] whitespace-pre-wrap">
          {value}
        </div>
      ) : (
        <div className="bg-white p-3 rounded border border-gray-200 text-gray-800">
          {value}
        </div>
      )}
    </div>
  );
}

// 수정 가능한 필드 컴포넌트
function EditField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { FaBuilding } from "react-icons/fa";
import Button from "../../../components/Button/Button";

interface Company {
  company_id: number;
  name: string;
  address: string;
  contact: string;
  status: "활성" | "비활성";
}

export default function MemberDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO: 백엔드에서 기업 목록 가져오기
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        // 여기에 기업 목록 API 호출 로직 추가
        // const res = await fetch("http://petback.hysu.kr/back/mypage/companies", {
        //   method: "GET",
        //   credentials: "include",
        // });
        // if (res.ok) {
        //   const data = await res.json();
        //   setCompanies(data);
        // }
        
        // 임시 데이터
        setCompanies([
          {
            company_id: 1,
            name: "샘플 기업",
            address: "서울시 강남구",
            contact: "02-1234-5678",
            status: "활성",
          },
        ]);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // TODO: 기업 상태 변경 함수
  const handleStatusChange = (companyId: number, newStatus: Company["status"]) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.company_id === companyId ? { ...c, status: newStatus } : c
      )
    );
  };

  // TODO: 저장 함수
  const handleSave = async () => {
    try {
      // 여기에 저장 API 호출 로직 추가
      alert("기업 정보가 저장되었습니다.");
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex-1 max-w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaBuilding className="text-blue-500 w-6 h-6" /> 기업 관리
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <>
            {/* 테이블 */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] border rounded">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-300">
                    <th className="py-2 px-3 min-w-[150px]">기업명</th>
                    <th className="py-2 px-3 min-w-[200px]">주소</th>
                    <th className="py-2 px-3 min-w-[120px]">연락처</th>
                    <th className="py-2 px-3 min-w-[100px]">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.company_id} className="border-b border-gray-200">
                      <td className="py-2 px-3">{company.name}</td>
                      <td className="py-2 px-3">{company.address}</td>
                      <td className="py-2 px-3">{company.contact}</td>
                      <td className="py-2 px-3">
                        <select
                          value={company.status}
                          onChange={(e) =>
                            handleStatusChange(
                              company.company_id,
                              e.target.value as Company["status"]
                            )
                          }
                          className="border rounded px-2 py-1 w-full"
                        >
                          <option value="활성">활성</option>
                          <option value="비활성">비활성</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 저장 버튼 */}
            <div className="mt-4 flex justify-end">
              <Button label="저장" onClick={handleSave} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
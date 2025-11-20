"use client";

import { useEffect, useState } from "react";
import { FaBuilding, FaCamera, FaEdit, FaUserCircle } from "react-icons/fa";
import axios from "axios";

interface CompanyInfo {
  companyName: string;
  phone: string;
  companycls: string;
  mainsales: string;
  profileImage?: string;
  referralName?: string;
  referralPhnum?: string;
}

export default function CompanyPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompanyCls, setEditCompanyCls] = useState("");
  const [editMainSales, setEditMainSales] = useState("");
  const [editingField, setEditingField] = useState<"companyName" | "phone" | "companycls" | "mainsales" | null>(null);


  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 로컬스토리지에서 userId 가져오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserId(user.id);
        } catch (e) {
          console.error("localStorage parsing error:", e);
        }
      }
    }
  }, []);

  // 기업 정보 가져오기
  useEffect(() => {
    if (!userId) return;

    const fetchCompany = async () => {
      try {
        const response = await axios.get(
          `http://petback.hysu.kr/back/mypage/member/${userId}`,
          { withCredentials: true }
        );
        if (response.data) setCompany(response.data);
      } catch (error) {
        console.error(error);
        alert("기업 정보를 불러오지 못했습니다.");
      }
    };

    fetchCompany();
  }, [userId]);

  const openEditModal = () => {
    if (!company) return;
    setEditCompanyName(company.companyName);
    setEditPhone(company.phone);
    setEditCompanyCls(company.companycls);
    setEditMainSales(company.mainsales);
    setProfileImageFile(null);
    setProfileImagePreview(
      company.profileImage
        ? `http://petback.hysu.kr/back/uploads/profiles/${company.profileImage}`
        : ""
    );
    setShowEditModal(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.");
      return;
    }

    setProfileImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadProfileImage = async () => {
    if (!profileImageFile || !userId) return null;
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", profileImageFile);

      const response = await axios.post(
        "http://petback.hysu.kr/back/mypage/member/uploadProfile",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      return response.data.filename;
    } catch (error) {
      console.error(error);
      alert("프로필 이미지 업로드 실패");
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!userId) return;

    try {
      let profileImageFilename = company?.profileImage;

      if (profileImageFile) {
        const uploaded = await uploadProfileImage();
        if (uploaded) profileImageFilename = uploaded;
      }

      const response = await axios.put(
        "http://petback.hysu.kr/back/mypage/member/update",
        {
          userId,
          companyName: editCompanyName,
          phone: editPhone,
          companycls: editCompanyCls,
          mainsales: editMainSales,
          profileImage: profileImageFilename,
        },
        { withCredentials: true }
      );

      if (response.data) {
        setCompany((prev) => (prev ? { ...prev, ...response.data } : prev));

        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          userObj.name = response.data.companyName;
          userObj.profileImage = response.data.profileImage;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        
        window.dispatchEvent(new Event("userUpdated"));
        alert("기업 정보가 수정되었습니다!");
        setShowEditModal(false);
      }
    } catch (error) {
      console.error(error);
      alert("기업 정보 수정 중 오류 발생");
    }
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const getProfileImageUrl = () =>
    company.profileImage
      ? `http://petback.hysu.kr/back/uploads/profiles/${company.profileImage}`
      : "";

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 프로필 */}
      <aside className="w-full md:w-72 bg-white rounded-2xl shadow-lg p-6 flex-shrink-0">
        <div className="flex flex-col items-center pb-6 border-b border-gray-200">
          <div className="w-24 h-24 rounded-full border-4 border-yellow-500 relative overflow-hidden mb-3 bg-gray-100">
            {company.profileImage ? (
              <img
                src={getProfileImageUrl()}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaBuilding className="w-full h-full text-gray-400" />
            )}
          </div>
          <p className="text-lg font-bold text-gray-800">{company.companyName}</p>
          <span className="text-xs text-gray-500 mt-1">{company.phone}</span>
          <span className="text-xs text-gray-500 mt-1">{company.companycls}</span>
          <span className="text-xs text-gray-500 mt-1">{company.mainsales}</span>
        </div>

        {/* 추천 심사원 */}
        {company.referralName && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full text-center">
            <p className="text-sm font-semibold text-gray-700">추천 심사원</p>
            <p className="text-gray-800">{company.referralName}</p>
            <p className="text-gray-500 text-sm">{company.referralPhnum}</p>
          </div>
        )}

        {/* 수정 버튼 */}
        <nav className="mt-6">
          <button
            onClick={openEditModal}
            className="w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-gray-700 hover:bg-gray-100"
          >
            <FaEdit className="w-5 h-5" /> 기업정보 수정
          </button>
        </nav>
      </aside>

      {/* 개인정보 수정 모달 */}
      {showEditModal && company && (
  <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
        기업 정보 수정
      </h2>

      {/* 프로필 */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 rounded-full border-4 border-yellow-500 overflow-hidden bg-gray-100 mb-4">
          {profileImagePreview ? (
            <img src={profileImagePreview} className="w-full h-full object-cover" />
          ) : (
            <FaBuilding className="w-full h-full text-gray-400" />
          )}

          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-3 cursor-pointer hover:bg-yellow-600 transition-colors shadow-lg"
          >
            <FaCamera className="text-white w-4 h-4" />
          </label>

          <input
            id="profile-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleProfileImageChange}
            className="hidden"
          />
        </div>

        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, GIF (최대 10MB)
        </p>
      </div>

      {/* 기업명 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">기업명</label>

          <button
            onClick={() =>
              setEditingField(editingField === "companyName" ? null : "companyName")
            }
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
          >
            {editingField === "companyName" ? "완료" : "수정"}
          </button>
        </div>

        {editingField === "companyName" ? (
          <input
            type="text"
            value={editCompanyName}
            onChange={(e) => setEditCompanyName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500"
          />
        ) : (
          <div className="w-full bg-gray-50 rounded-lg p-3 text-gray-800">
            {editCompanyName}
          </div>
        )}
      </div>

      {/* 전화번호 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">전화번호</label>

          <button
            onClick={() =>
              setEditingField(editingField === "phone" ? null : "phone")
            }
            className="text-sm text-yellow-600"
          >
            {editingField === "phone" ? "완료" : "수정"}
          </button>
        </div>

        {editingField === "phone" ? (
          <input
            type="text"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500"
          />
        ) : (
          <div className="w-full bg-gray-50 rounded-lg p-3 text-gray-800">
            {editPhone}
          </div>
        )}
      </div>

      {/* 기업 구분 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">기업 구분</label>

          <button
            onClick={() =>
              setEditingField(editingField === "companycls" ? null : "companycls")
            }
            className="text-sm text-yellow-600"
          >
            {editingField === "companycls" ? "완료" : "수정"}
          </button>
        </div>

        {editingField === "companycls" ? (
          <input
            type="text"
            value={editCompanyCls}
            onChange={(e) => setEditCompanyCls(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500"
          />
        ) : (
          <div className="w-full bg-gray-50 rounded-lg p-3 text-gray-800">
            {editCompanyCls}
          </div>
        )}
      </div>

      {/* 주요 매출 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">주요 매출</label>

          <button
            onClick={() =>
              setEditingField(editingField === "mainsales" ? null : "mainsales")
            }
            className="text-sm text-yellow-600"
          >
            {editingField === "mainsales" ? "완료" : "수정"}
          </button>
        </div>

        {editingField === "mainsales" ? (
          <input
            type="text"
            value={editMainSales}
            onChange={(e) => setEditMainSales(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500"
          />
        ) : (
          <div className="w-full bg-gray-50 rounded-lg p-3 text-gray-800">
            {editMainSales}
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowEditModal(false)}
          disabled={isUploadingImage}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold"
        >
          취소
        </button>

        <button
          onClick={handleSaveEdit}
          disabled={isUploadingImage}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold"
        >
          {isUploadingImage ? "업로드 중..." : "저장"}
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}

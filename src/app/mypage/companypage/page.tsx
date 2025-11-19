"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaUsers, FaCamera, FaEdit, FaSortUp, FaSortDown } from "react-icons/fa";
import axios from "axios";

interface MemberInfo {
  name: string;
  phnum: string;
  companycls: string;
  mainsales: string;
  reviewerName?: string;
  reviewerPhnum?: string;
  profileImage?: string;
}

export default function CompanyPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editPhnum, setEditPhnum] = useState("");
  const [editCompanyCls, setEditCompanyCls] = useState("");
  const [editMainSales, setEditMainSales] = useState("");

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log("user from localStorage:", user);
          console.log("user.id:", user.id);
          setUserId(user.id);
        } catch (e) {
          console.error("localStorage parsing error:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchMember = async () => {
      try {
        const response = await axios.get(
          `http://petback.hysu.kr/back/mypage/member/${userId}`,
          { withCredentials: true }
        );
        setMember(response.data);
      } catch (error) {
        console.error("Fetch member info error:", error);
        alert("기업 정보를 불러오지 못했습니다.");
      }
    };

    fetchMember();
  }, [userId]);

  const openEditModal = () => {
    if (!member) return;
    setEditCompanyName(member.name);
    setEditPhnum(member.phnum);
    setEditCompanyCls(member.companycls);
    setEditMainSales(member.mainsales);
    setProfileImagePreview(member.profileImage 
      ? `http://petback.hysu.kr/back/uploads/profiles/${member.profileImage}`
      : ""
    );
    setProfileImageFile(null);
    setShowEditModal(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("JPG, PNG, GIF만 업로드 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB를 초과할 수 없습니다.");
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
      formData.append("userId", userId.toString());
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
      console.error("Image upload error:", error);
      alert("프로필 이미지 업로드 실패");
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!userId) return;

    let profileImageFilename = member?.profileImage;

    if (profileImageFile) {
      const uploadedFilename = await uploadProfileImage();
      if (uploadedFilename) profileImageFilename = uploadedFilename;
    }

    try {
      const response = await axios.put(
        "http://petback.hysu.kr/back/mypage/admin/members/update",
        {
          userId,
          companyName: editCompanyName,
          phone: editPhnum,
          companycls: editCompanyCls,
          mainsales: editMainSales,
          profileImage: profileImageFilename,
        },
        { withCredentials: true }
      );

      if (response.data) {
        setMember((prev) =>
          prev ? { ...prev, ...response.data } : prev
        );

        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          userObj.name = response.data.name;
          userObj.profileImage = response.data.profileImage;
          localStorage.setItem("user", JSON.stringify(userObj));
        }

        alert("기업 정보가 성공적으로 수정되었습니다!");
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Save edit error:", error);
      alert("정보 수정 중 오류가 발생했습니다.");
    }
  };

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const getProfileImageUrl = () => {
    if (member.profileImage) return `http://petback.hysu.kr/back/uploads/profiles/${member.profileImage}`;
    return "";
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 프로필 */}
      <aside className="w-full md:w-72 bg-white rounded-2xl shadow-lg p-6 flex-shrink-0">
        <div className="flex flex-col items-center pb-6 border-b border-gray-200">
          <div className="w-24 h-24 rounded-full border-4 border-yellow-500 relative overflow-hidden mb-3 bg-gray-100">
            {member.profileImage ? (
              <img
                src={getProfileImageUrl()}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-400" />
            )}
          </div>
          <p className="text-lg font-bold text-gray-800">{member.name}</p>
          <p className="text-sm text-gray-500 mt-1">{member.companycls}</p>
          <p className="text-sm text-gray-500">{member.mainsales}</p>
          {member.reviewerName && (
            <p className="text-xs text-gray-400 mt-2">
              추천 리뷰어: {member.reviewerName} ({member.reviewerPhnum})
            </p>
          )}
        </div>
        <nav className="mt-6">
          <button
            onClick={openEditModal}
            className="w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 text-gray-700 hover:bg-gray-100"
          >
            <FaEdit className="w-5 h-5" /> 기업 정보 수정
          </button>
        </nav>
      </aside>

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">기업 정보 수정</h2>

            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 rounded-full border-4 border-yellow-500 overflow-hidden bg-gray-100 mb-4">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-full h-full text-gray-400" />
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
              <p className="text-xs text-gray-500 text-center">JPG, PNG, GIF (최대 10MB)</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">기업명</label>
              <input
                type="text"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">전화번호</label>
              <input
                type="text"
                value={editPhnum}
                onChange={(e) => setEditPhnum(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">회사 구분</label>
              <input
                type="text"
                value={editCompanyCls}
                onChange={(e) => setEditCompanyCls(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">주요 매출</label>
              <input
                type="text"
                value={editMainSales}
                onChange={(e) => setEditMainSales(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUploadingImage}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUploadingImage}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
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

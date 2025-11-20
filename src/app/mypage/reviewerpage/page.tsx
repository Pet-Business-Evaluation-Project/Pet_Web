"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaUsers, FaCamera, FaEdit, FaSortUp, FaSortDown } from "react-icons/fa";
import axios from "axios";
import Image from "next/image";

interface ReviewerInfo {
  loginID: string;
  name: string;
  phnum: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
  profileImage?: string;
}

interface OrgMember {
  name: string;
  phnum: string;
  reviewerGrade: "심사원보" | "심사위원" | "수석심사위원";
}

export default function ReviewerPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [reviewer, setReviewer] = useState<ReviewerInfo | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [showOrg, setShowOrg] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhnum, setEditPhnum] = useState("");
  const [editingField, setEditingField] = useState<"name" | "phnum" | null>(null);
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const roleOrder: Record<OrgMember["reviewerGrade"], number> = {
    "심사원보": 1,
    "심사위원": 2,
    "수석심사위원": 3,
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserId(user.id);
          console.log("User from localStorage:", user);
        } catch (e) {
          console.error("localStorage user parsing error:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchReviewer = async () => {
      try {
        const response = await axios.post(
          "https://www.kcci.co.kr/back/mypage/reviewer",
          { userId },
          { withCredentials: true }
        );

        if (response.data) {
          setReviewer(response.data);
          console.log("Reviewer data:", response.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        alert("심사원 정보를 불러오지 못했습니다.");
      }
    };

    fetchReviewer();
  }, [userId]);

  const toggleOrgMembers = async () => {
    if (!reviewer) return;

    if (showOrg) {
      setShowOrg(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://www.kcci.co.kr/back/mypage/reviewer/invite",
        { loginID: reviewer.loginID },
        { withCredentials: true }
      );

      if (response.data) {
        setOrgMembers(response.data);
        setShowOrg(true);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("조직 구성원을 불러오지 못했습니다.");
    }
  };

  const openEditModal = () => {
    if (!reviewer) return;
    setEditName(reviewer.name);
    setEditPhnum(reviewer.phnum || "");
    setEditingField(null);
    setProfileImageFile(null);
    setProfileImagePreview(reviewer.profileImage 
      ? `https://www.kcci.co.kr/back/uploads/profiles/${reviewer.profileImage}`
      : ""
    );
    setShowEditModal(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert("JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.");
        return;
      }

      setProfileImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImageFile || !userId) return null;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("file", profileImageFile);

      const response = await axios.post(
        "https://www.kcci.co.kr/back/mypage/reviewer/uploadProfile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Image upload error:", error);
      
      // ⭐ 에러 처리 개선
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert("로그인이 필요합니다. 다시 로그인해주세요.");
          window.location.href = "/";
          return null;
        }
        if (error.response?.status === 403) {
          alert("본인의 프로필만 수정할 수 있습니다.");
          return null;
        }
        // 백엔드에서 보낸 에러 메시지 표시
        const errorMessage = error.response?.data?.message || "프로필 이미지 업로드에 실패했습니다.";
        alert(errorMessage);
      } else {
        alert("프로필 이미지 업로드에 실패했습니다.");
      }
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!userId) return;

    try {
      let profileImageFilename = reviewer?.profileImage;

      if (profileImageFile) {
        const uploadedFilename = await uploadProfileImage();
        if (uploadedFilename) {
          profileImageFilename = uploadedFilename;
        } else {
          // 업로드 실패 시 저장 중단
          return;
        }
      }

      const response = await axios.put(
        "https://www.kcci.co.kr/back/mypage/reviewer/infoUpdate",
        {
          userId,
          name: editName,
          phnum: editPhnum,
          profileImage: profileImageFilename,
        },
        { withCredentials: true }
      );

      if (response.data) {
        setReviewer((prev) =>
          prev ? { 
            ...prev, 
            name: response.data.name, 
            phnum: response.data.phnum,
            profileImage: response.data.profileImage
          } : prev
        );
        
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          userObj.name = response.data.name;
          userObj.profileImage = response.data.profileImage;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        
        window.dispatchEvent(new Event("userUpdated"));
        
        alert("개인정보가 성공적으로 수정되었습니다!");
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Edit error:", error);
      
      // ⭐ 에러 처리 개선
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert("로그인이 필요합니다. 다시 로그인해주세요.");
          window.location.href = "/login";
          return;
        }
        const errorMessage = error.response?.data?.message || "정보 수정 중 오류가 발생했습니다.";
        alert(errorMessage);
      } else {
        alert("정보 수정 중 오류가 발생했습니다.");
      }
    }
  };

  if (!reviewer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const sortedOrgMembers = [...orgMembers].sort((a, b) =>
    sortAsc
      ? roleOrder[a.reviewerGrade] - roleOrder[b.reviewerGrade]
      : roleOrder[b.reviewerGrade] - roleOrder[a.reviewerGrade]
  );

  const getProfileImageUrl = () => {
    if (reviewer.profileImage) {
      return `https://www.kcci.co.kr/back/uploads/profiles/${reviewer.profileImage}`;
    }
    return "";
  };

  const getBadgeColor = (grade: string) => {
    switch (grade) {
      case "수석심사위원":
        return "bg-purple-100 text-purple-800";
      case "심사위원":
        return "bg-blue-100 text-blue-800";
      case "심사원보":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 프로필 */}
      <aside className="w-full md:w-72 bg-white rounded-2xl shadow-lg p-6 flex-shrink-0">
        {/* 프로필 섹션 */}
        <div className="flex flex-col items-center pb-6 border-b border-gray-200">
          <div className="w-24 h-24 rounded-full border-4 border-yellow-500 relative overflow-hidden mb-3 bg-gray-100">
            {reviewer.profileImage ? (
              <img
                src={getProfileImageUrl()}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-400" />
            )}
          </div>
          <p className="text-lg font-bold text-gray-800">{reviewer.name}</p>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold mt-2 ${getBadgeColor(reviewer.reviewerGrade)}`}>
            {reviewer.reviewerGrade}
          </span>
        </div>

        {/* 메뉴 */}
        <nav className="mt-6">
          <button
            onClick={openEditModal}
            className="w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-gray-700 hover:bg-gray-100"
          >
            <FaEdit className="w-5 h-5" />
            <span>개인정보 수정</span>
          </button>
        </nav>
      </aside>

      {/* 우측 조직 관리 */}
      <div className="flex-1 flex flex-col gap-6">
        {/* 조직 관리 카드 */}
        <div
          className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={toggleOrgMembers}
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaUsers className="text-yellow-600 w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-1">조직 관리</h2>
            <p className="text-sm text-gray-500">나의 조직 확인 및 관리</p>
          </div>
          <div className="text-gray-400">
            {showOrg ? "▲" : "▼"}
          </div>
        </div>

        {/* 조직 구성원 테이블 */}
        {showOrg && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <FaUsers className="text-yellow-500 w-6 h-6" /> 나의 조직 구성원
            </h2>
            
            {sortedOrgMembers.length === 0 ? (
              <div className="text-center py-10">
                <FaUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">조직 구성원이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                        이름
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                        전화번호
                      </th>
                      <th 
                        className="py-3 px-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-yellow-600 transition-colors"
                        onClick={() => setSortAsc(!sortAsc)}
                      >
                        <div className="flex items-center gap-2">
                          직책
                          {sortAsc ? (
                            <FaSortUp className="w-4 h-4" />
                          ) : (
                            <FaSortDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrgMembers.map((m, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800">{m.name}</td>
                        <td className="py-3 px-4 text-gray-600">{m.phnum}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getBadgeColor(m.reviewerGrade)}`}>
                            {m.reviewerGrade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 개인정보 수정 모달 */}
      {showEditModal && reviewer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">회원 정보 수정</h2>

            {/* 프로필 사진 */}
            <div className="flex flex-col items-center mb-8">
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
              <p className="text-xs text-gray-500 text-center">
                JPG, PNG, GIF (최대 10MB)
              </p>
            </div>

            {/* 이름 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">이름</label>
                <button
                  onClick={() => setEditingField(editingField === "name" ? null : "name")}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  {editingField === "name" ? "완료" : "수정"}
                </button>
              </div>
              {editingField === "name" ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              ) : (
                <div className="w-full bg-gray-50 rounded-lg p-3 text-gray-800">
                  {editName}
                </div>
              )}
            </div>

            {/* 전화번호 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">전화번호</label>
                <button
                  onClick={() => setEditingField(editingField === "phnum" ? null : "phnum")}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  {editingField === "phnum" ? "완료" : "수정"}
                </button>
              </div>
              {editingField === "phnum" ? (
                <input
                  type="text"
                  value={editPhnum}
                  onChange={(e) => setEditPhnum(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              ) : (
                <div className="w-full bg-gray-50 rounded-lg p-3 text-gray-800">
                  {editPhnum}
                </div>
              )}
            </div>

            {/* 버튼 */}
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
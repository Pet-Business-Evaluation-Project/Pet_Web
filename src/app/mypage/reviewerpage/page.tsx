"use client";

import { useEffect, useState } from "react";
import { FaUserCircle, FaUsers, FaCamera } from "react-icons/fa";
import Button from "../../components/Button/Button";
import axios from "axios";

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
      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert("JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.");
        return;
      }

      setProfileImageFile(file);
      
      // 미리보기 생성
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

      // ⭐ 응답 구조 변경에 맞춤
      if (response.data.success === "true") {
        return response.data.filename;
      } else {
        throw new Error(response.data.message || "업로드 실패");
      }
      
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

      // 프로필 이미지가 변경된 경우 먼저 업로드
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
        
        // localStorage 업데이트
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          userObj.name = response.data.name;
          userObj.profileImage = response.data.profileImage;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        
        // Header 업데이트 이벤트
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

  if (!reviewer) return <div className="p-6">불러오는 중...</div>;

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

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gray-100 p-6 gap-6">
      {/* 좌측 프로필 */}
      <div className="flex flex-col items-center md:items-start w-full md:w-64 bg-yellow-100 rounded-2xl shadow-lg p-6 space-y-4 flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 relative overflow-hidden bg-gray-200">
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
        <p className="text-lg font-semibold text-center md:text-left">{reviewer.name}</p>
        <p className="text-gray-600 text-center md:text-left">{reviewer.reviewerGrade}</p>

        <div className="flex flex-col gap-3 w-full mt-4">
          <Button label="개인정보 수정" onClick={openEditModal} />
        </div>
      </div>

      {/* 우측 조직 관리 */}
      <div className="flex-1 flex flex-col gap-6">
        <div
          className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 cursor-pointer"
          onClick={toggleOrgMembers}
        >
          <FaUsers className="text-yellow-500 w-6 h-6 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-1">조직 관리</h2>
            <p className="text-gray-500">나의 조직 확인 및 관리 가능</p>
          </div>
        </div>

        {showOrg && (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 overflow-x-auto mt-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaUsers className="text-yellow-500 w-6 h-6" /> 나의 조직 구성원
            </h2>
            <table className="w-full min-w-[500px] border-collapse table-auto">
              <thead>
                <tr className="text-left border-b border-gray-300">
                  <th className="py-2 px-3">이름</th>
                  <th className="py-2 px-3">전화번호</th>
                  <th
                    className="py-2 px-3 cursor-pointer"
                    onClick={() => setSortAsc(!sortAsc)}
                  >
                    직책 {sortAsc ? "▲" : "▼"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOrgMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-gray-500 text-center">
                      조직 구성원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedOrgMembers.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 px-3">{m.name}</td>
                      <td className="py-2 px-3">{m.phnum}</td>
                      <td className="py-2 px-3">{m.reviewerGrade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 개인정보 수정 모달 */}
      {showEditModal && reviewer && (
        <div className="fixed inset-0 flex items-center justify-center z-50
                            bg-[rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">회원 정보</h2>

            {/* 프로필 사진 */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 rounded-full border-4 border-yellow-500 overflow-hidden bg-gray-200 mb-4">
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
                  className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-2 cursor-pointer hover:bg-yellow-600 transition"
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
              <p className="text-sm text-gray-500 text-center">
                JPG, PNG, GIF (최대 10MB)
              </p>
            </div>

            {/* 이름 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-medium w-24">이름</span>
              {editingField === "name" ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded-lg p-2 flex-1 mr-2"
                />
              ) : (
                <span className="text-gray-700 flex-1">{editName}</span>
              )}
              <Button
                label={editingField === "name" ? "완료" : "수정"}
                onClick={() =>
                  setEditingField(editingField === "name" ? null : "name")
                }
                className="text-sm px-3 py-1"
              />
            </div>

            {/* 전화번호 */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-600 font-medium w-24">전화번호</span>
              {editingField === "phnum" ? (
                <input
                  type="text"
                  value={editPhnum}
                  onChange={(e) => setEditPhnum(e.target.value)}
                  className="border rounded-lg p-2 flex-1 mr-2"
                />
              ) : (
                <span className="text-gray-700 flex-1">{editPhnum}</span>
              )}
              <Button
                label={editingField === "phnum" ? "완료" : "수정"}
                onClick={() =>
                  setEditingField(editingField === "phnum" ? null : "phnum")
                }
                className="text-sm px-3 py-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                label="취소" 
                onClick={() => setShowEditModal(false)}
                disabled={isUploadingImage}
              />
              <Button 
                label={isUploadingImage ? "업로드 중..." : "저장"}
                onClick={handleSaveEdit}
                disabled={isUploadingImage}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
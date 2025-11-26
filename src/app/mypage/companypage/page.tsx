"use client";

import { useEffect, useState } from "react";
import { FaBuilding, FaCamera, FaEdit } from "react-icons/fa";
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

interface SignStatus {
  signId: number;
  signtype?: string;
  reviewcomplete: "진행중" | "심사완료";
  signdate?: string;
  effecttime?: string;
  signstate?: "완료" | "보완" | "부적합";
}

export default function CompanyPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [signStatuses, setSignStatuses] = useState<SignStatus[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompanyCls, setEditCompanyCls] = useState("");
  const [editMainSales, setEditMainSales] = useState("");
  const [editingField, setEditingField] = useState<
    "companyName" | "phone" | "companycls" | "mainsales" | null
  >(null);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // axios 인터셉터 설정
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        console.log("=== 요청 전송 ===");
        console.log("URL:", config.url);
        console.log("Method:", config.method);
        console.log("Headers:", config.headers);
        console.log("Data:", config.data);
        console.log("withCredentials:", config.withCredentials);
        return config;
      },
      (error) => {
        console.error("요청 에러:", error);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        console.log("=== 응답 수신 ===");
        console.log("Status:", response.status);
        console.log("Data:", response.data);
        return response;
      },
      (error) => {
        console.error("=== 응답 에러 ===");
        console.error("Status:", error.response?.status);
        console.error("Data:", error.response?.data);
        console.error("Headers:", error.response?.headers);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

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
          `https://www.kcci.co.kr/back/mypage/member/${userId}`,
          { withCredentials: true }
        );
        if (response.data) setCompany(response.data);
      } catch (error) {
        console.error(error);
        alert("기업 정보를 불러오지 못했습니다.");
      }
    };

    const fetchSignStatus = async () => {
      try {
        console.log("Fetching sign status for userId:", userId);

        const response = await axios.get<SignStatus[]>(
          `https://www.kcci.co.kr/back/mypage/member/signstatus/${userId}`,
          { withCredentials: true }
        );

        if (response.data) {
          // 중복 signId 제거
          const uniqueStatuses = Array.from(
            new Map(response.data.map((s) => [s.signId, s])).values()
          );

          // 진행중 상태의 상세 정보 숨기기
          const processedStatuses = uniqueStatuses.map((s) => {
            if (s.reviewcomplete === "진행중") {
              return {
                ...s,
                signtype: undefined,
                signdate: undefined,
                effecttime: undefined,
                signstate: undefined,
              };
            }
            return s;
          });

          setSignStatuses(processedStatuses);
        }
      } catch (error) {
        console.error("Sign status fetch error:", error);
        if (axios.isAxiosError(error)) {
          console.error("Response data:", error.response?.data);
        }
        alert("기업 인증 정보를 불러오지 못했습니다.");
      }
    };

    fetchCompany();
    fetchSignStatus();
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
        ? `https://www.kcci.co.kr/back/uploads/profiles/${company.profileImage}`
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
        "https://www.kcci.co.kr/back/mypage/member/uploadProfile",
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
      let profileImageFilename = company?.profileImage || null;

      if (profileImageFile) {
        const uploaded = await uploadProfileImage();
        if (uploaded) {
          profileImageFilename = uploaded;
        } else {
          return;
        }
      }

      const updateData = {
        userId,
        companyName: editCompanyName.trim(),
        phone: editPhone.trim(),
        companycls: editCompanyCls.trim(),
        mainsales: editMainSales.trim(),
        profileImage: profileImageFilename,
      };

      console.log("전송 데이터:", updateData);

      const response = await axios.put(
        "https://www.kcci.co.kr/back/mypage/member/update",
        updateData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
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
      console.error("수정 오류:", error);

      if (axios.isAxiosError(error)) {
        console.error("응답 상태:", error.response?.status);
        console.error("응답 데이터:", error.response?.data);
        console.error("요청 헤더:", error.config?.headers);
        console.error("요청 URL:", error.config?.url);

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          JSON.stringify(error.response?.data) ||
          "서버 오류";

        alert(`기업 정보 수정 실패: ${errorMessage}`);
      } else {
        alert("기업 정보 수정 중 오류 발생");
      }
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
      ? `https://www.kcci.co.kr/back/uploads/profiles/${company.profileImage}`
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
          <p className="text-lg font-bold text-gray-800">
            {company.companyName}
          </p>
          <span className="text-xs text-gray-500 mt-1">{company.phone}</span>
          <span className="text-xs text-gray-500 mt-1">
            {company.companycls}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {company.mainsales}
          </span>
        </div>

        {company.referralName && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full text-center">
            <p className="text-sm font-semibold text-gray-700">추천 심사원</p>
            <p className="text-gray-800">{company.referralName}</p>
            <p className="text-gray-500 text-sm">{company.referralPhnum}</p>
          </div>
        )}

        <nav className="mt-6">
          <button
            onClick={openEditModal}
            className="w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-gray-700 hover:bg-gray-100"
          >
            <FaEdit className="w-5 h-5" /> 기업정보 수정
          </button>
        </nav>
      </aside>

      {/* 가운데 인증 정보 */}
      <section className="flex-1 bg-white rounded-2xl shadow-lg p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
          기업 인증 현황
        </h2>

        {signStatuses.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 인증이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {signStatuses.map((status) => (
              <div
                key={status.signId}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2"
              >
                <p>
                  <span className="font-semibold">심사 상태: </span>
                  {status.reviewcomplete === "진행중" ? (
                    <span className="text-yellow-600">
                      {status.reviewcomplete}
                    </span>
                  ) : (
                    <span className="text-green-600">
                      {status.reviewcomplete}
                    </span>
                  )}
                </p>

                {status.reviewcomplete === "심사완료" && (
                  <>
                    <p>
                      <span className="font-semibold">인증 유형: </span>
                      {status.signtype}
                    </p>
                    <p>
                      <span className="font-semibold">심사일: </span>
                      {status.signdate}
                    </p>
                    <p>
                      <span className="font-semibold">유효기간: </span>
                      {status.effecttime}
                    </p>
                    <p>
                      <span className="font-semibold">심사 결과: </span>
                      {status.signstate}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

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
                  <img
                    src={profileImagePreview}
                    className="w-full h-full object-cover"
                    alt="Profile preview"
                  />
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
                <label className="text-sm font-semibold text-gray-700">
                  기업명
                </label>

                <button
                  onClick={() =>
                    setEditingField(
                      editingField === "companyName" ? null : "companyName"
                    )
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
                <label className="text-sm font-semibold text-gray-700">
                  전화번호
                </label>

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
                <label className="text-sm font-semibold text-gray-700">
                  기업 구분
                </label>

                <button
                  onClick={() =>
                    setEditingField(
                      editingField === "companycls" ? null : "companycls"
                    )
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
                <label className="text-sm font-semibold text-gray-700">
                  주요 매출
                </label>

                <button
                  onClick={() =>
                    setEditingField(
                      editingField === "mainsales" ? null : "mainsales"
                    )
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
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                취소
              </button>

              <button
                onClick={handleSaveEdit}
                disabled={isUploadingImage}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
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

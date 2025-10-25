"use client";

import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-12">회원가입</h1>

      <div className="flex gap-8">
        <button
<<<<<<< HEAD
          onClick={() => router.push("/signup-reviewer")}
=======
          onClick={() => router.push("signup/reviewer")}
>>>>>>> 933dff368be250ca0a0977d07388a7db8282daad
          className="bg-gray-300 hover:bg-gray-400 text-lg font-medium px-12 py-6 rounded shadow"
        >
          심사원 가입
        </button>

        <button
<<<<<<< HEAD
          onClick={() => router.push("/signup-member")}
=======
          onClick={() => router.push("signup/member")}
>>>>>>> 933dff368be250ca0a0977d07388a7db8282daad
          className="bg-gray-300 hover:bg-gray-400 text-lg font-medium px-12 py-6 rounded shadow"
        >
          판매 기업 가입
        </button>
      </div>
    </div>
  );
}

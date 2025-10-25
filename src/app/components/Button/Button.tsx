import React from "react";

interface ButtonProps {
  label: string;                 // 버튼에 표시할 텍스트
  onClick?: () => void;          // 클릭 시 실행할 함수
  type?: "button" | "submit" | "reset"; // 버튼 타입 (기본: button)
  disabled?: boolean;
  className?: string;            // 비활성화 여부
}

export default function Button({
  label,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-auto py-2 px-4 rounded-lg font-semibold
        text-white bg-blue-600 hover:bg-blue-700
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-all duration-200
      `}
    >
      {label}
    </button>
  );
}

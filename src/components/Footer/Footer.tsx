export default function Footer() {
  return (
    <footer className="w-full text-center py-4 border-t mt-8 text-sm text-gray-400">
      © {new Date().getFullYear()} Next 설명.
      <p> 여기는 푸터 내용을 넣을수 있음.</p>
    </footer>
  );
}
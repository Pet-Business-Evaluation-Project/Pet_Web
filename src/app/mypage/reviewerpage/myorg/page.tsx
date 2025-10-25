"use client";

export default function MyOrganizationPage() {
  const myOrganizations = [
    { id: 1, name: "품질관리팀", members: 12 },
    { id: 2, name: "환경개선위원회", members: 8 },
  ];

  return (
    <main className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">나의 조직 관리</h1>
      <ul className="space-y-3">
        {myOrganizations.map((org) => (
          <li
            key={org.id}
            className="border rounded-lg p-4 shadow-sm hover:bg-gray-100"
          >
            <p className="font-semibold">{org.name}</p>
            <p className="text-gray-600 text-sm">구성원 수: {org.members}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
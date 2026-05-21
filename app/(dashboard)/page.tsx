import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });

  const { count: activeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: inactiveCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "inactive");

  const { data: departments } = await supabase
    .from("employees")
    .select("department")
    .not("department", "is", null);

  const uniqueDepartments = new Set(
    departments?.map((d) => d.department).filter(Boolean)
  );

  const stats = [
    { label: "Total Employees", value: totalCount ?? 0, color: "bg-blue-500" },
    { label: "Active", value: activeCount ?? 0, color: "bg-green-500" },
    { label: "Inactive", value: inactiveCount ?? 0, color: "bg-red-500" },
    { label: "Departments", value: uniqueDepartments.size, color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Dashboard
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Welcome to Mini AI HR. Here&apos;s your team overview.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${stat.color}`} />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/employees/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            + Add Employee
          </Link>
          <Link
            href="/employees"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-md transition-colors"
          >
            View All Employees
          </Link>
          <Link
            href="/ai-assistant"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-md transition-colors"
          >
            🤖 AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data: employees, error } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employees
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team members.
          </p>
        </div>
        <Link
          href="/employees/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          + Add Employee
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <Link
          href="/employees"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            !params.status || params.status === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          All
        </Link>
        <Link
          href="/employees?status=active"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            params.status === "active"
              ? "bg-green-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Active
        </Link>
        <Link
          href="/employees?status=inactive"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            params.status === "inactive"
              ? "bg-red-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Inactive
        </Link>
      </div>

      {error ? (
        <p className="text-red-600">Error loading employees: {error.message}</p>
      ) : !employees || employees.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No employees found. Add your first employee to get started.
          </p>
          <Link
            href="/employees/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            + Add Employee
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Job Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {emp.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {emp.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {emp.department || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {emp.job_title || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        emp.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
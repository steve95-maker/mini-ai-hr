import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { deactivateEmployee, activateEmployee } from "../actions";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !employee) {
    redirect("/employees");
  }

  const deactivateAction = deactivateEmployee.bind(null, id);
  const activateAction = activateEmployee.bind(null, id);

  const details = [
    { label: "Full Name", value: employee.full_name },
    { label: "Email", value: employee.email },
    { label: "Phone", value: employee.phone },
    { label: "Job Title", value: employee.job_title },
    { label: "Department", value: employee.department },
    { label: "Employment Type", value: employee.employment_type },
    { label: "Joining Date", value: employee.joining_date },
    { label: "Manager", value: employee.manager_name },
    { label: "Work Location", value: employee.work_location },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {employee.full_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {employee.job_title || "No title"} · {employee.department || "No department"}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
            employee.status === "active"
              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
          }`}
        >
          {employee.status}
        </span>
      </div>

      {employee.summary && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
            🤖 AI Summary
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {employee.summary}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Employee Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/employees/${id}/edit`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Edit
        </Link>
        {employee.status === "active" ? (
          <form action={deactivateAction}>
            <button type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors">
              Deactivate
            </button>
          </form>
        ) : (
          <form action={activateAction}>
            <button type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
              Activate
            </button>
          </form>
        )}
        <Link
          href="/employees"
          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-md transition-colors"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}

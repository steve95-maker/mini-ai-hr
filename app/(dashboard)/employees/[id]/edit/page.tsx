import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { updateEmployee } from "../../actions";

export default async function EditEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: formError } = await searchParams;
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !employee) {
    redirect("/employees");
  }

  const updateAction = updateEmployee.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Edit Employee
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Update {employee.full_name}&apos;s information.
      </p>

      {formError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        </div>
      )}

      <form
        action={updateAction}
        className="space-y-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input id="full_name" name="full_name" type="text" required defaultValue={employee.full_name}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input id="email" name="email" type="email" required defaultValue={employee.email}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input id="phone" name="phone" type="text" defaultValue={employee.phone || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Title
            </label>
            <input id="job_title" name="job_title" type="text" defaultValue={employee.job_title || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <input id="department" name="department" type="text" defaultValue={employee.department || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employment Type
            </label>
            <select id="employment_type" name="employment_type" defaultValue={employee.employment_type || "full-time"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>

          <div>
            <label htmlFor="joining_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Joining Date
            </label>
            <input id="joining_date" name="joining_date" type="date" defaultValue={employee.joining_date || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="manager_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Manager Name
            </label>
            <input id="manager_name" name="manager_name" type="text" defaultValue={employee.manager_name || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="work_location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Work Location
            </label>
            <input id="work_location" name="work_location" type="text" defaultValue={employee.work_location || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
            Save Changes
          </button>
          <Link href={`/employees/${id}`}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-md transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
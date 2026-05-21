'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const employeeData = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || null,
    job_title: (formData.get('job_title') as string) || null,
    department: (formData.get('department') as string) || null,
    employment_type: (formData.get('employment_type') as string) || 'full-time',
    joining_date: (formData.get('joining_date') as string) || null,
    status: 'active',
    manager_name: (formData.get('manager_name') as string) || null,
    work_location: (formData.get('work_location') as string) || null,
    created_by: user?.id,
  }

  const { error } = await supabase.from('employees').insert(employeeData)

  if (error) {
    redirect(`/employees/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/employees')
  redirect('/employees')
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient()

  const employeeData = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || null,
    job_title: (formData.get('job_title') as string) || null,
    department: (formData.get('department') as string) || null,
    employment_type: (formData.get('employment_type') as string) || 'full-time',
    joining_date: (formData.get('joining_date') as string) || null,
    manager_name: (formData.get('manager_name') as string) || null,
    work_location: (formData.get('work_location') as string) || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('employees')
    .update(employeeData)
    .eq('id', id)

  if (error) {
    redirect(`/employees/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
  redirect(`/employees/${id}`)
}

export async function deactivateEmployee(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
  redirect(`/employees/${id}`)
}

export async function activateEmployee(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('employees')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
  redirect(`/employees/${id}`)
}

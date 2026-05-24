'use client'

import { deleteEmployee } from '../actions'

export function DeleteEmployeeButton({ id, name }: { id: string; name: string }) {
  async function handleClick() {
    const confirmed = confirm(
      `Are you sure you want to permanently delete ${name}?\n\nThis action cannot be undone. Consider deactivating instead if you might need the record later.`
    )
    if (!confirmed) return
    await deleteEmployee(id)
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-md transition-colors"
    >
      🗑️ Delete
    </button>
  )
}
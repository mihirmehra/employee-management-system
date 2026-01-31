'use server'

import { revalidatePath } from 'next/cache'
import { getCollection, ObjectId } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { Shift } from '@/lib/types'

export async function createShift(formData: FormData) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as Shift['type']
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const breakDuration = parseInt(formData.get('breakDuration') as string) || 60
  const workingDays = formData.getAll('workingDays').map(d => parseInt(d as string))

  if (!name || !startTime || !endTime) {
    return { error: 'Name, start time, and end time are required' }
  }

  const shifts = await getCollection<Shift>('shifts')
  
  await shifts.insertOne({
    name,
    type: type || 'flexible',
    startTime,
    endTime,
    breakDuration,
    workingDays: workingDays.length > 0 ? workingDays : [1, 2, 3, 4, 5],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  revalidatePath('/dashboard/shifts')
  return { success: true }
}

export async function updateShift(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as Shift['type']
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const breakDuration = parseInt(formData.get('breakDuration') as string) || 60
  const workingDays = formData.getAll('workingDays').map(d => parseInt(d as string))
  const isActive = formData.get('isActive') === 'true'

  const shifts = await getCollection<Shift>('shifts')
  
  await shifts.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        type,
        startTime,
        endTime,
        breakDuration,
        workingDays,
        isActive,
        updatedAt: new Date()
      }
    }
  )

  revalidatePath('/dashboard/shifts')
  return { success: true }
}

export async function deleteShift(id: string) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  // Check if shift is assigned to employees
  const employees = await getCollection('employees')
  const hasEmployees = await employees.findOne({ shiftId: new ObjectId(id) })
  if (hasEmployees) {
    return { error: 'Cannot delete shift assigned to employees' }
  }

  const shifts = await getCollection<Shift>('shifts')
  await shifts.deleteOne({ _id: new ObjectId(id) })

  revalidatePath('/dashboard/shifts')
  return { success: true }
}

export async function getShifts() {
  const shifts = await getCollection<Shift>('shifts')
  const result = await shifts.find({}).sort({ name: 1 }).toArray()
  
  return result.map(s => ({
    ...s,
    _id: s._id?.toString()
  }))
}

export async function assignShift(employeeId: string, shiftId: string) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const employees = await getCollection('employees')
  
  await employees.updateOne(
    { _id: new ObjectId(employeeId) },
    { $set: { shiftId: new ObjectId(shiftId), updatedAt: new Date() } }
  )

  revalidatePath('/dashboard/employees')
  return { success: true }
}

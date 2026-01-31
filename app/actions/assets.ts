'use server'

import { revalidatePath } from 'next/cache'
import { getCollection, ObjectId } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { Asset } from '@/lib/types'

export async function createAsset(formData: FormData) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as Asset['type']
  const serialNumber = formData.get('serialNumber') as string
  const purchaseDate = formData.get('purchaseDate') as string
  const purchasePrice = formData.get('purchasePrice') as string
  const notes = formData.get('notes') as string

  if (!name || !type) {
    return { error: 'Name and type are required' }
  }

  const assets = await getCollection<Asset>('assets')
  
  await assets.insertOne({
    name,
    type,
    serialNumber,
    purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
    purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
    status: 'available',
    notes,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  revalidatePath('/dashboard/assets')
  return { success: true }
}

export async function updateAsset(id: string, formData: FormData) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as Asset['type']
  const serialNumber = formData.get('serialNumber') as string
  const purchaseDate = formData.get('purchaseDate') as string
  const purchasePrice = formData.get('purchasePrice') as string
  const status = formData.get('status') as Asset['status']
  const notes = formData.get('notes') as string

  const assets = await getCollection<Asset>('assets')
  
  await assets.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        type,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        status,
        notes,
        updatedAt: new Date()
      }
    }
  )

  revalidatePath('/dashboard/assets')
  return { success: true }
}

export async function deleteAsset(id: string) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const assets = await getCollection<Asset>('assets')
  const asset = await assets.findOne({ _id: new ObjectId(id) })
  
  if (asset?.status === 'assigned') {
    return { error: 'Cannot delete assigned asset. Unassign first.' }
  }

  await assets.deleteOne({ _id: new ObjectId(id) })

  revalidatePath('/dashboard/assets')
  return { success: true }
}

export async function assignAsset(assetId: string, employeeId: string) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const assets = await getCollection<Asset>('assets')
  
  await assets.updateOne(
    { _id: new ObjectId(assetId) },
    {
      $set: {
        assignedTo: new ObjectId(employeeId),
        assignedAt: new Date(),
        status: 'assigned',
        updatedAt: new Date()
      }
    }
  )

  revalidatePath('/dashboard/assets')
  return { success: true }
}

export async function unassignAsset(assetId: string) {
  const session = await getSession()
  if (!session || !['admin', 'hr'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  const assets = await getCollection<Asset>('assets')
  
  await assets.updateOne(
    { _id: new ObjectId(assetId) },
    {
      $set: {
        status: 'available',
        updatedAt: new Date()
      },
      $unset: {
        assignedTo: '',
        assignedAt: ''
      }
    }
  )

  revalidatePath('/dashboard/assets')
  return { success: true }
}

export async function getAssets(filters?: { status?: Asset['status'], type?: Asset['type'] }) {
  const assets = await getCollection<Asset>('assets')
  const employees = await getCollection('employees')
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {}
  if (filters?.status) query.status = filters.status
  if (filters?.type) query.type = filters.type

  const result = await assets.find(query).sort({ createdAt: -1 }).toArray()
  const employeeList = await employees.find({}).toArray()
  const employeeMap = new Map(employeeList.map(e => [e._id?.toString(), e]))

  return result.map(a => ({
    ...a,
    _id: a._id?.toString(),
    assignedTo: a.assignedTo?.toString(),
    employee: a.assignedTo ? employeeMap.get(a.assignedTo?.toString()) : undefined
  }))
}

export async function getAssetsByEmployee(employeeId: string) {
  const session = await getSession()
  if (!session) return []

  const assets = await getCollection<Asset>('assets')
  
  const result = await assets.find({ assignedTo: new ObjectId(employeeId) }).toArray()

  return result.map(a => ({
    ...a,
    _id: a._id?.toString(),
    assignedTo: a.assignedTo?.toString()
  }))
}

export async function getAssetStats() {
  const assets = await getCollection<Asset>('assets')
  
  const total = await assets.countDocuments()
  const available = await assets.countDocuments({ status: 'available' })
  const assigned = await assets.countDocuments({ status: 'assigned' })
  const maintenance = await assets.countDocuments({ status: 'maintenance' })
  const retired = await assets.countDocuments({ status: 'retired' })

  return { total, available, assigned, maintenance, retired }
}

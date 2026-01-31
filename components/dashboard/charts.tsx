'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface DashboardChartsProps {
  attendanceStats: {
    present: number
    absent: number
    late: number
    onLeave: number
    totalHours: number
  } | null
  tasks: {
    todo: number
    inProgress: number
    review: number
    done: number
  }
}

export function DashboardCharts({ attendanceStats, tasks }: DashboardChartsProps) {
  const taskData = [
    { name: 'To Do', value: tasks.todo, fill: 'hsl(var(--chart-1))' },
    { name: 'In Progress', value: tasks.inProgress, fill: 'hsl(var(--chart-2))' },
    { name: 'Review', value: tasks.review, fill: 'hsl(var(--chart-4))' },
    { name: 'Done', value: tasks.done, fill: 'hsl(var(--success))' },
  ]

  const attendanceData = attendanceStats ? [
    { name: 'Present', value: attendanceStats.present, fill: 'hsl(var(--success))' },
    { name: 'Late', value: attendanceStats.late, fill: 'hsl(var(--warning))' },
    { name: 'On Leave', value: attendanceStats.onLeave, fill: 'hsl(var(--chart-1))' },
    { name: 'Absent', value: attendanceStats.absent, fill: 'hsl(var(--destructive))' },
  ] : []

  return (
    <div className="space-y-8">
      <div>
        <h4 className="mb-4 text-sm font-medium">Tasks Overview</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={taskData}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {attendanceStats && (
        <div>
          <h4 className="mb-4 text-sm font-medium">Attendance This Month</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

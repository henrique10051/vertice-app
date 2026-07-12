import { useEffect, useRef } from 'react'
import { useInventory } from '@/hooks/use-inventory'
import { useAgenda } from '@/hooks/use-agenda'
import { useNotifications } from '@/hooks/use-notifications'

export function NotificationGenerator() {
  const { items } = useInventory()
  const { tasks } = useAgenda()
  const { createNotification } = useNotifications()
  const lastInventoryCheck = useRef<string>('')
  const lastAgendaCheck = useRef<string>('')

  useEffect(() => {
    if (items.length === 0) return
    const lowStock = items.filter(
      (item) => Number(item.current_quantity) <= Number(item.min_quantity),
    )
    const checkKey = lowStock.map((i) => i.id).join(',')
    if (checkKey === lastInventoryCheck.current) return
    lastInventoryCheck.current = checkKey

    lowStock.forEach((item) => {
      createNotification(
        'Item em falta no estoque',
        `${item.name} está abaixo da quantidade mínima (${item.current_quantity}/${item.min_quantity} ${item.unit}).`,
        'inventory',
      )
    })
  }, [items, createNotification])

  useEffect(() => {
    if (tasks.length === 0) return
    const todayStr = new Date().toDateString()
    const todayTasks = tasks.filter((t) => {
      const taskDate = new Date(t.due_date)
      return taskDate.toDateString() === todayStr && t.status === 'pending'
    })
    const checkKey = todayTasks.map((t) => t.id).join(',')
    if (checkKey === lastAgendaCheck.current) return
    lastAgendaCheck.current = checkKey

    todayTasks.forEach((task) => {
      createNotification(
        'Tarefa agendada para hoje',
        `Você tem "${task.title}" agendada para hoje.`,
        'agenda',
      )
    })
  }, [tasks, createNotification])

  return null
}

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid } from '@/composables/useFormat'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface AppNotification {
  id: string
  message: string
  type: NotificationType
  actionLabel?: string
  onAction?: () => void
}

export interface NotifyOptions {
  message: string
  type?: NotificationType
  actionLabel?: string
  onAction?: () => void
  /** Auto-dismiss delay in ms. 0 keeps it until dismissed. Defaults by type. */
  timeout?: number
}

const DEFAULT_TIMEOUTS: Record<NotificationType, number> = {
  info: 4000,
  success: 2200,
  warning: 6000,
  error: 6000,
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function dismiss(id: string) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    items.value = items.value.filter((n) => n.id !== id)
  }

  function notify(options: NotifyOptions): string {
    const id = uid()
    const type = options.type ?? 'info'
    items.value.push({
      id,
      message: options.message,
      type,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    })
    // Keep the stack small so it never covers the whole screen.
    if (items.value.length > 3) {
      dismiss(items.value[0].id)
    }
    const timeout = options.timeout ?? DEFAULT_TIMEOUTS[type]
    if (timeout > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), timeout),
      )
    }
    return id
  }

  function runAction(id: string) {
    const notification = items.value.find((n) => n.id === id)
    notification?.onAction?.()
    dismiss(id)
  }

  return { items, notify, dismiss, runAction }
})

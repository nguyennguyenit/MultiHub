/**
 * Event subscription helpers for Wails runtime events.
 * Provides typed wrappers around EventsOn / EventsOff.
 */
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime'

type CleanupFn = () => void

/** Subscribe to a Wails event and return a cleanup function. */
export function onEvent<T = unknown>(name: string, cb: (data: T) => void): CleanupFn {
  EventsOn(name, cb)
  return () => EventsOff(name)
}

/** Subscribe to multiple events at once, returning a single cleanup function. */
export function onEvents(
  subscriptions: Array<{ name: string; cb: (data: unknown) => void }>
): CleanupFn {
  subscriptions.forEach(({ name, cb }) => EventsOn(name, cb))
  return () => subscriptions.forEach(({ name }) => EventsOff(name))
}

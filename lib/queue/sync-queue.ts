import { Queue } from 'bullmq'
import { connection } from './redis'

let _queue: Queue | null = null

export function getSyncQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('nova-sync', { connection })
  }
  return _queue
}

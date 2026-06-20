import { EventEmitter } from 'node:events';

class TimerEventEmitter extends EventEmitter {
  broadcastUpdate(data: any) {
    this.emit('update', data);
  }
}

export const timerEventEmitter = new TimerEventEmitter();
// Limit listeners to prevent memory leak warnings on high concurrency
timerEventEmitter.setMaxListeners(100);

interface WaitItem<T> {
  resolve: (data: T) => void;
  promise: Promise<T>;
}

export class DataQueue<T> {
  private queue: Array<{ op?: () => void; data: T }> = [];

  private waiting: Array<WaitItem<T>> = [];

  public enqueue(data: T, op?: () => void): void {
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift();
      if (waiter) {
        if (op) {
          op();
        }
        waiter.resolve(data);
      }
    } else {
      this.queue.push({ data, op });
    }
  }

  public destroy(data: T): void {
    let waiter: WaitItem<T> | undefined = this.waiting.shift();
    while (waiter) {
      waiter.resolve(data);
      waiter = this.waiting.shift();
    }
  }

  public async dequeue(): Promise<T> {
    if (this.queue.length > 0) {
      const { data = null, op = null } = this.queue.shift() || {};
      if (op) {
        op();
      }
      if (data) {
        return data;
      }
    }
    let resolve: any;
    const promise = new Promise<T>((r) => {
      const index = this.waiting.length;
      resolve = (t: T) => {
        this.waiting.splice(index, 1);
        r(t);
      };
    });
    this.waiting.push({ resolve, promise });
    return promise;
  }
}

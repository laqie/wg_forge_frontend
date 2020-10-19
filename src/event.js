class Event {
  constructor() {
    this.subscriber = null;
  }

  emit(...args) {
    this.subscriber(...args);
  }

  subscribe(subscriber) {
    this.subscriber = subscriber;
  }

  unsubscribe() {
    this.subscriber = null;
  }
}

export default Event;

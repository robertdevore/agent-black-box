export class Playback {
  constructor(length) {
    this.length = length;
    this.index = 0;
    this.playing = false;
    this.speed = 1;
  }
  seek(index) {
    this.index = Math.max(0, Math.min(this.length - 1, Number(index) || 0));
    return this.index;
  }
  step(delta) {
    this.pause();
    return this.seek(this.index + delta);
  }
  restart() {
    this.pause();
    return this.seek(0);
  }
  play() {
    if (this.index === this.length - 1) this.index = 0;
    this.playing = true;
  }
  pause() {
    this.playing = false;
  }
  tick() {
    if (!this.playing) return this.index;
    this.seek(this.index + 1);
    if (this.index === this.length - 1) this.pause();
    return this.index;
  }
}

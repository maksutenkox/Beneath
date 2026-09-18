import { characterFrameAt, DEFAULT_CHARACTER_CLIPS } from "../animation/CharacterAnimation.js";

export class CharacterSpriteSheet {
  constructor({ url, frameWidth = 64, frameHeight = 80, clips = DEFAULT_CHARACTER_CLIPS, imageFactory = null }) {
    this.url = url;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.clips = clips;
    this.imageFactory = imageFactory;
    this.image = null;
    this.ready = false;
    this.failed = false;
    this.loading = null;
  }

  load() {
    if (this.ready) return Promise.resolve(true);
    if (this.failed) return Promise.resolve(false);
    if (this.loading) return this.loading;

    const createImage = this.imageFactory ?? (() => new Image());
    const image = createImage();
    this.image = image;

    this.loading = new Promise((resolve) => {
      image.onload = () => {
        this.ready = true;
        this.failed = false;
        resolve(true);
      };
      image.onerror = () => {
        this.ready = false;
        this.failed = true;
        resolve(false);
      };
      image.src = this.url;
    });

    return this.loading;
  }

  frame({ state = "idle", direction = "south", time = 0 } = {}) {
    return characterFrameAt({ state, direction, time, clips: this.clips });
  }

  draw(context, {
    state = "idle",
    direction = "south",
    time = 0,
    x,
    y,
    scale = 1,
    anchorX = .5,
    anchorY = 1
  }) {
    if (!this.ready || !this.image) return false;

    const frame = this.frame({ state, direction, time });
    const sourceX = frame.column * this.frameWidth;
    const sourceY = frame.row * this.frameHeight;
    const width = this.frameWidth * scale;
    const height = this.frameHeight * scale;

    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      this.image,
      sourceX,
      sourceY,
      this.frameWidth,
      this.frameHeight,
      Math.round(x - width * anchorX),
      Math.round(y - height * anchorY),
      Math.round(width),
      Math.round(height)
    );
    context.restore();
    return true;
  }
}

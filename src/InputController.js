
class InputController {
  constructor(target, isZoomedCallback) {
    this.target_ = target || document;
    this.isZoomedCallback = isZoomedCallback;
    this.initialize_();    
  }

  initialize_() {
    this.current_ = {
      leftButton: false,
      rightButton: false,
      mouseXDelta: 0,
      mouseYDelta: 0,
      mouseX: 0,
      mouseY: 0,
    };
    this.previous_ = null;
    this.keys_ = {};
    this.previousKeys_ = {};
    this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
    this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
    this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
    this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
    this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);
    this.target_.addEventListener('click', (e) => this.onClick_(e), false);
    this.target_.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
    this.target_.addEventListener('mozpointerlockchange', this.onPointerLockChange.bind(this), false);
  }

  checkForInteraction() {
    const event = new CustomEvent('checkInteraction');
    this.target_.dispatchEvent(event);
  }
    
  requestPointerLock() {
    this.target_.body.requestPointerLock = this.target_.body.requestPointerLock || this.target_.body.mozRequestPointerLock;
    this.target_.body.requestPointerLock();
  }

  onClick_(e) {
    if (this.isZoomedCallback && !this.isZoomedCallback()) {
      this.requestPointerLock();
    }
    this.checkForInteraction();
  }

  onPointerLockChange() {
    if (this.target_.pointerLockElement === null || this.target_.mozPointerLockElement === null) {
      const event = new CustomEvent('pointerLockChange');
      this.target_.dispatchEvent(event);
    }
  }

  onMouseMove_(e) {
    // Calculate how much the mouse has moved
    const movementX = e.movementX || e.mozMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || 0;

    // Update the current mouse position and delta
    this.current_.mouseX += movementX;
    this.current_.mouseY += movementY;
    this.current_.mouseXDelta = movementX;
    this.current_.mouseYDelta = movementY;

    // Store the current state for the next update
    this.previous_ = {...this.current_};
  }

  onMouseDown_(e) {
    this.onMouseMove_(e);

    switch (e.button) {
      case 0: {
        this.current_.leftButton = true;
        break;
      }
      case 2: {
        this.current_.rightButton = true;
        break;
      }
    }
  }

  onMouseUp_(e) {
    this.onMouseMove_(e);

    switch (e.button) {
      case 0: {
        this.current_.leftButton = false;
        break;
      }
      case 2: {
        this.current_.rightButton = false;
        break;
      }
    }
  }

  onKeyDown_(e) {
    this.keys_[e.keyCode] = true;
  }

  onKeyUp_(e) {
    this.keys_[e.keyCode] = false;
  }

  key(keyCode) {
    return !!this.keys_[keyCode];
  }

  isReady() {
    return this.previous_ !== null;
  }

  update(_) {
    if (this.previous_ !== null) {
      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

      this.previous_ = {...this.current_};
    }
  }
};

export default InputController;
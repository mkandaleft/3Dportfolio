/**
 * Represents an input controller for handling mouse and keyboard events.
 * @class
 */
class InputController {
  /**
   * Creates a new InputController.
   * @param {*} target is html document
   * @param {*} isZoomedCallback checks if isZoomed is true/false in FirstPersonCameraDemo.js
   * @constructor
    */
  constructor(target, isZoomedCallback) {
    this.target_ = target || document;
    this.isZoomedCallback = isZoomedCallback;
    this.initialize_();    
  }

  /**
   * Initializes the InputController.
   * Adds EventListeners for mouse and keyboard events as well as pointer lock change events.
   */
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
    this.target_.addEventListener('pointerlockchange', (e) => this.onPointerLockChange_(e), false);
    this.target_.addEventListener('mozpointerlockchange', (e) => this.onPointerLockChange_(e), false);
  }

  /**
   * When a click is registered, check for interaction with the an object from the FirstPersonCamera class
   * by dispatching en Event that will trigger checkInteraction() in the FirstPersonCamera class.
   */
  checkForInteraction() {
    const event = new CustomEvent('checkInteraction');
    this.target_.dispatchEvent(event);
  }
  /**
   * Requests the pointer lock to screen.
   */
  requestPointerLock() {
    this.target_.body.requestPointerLock = this.target_.body.requestPointerLock || this.target_.body.mozRequestPointerLock;
    this.target_.body.requestPointerLock();
  }

  /**
   * Handles the click event. If the user is not zoomed in calls requestPointerLock().
   * Else calls checkForInteraction() to see if user is interacting with an object.
   * @param {Event} e - The click event object.
   */
  onClick_(e) {
    if (this.isZoomedCallback && !this.isZoomedCallback()) {
      this.requestPointerLock();
    }
    this.checkForInteraction();
  }

  /**
   * Handles the pointer lock change event.
   * Dispatches a custom 'pointerLockChange' event that triggers pointerLockChange() in FirstPersonCamera.js.
   * @param {Event} e - The pointer lock change event object.
   */
  onPointerLockChange_(e) {
    if (this.target_.pointerLockElement === null || this.target_.mozPointerLockElement === null) {
      const event = new CustomEvent('pointerLockChange');
      this.target_.dispatchEvent(event);
    }
  }


  /**
   * Handles the mouse move event.
   * @param {MouseEvent} e - The mouse move event object.
   */
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

  /**
   * Handles the mouse down event.
   * @param {MouseEvent} e - The mouse event object.
   */
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

  /**
   * Handles the mouse up event.
   * @param {MouseEvent} e - The mouse event object.
   */
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

  /**
   * Handles the keydown event.
   * @param {KeyboardEvent} e - The keydown event object.
   */
  onKeyDown_(e) {
    this.keys_[e.keyCode] = true;
  }

  /**
   * Handles the key up event.
   * @param {KeyboardEvent} e - The key up event object.
   */
  onKeyUp_(e) {
    this.keys_[e.keyCode] = false;
  }

  /**
   * Checks if a specific key is currently pressed.
   * 
   * @param {number} keyCode - The key code of the key to check.
   * @returns {boolean} - True if the key is currently pressed, false otherwise.
   */
  key(keyCode) {
    return !!this.keys_[keyCode];
  }

  /**
   * Checks if the input controller is ready.
   * @returns {boolean} Returns true if the input controller is ready, false otherwise.
   */
  isReady() {
    return this.previous_ !== null;
  }

  /**
   * Updates the input controller.
   * @param {any} _ - The update parameter (not used in this function).
   */
  update(_) {
    if (this.previous_ !== null) {
      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

      this.previous_ = {...this.current_};
    }
  }
};

export default InputController;
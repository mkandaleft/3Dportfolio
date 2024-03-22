
import * as THREE from 'https://cdn.skypack.dev/three@0.136';

class InputController {
    constructor(target) {
      this.target_ = target || document;
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
      
      this.target_.addEventListener('click', (e) => {
        // Request pointer lock for first-person control
        if (document.pointerLockElement !== this.target_ && document.mozPointerLockElement !== this.target_) {
          document.body.requestPointerdwsLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
          document.body.requestPointerLock();
          this.checkForInteraction();
        } else {
          // If already in pointer lock, check for interactions
          //this.checkForInteraction();
          console.log("REEEE");
        }
      }, false);
    }
  
    checkForInteraction() {
      const event = new CustomEvent('checkInteraction');
      this.target_.dispatchEvent(event);
    }
      
    
      /*
      lockChangeAlert() {
        const ptLock = document.pointerLockElement === this.target_;
        const mzPoint = document.mozPointerLockElement === this.target_;
        console.log(ptLock);
        console.log(mzPoint);
        setTimeout(() => {  // Delay the execution of the method
          // Check if the document is in pointer lock mode
          if (document.pointerLockElement === this.target_ || document.mozPointerLockElement === this.target_) {
          console.log('The pointer lock status is now locked');
          // Do any additional pointer lock setup here
          this.target_.addEventListener('mousemove', this.onMouseMoveBound_, false);
          } else {
          console.log('The pointer lock status is now unlocked');  
          // Do any additional pointer lock cleanup here
          this.target_.removeEventListener('mousemove', this.onMouseMoveBound_, false);
          }
        }, 0);
      }
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
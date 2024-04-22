
import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import InputController from './InputController';

/**
 * Clamps a value between a minimum and maximum range. Used in camera rotation
 *
 * @param {number} x - The value to be clamped.
 * @param {number} a - The minimum value of the range.
 * @param {number} b - The maximum value of the range.
 * @returns {number} The clamped value.
 */
function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

/**
 * The key codes for the keys used in the application.  
 */
const KEYS = {
    'a': 65,
    's': 83,
    'w': 87,
    'd': 68,
    'r': 82,
    'escape': 27
};

/**
 * A first person camera.
 * @class
 */
class FirstPersonCamera {

  /**
   * Creates a new FirstPersonCamera and use this.input_ to create a new InputController.
   * Attaches event listeners to the document for the checkInteraction and pointerLockChange events.
   * @param {THREE.Camera} camera - The camera to control.
   * @param {Array<THREE.Object3D>} objects - The objects to interact with.
   * @constructor
   */
  constructor(camera, objects) {
      this.camera_ = camera;
      this.isZoomedIn = false;
      this.isInMenu - false;
      this.isAnimating = false;
      this.input_ = new InputController(document, this.isZoomedCallback.bind(this));
      this.rotation_ = new THREE.Quaternion();
      this.translation_ = new THREE.Vector3(0, 2.5, 0);
      this.phi_ = 0;
      this.phiSpeed_ = 8;
      this.theta_ = 0;
      this.thetaSpeed_ = 10;
      this.headBobActive_ = false;
      this.headBobTimer_ = 0;
      this.objects_ = objects;
      this.raycaster_ = new THREE.Raycaster();
      this.mouse_ = new THREE.Vector2();
      this.interactableObjects = []; 

      this.totalTimeElapsed = 0;

      this.input_.target_.addEventListener('checkInteraction', () => this.checkInteraction());
      this.input_.target_.addEventListener('pointerLockChange', () => this.pointerLockChange());

      this.resetButton = document.getElementById("resetView");
      this.resetButton.addEventListener("click", () => this.resetView());

      this.exitButton = document.getElementById("ExitButton");
      this.exitButton.addEventListener("click", () => this.exitSimulation());
  }
  
  /**
   * Sets the interactable objects for the FirstPersonCamera.
   * @param {Array} interactableObjects - An array of interactable objects.
   */
  async setInteractableObjects(interactableObjects) {
    this.interactableObjects = interactableObjects;
  }

  /**
   * Updates a lot of things and detects some input.
   * @param {number} timeElapsedS - The update time in seconds.
   */
  update(timeElapsedS) {
    this.updateRotation_(timeElapsedS);
    this.updateCamera_(timeElapsedS);
    this.updateHeadBob_(timeElapsedS);
    this.input_.update(timeElapsedS);
    this.promptInteraction();
    if (!this.isZoomedIn) {
      this.updateTranslation_(timeElapsedS);
    }
    this.checkDistanceToTV();
    this.updateControlDisplay();
    this.updateEscapeDisplay();

    // Reset view if 'r' is pressed and camera is zoomed in
    if ((this.input_.key(KEYS.r)) && this.isZoomedIn) {  
      this.resetView();  
    }
    
    // Under development to escape menu and zoom with escape
    if (this.input_.key(KEYS.escape)) {
      if (this.isZoomedIn) {
        // this.resetView();
      }
    }
    this.totalTimeElapsed += 1;
  }

  /**
   * Updates the camera position and rotation.
   * @param {number} _ - The update time.
   */
  updateCamera_(_) {
    this.camera_.quaternion.copy(this.rotation_);
    this.camera_.position.copy(this.translation_);
    this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * 0.3;

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation_);

    const dir = forward.clone();

    forward.multiplyScalar(100);
    forward.add(this.translation_);
  }

  /**
   * Updates the head bob effect.
   * @param {number} timeElapsedS - The update time in seconds.
   */
  updateHeadBob_(timeElapsedS) {
    if (this.headBobActive_) {
      // Update if camera not zoomed in
      if (!this.isZoomedIn) {
        const wavelength = Math.PI;
        const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.00001) * 10) / wavelength);
        const nextStepTime = nextStep * wavelength / 10;
        this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);
  
        if (this.headBobTimer_ == nextStepTime) {
          this.headBobActive_ = false;
        }
      }
    }
  }

  /**
   * Updates the camera translation and allow headbob while moving.
   * @param {number} timeElapsedS - The update time in seconds.
   */
  updateTranslation_(timeElapsedS) {
    const forwardVelocity = (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0)
    const strafeVelocity = (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0)

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(qx);
    forward.multiplyScalar(forwardVelocity * timeElapsedS * 10);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(qx);
    left.multiplyScalar(strafeVelocity * timeElapsedS * 10);
    
    this.translation_.add(forward);
    this.translation_.add(left);

    if (forwardVelocity != 0 || strafeVelocity != 0) {
      this.headBobActive_ = true;
    }

    // Limit camera translation in room
    const roomDimensions = { minX: -14.5, maxX: 14.5, minY: 0, maxY: 10, minZ: -14.5, maxZ: 14.5 };
    if (this.translation_.x < roomDimensions.minX) {
      this.translation_.x = roomDimensions.minX
    }
    if (this.translation_.x > roomDimensions.maxX) {
      this.translation_.x = roomDimensions.maxX
    }
    if (this.translation_.z < roomDimensions.minZ) {
      this.translation_.z = roomDimensions.minZ
    }
    if (this.translation_.z > roomDimensions.maxZ) {
      this.translation_.z = roomDimensions.maxZ
    }
  }

  /**
   * Updates the camera rotation.
   * @param {number} timeElapsedS - The update time in seconds.
   */
  updateRotation_(timeElapsedS) {
    const xh = this.input_.current_.mouseXDelta / window.innerWidth;
    const yh = this.input_.current_.mouseYDelta / window.innerHeight;

    // If the user is not zoomed in, allow camera rotation
    if (!this.isZoomedIn) {
      this.phi_ += -xh * this.phiSpeed_;
      this.theta_ = clamp(this.theta_ + -yh * this.thetaSpeed_, -Math.PI / 3, Math.PI / 3);
  
      const qx = new THREE.Quaternion();
      qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
      const qz = new THREE.Quaternion();
      qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);
  
      const q = new THREE.Quaternion();
      q.multiply(qx);
      q.multiply(qz);
  
      this.rotation_.copy(q);
    }
  }

  /**
   * Prompts interaction with objects.
   * This method uses a raycaster to detect if user is looking at an object in the scene
   * and is close enough to interact with it.
   * It then displays a click prompt if the object is facing the user and is close enough.
   */
  promptInteraction() {
    this.raycaster_.setFromCamera(this.mouse_, this.camera_);
    const intersects = this.raycaster_.intersectObjects(this.interactableObjects, true);
    
    const clickPrompt = document.getElementById('click-prompt');

    if (intersects.length > 0 && !this.isZoomedIn) {
      let object = intersects[0].object;

      // Traverse up to find the interactable object instead of the mesh
      while (object && !this.interactableObjects.includes(object)) {
        object = object.parent;
      }
      // Display click prompt if object is facing user and is close enough
      if (object && this.camera_.position.distanceTo(object.position) < 15) {
        clickPrompt.style.display = 'block';
        this.displayContent('click-prompt');
      } else {
        clickPrompt.style.display = 'none';
      }
    } else {
      clickPrompt.style.display = 'none';
    }
  }

  /**
   * Checks for interaction with objects.
   * Similar to promptInteraction, but this method zooms in to the object if it is clicked.
   */
  checkInteraction() {
    this.raycaster_.setFromCamera(this.mouse_, this.camera_);
    const intersects = this.raycaster_.intersectObjects(this.interactableObjects, true);
  
    if (intersects.length > 0) {
      let object = intersects[0].object;
  
      while (object && !this.interactableObjects.includes(object)) {
        object = object.parent;
      }
  
      if (object && this.camera_.position.distanceTo(object.position) < 15 && !this.isInMenu) {
        this.zoomToObject(object);
      }
    }
  }

  checkDistanceToTV() {
    if (!this.isZoomedIn && !this.isAnimating) {
      if (this.camera_.position.distanceTo(new THREE.Vector3(14, 2, 14)) < 10) {
        this.dispatchTVDisplay("computer");
      }
      if (this.camera_.position.distanceTo(new THREE.Vector3(14, 2, 14)) >= 10) {
        this.dispatchTVRemoveDisplay("computer");
      }

      if (this.camera_.position.distanceTo(new THREE.Vector3(14, 2, -14)) < 10) {
        this.dispatchTVDisplay("jbox");
      }
      if (this.camera_.position.distanceTo(new THREE.Vector3(14, 2, -14)) >= 10) {
        this.dispatchTVRemoveDisplay("jbox");
      }

      if (this.camera_.position.distanceTo(new THREE.Vector3(-14, 2, 14)) < 10) {
        this.dispatchTVDisplay("scroll");
      }
      if (this.camera_.position.distanceTo(new THREE.Vector3(-14, 2, 14)) >= 10) {
        this.dispatchTVRemoveDisplay("scroll");
      }

      if (this.camera_.position.distanceTo(new THREE.Vector3(-14, 2, -14)) < 10) {
        this.dispatchTVDisplay("tv1");
        this.dispatchTVDisplay("tv2");
      }
      if (this.camera_.position.distanceTo(new THREE.Vector3(-14, 2, -14)) >= 10) {
        this.dispatchTVRemoveDisplay("tv1");
        this.dispatchTVRemoveDisplay("tv2");
      }
    }
    // if (this.isZoomedIn) {
    //   this.dispatchTVRemoveDisplay("computer");
    //   this.dispatchTVRemoveDisplay("jbox");
    //   this.dispatchTVRemoveDisplay("scroll");
    //   this.dispatchTVRemoveDisplay("tv1");
    //   this.dispatchTVRemoveDisplay("tv2");
    // }
  }

  /**
   * Calls menuHandler() if lock change event triggered from InputController class.
   */
  pointerLockChange() {
    if (!this.isZoomedIn) {
      this.menuHandler();
    } 
  }

  /**
   * Handles menu interaction.
   */
  menuHandler() {
    this.isInMenu = true;
    this.isZoomedIn = true;
    this.displayContent("escapeMenu");
    this.displayBackButton();
  }
  
  /**
   * Zooms the camera to an object.
   * @param {THREE.Object3D} object - The object to zoom to.
   */
  zoomToObject(object) {
    this.originalPosition = this.camera_.position.clone();
    this.originalQuaternion = this.camera_.quaternion.clone();

    // Unlock the pointer lock
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    document.exitPointerLock();

    // Determine which object to zoom to
    // and set the camera position and rotation accordingly
    // then display content for the object.
    switch (object.name) {
      case 'jbox':
        const zoomPositionJbox = new THREE.Vector3(14.85, 3, -14.85);
        this.translation_.copy(zoomPositionJbox);

        const zoomRotationJBox = new THREE.Quaternion();
        zoomRotationJBox.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 7*Math.PI / 4);
  
        const q1 = new THREE.Quaternion();
        q1.multiply(zoomRotationJBox);
    
        this.rotation_.copy(q1);
        this.displayContent("contentForJBox");
        this.displayBackButton();
        break;
      
      case 'computer':
        const zoomPositionComp = new THREE.Vector3(17, 3, 17);
        this.translation_.copy(zoomPositionComp);

        const zoomRotationComp = new THREE.Quaternion();
        zoomRotationComp.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 5*Math.PI / 4);
  
        const q2 = new THREE.Quaternion();
        q2.multiply(zoomRotationComp);
    
        this.rotation_.copy(q2);
        this.displayContent("contentForComputer");
        this.displayBackButton();
        break;

      case 'scroll':
        const zoomPositionScroll = new THREE.Vector3(-14, 3, 14);
        this.translation_.copy(zoomPositionScroll);

        const zoomRotationScroll = new THREE.Quaternion();
        zoomRotationScroll.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 3*Math.PI / 4);
  
        const q3 = new THREE.Quaternion();
        q3.multiply(zoomRotationScroll);
    
        this.rotation_.copy(q3);
        this.displayContent("contentForCareer");
        this.displayBackButton();
        break;
      
      case 'tv1':
        const zoomPositionTV1 = new THREE.Vector3(-14.5, 2.5, -18);
        this.translation_.copy(zoomPositionTV1);

        const zoomRotationTV1 = new THREE.Quaternion();
        zoomRotationTV1.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 0 / 8);

        const zoomRotationTV1x = new THREE.Quaternion();
        zoomRotationTV1x.setFromAxisAngle(new THREE.Vector3(-1, 0, 0).normalize(), -Math.PI / 5);

        const q4 = new THREE.Quaternion();
        q4.multiply(zoomRotationTV1);
        q4.multiply(zoomRotationTV1x);

        this.rotation_.copy(q4);
        this.displayContent("contentForCondoMAXium");
        this.displayBackButton();
        break;
      
      case 'tv2':
        const zoomPositionTV2 = new THREE.Vector3(-14.5, 6.5, -18);
        this.translation_.copy(zoomPositionTV2);

        const zoomRotationTV2 = new THREE.Quaternion();
        zoomRotationTV2.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 0 / 8);

        const zoomRotationTV2x = new THREE.Quaternion();
        zoomRotationTV2x.setFromAxisAngle(new THREE.Vector3(-1, 0, 0).normalize(), -Math.PI / 5);

        const q5 = new THREE.Quaternion();
        q5.multiply(zoomRotationTV2);
        q5.multiply(zoomRotationTV2x);

        this.rotation_.copy(q5);
        this.displayContent("contentForTime2Chill");
        this.displayBackButton();
        break;
        

      default:
        break;
    }
    this.isZoomedIn = true;
  }

  /**
   * Displays the back button on the page.
   */
  displayBackButton() {
    const backButton = document.getElementById('resetView');
    backButton.style.display = 'block';
  }
  
  /**
   * Displays the content with the specified ID and hides any previously displayed content.
   * @param {string} contentId - The ID of the content element to be displayed.
   */
  displayContent(contentId) {
    // Hide any previously displayed content
    document.querySelectorAll('.object-content').forEach(div => {
      div.style.display = 'none';
    });
  
    const contentElement = document.getElementById(contentId);
    if (contentElement) {
      contentElement.style.display = 'block';
    }
  }

  dispatchTVDisplay(contentName) {
    const event = new CustomEvent('checkTVDisplay', { detail: { contentName: contentName } });
    this.input_.target_.dispatchEvent(event);
  }

  dispatchTVRemoveDisplay(contentName) {
    const event = new CustomEvent('checkTVRemoveDisplay', { detail: { contentName: contentName } });
    this.input_.target_.dispatchEvent(event);
  }

  updateControlDisplay() {
    // Allow translation if not zoomed in
    if (!this.isZoomedIn && (this.totalTimeElapsed <= 500)) {
      if (!controlsDisplay.style.display || controlsDisplay.style.display === 'none') {
        controlsDisplay.style.display = 'block';
      }
    } else {
      if (controlsDisplay.style.display !== 'none') {
        controlsDisplay.style.display = 'none';
      }
    }
  }

  updateEscapeDisplay() {
    const escapeDisplay = document.getElementById('escapeDisplay');
    const controls = document.getElementById('controls');
    if (!this.isZoomedIn) {
      if (!escapeDisplay.style.display || escapeDisplay.style.display === 'none') {
        escapeDisplay.style.display = 'block';
      }
    } else {
      if (escapeDisplay.style.display !== 'none') {
        escapeDisplay.style.display = 'none';
      }
    }
  }
  
  /**
   * Resets the view of the camera.
   * If not in the menu, it zooms out of the object and restores the original position and quaternion of the camera.
   * Hides the resetView button and hides all object content divs.
   * Requests pointer lock for the document body.
   * Sets the isZoomedIn and isInMenu flags to false.
   */
  resetView() {
    // requestAnimationFrame helps with synchronizing events
    requestAnimationFrame(() => {
      // zoom out of object if not in menu
      if (!this.isInMenu) {
        this.translation_.copy(this.originalPosition);
        this.translation_.y = 2.5;
        this.rotation_.copy(this.originalQuaternion);
      }
  
      const backButton = document.getElementById('resetView');
      backButton.style.display = 'none';

      document.querySelectorAll('.object-content').forEach(div => {
        div.style.display = 'none';
      });
            
      document.body.requestPointerdwsLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
      document.body.requestPointerLock();

      this.isZoomedIn = false;
      this.isInMenu = false;
    });
  }
  
  /**
   * Exits the simulation by reloading the page.
   */
  exitSimulation() {
    location.reload();
  }

  /**
   * Returns the current zoom state of the camera.
   * @returns {boolean} The zoom state of the camera.
   */
  isZoomedCallback() {
    return this.isZoomedIn;
  }
  
  // updateCameraCoordinatesDisplay() {
  //   const coordinatesElement = document.getElementById('camera-coordinates');
  //   if (coordinatesElement) {
  //     coordinatesElement.textContent = `Camera Position: x=${this.translation_.x.toFixed(2)}, y=${this.translation_.y.toFixed(2)}, z=${this.translation_.z.toFixed(2)}`;
  //   }
  // }
}

export default FirstPersonCamera;
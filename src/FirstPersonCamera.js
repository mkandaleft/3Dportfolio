
import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import InputController from './InputController';

function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

const KEYS = {
    'a': 65,
    's': 83,
    'w': 87,
    'd': 68,
    'r': 82,
    'escape': 27
};

class FirstPersonCamera {
    constructor(camera, objects) {
      this.camera_ = camera;
      this.input_ = new InputController();
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
      this.isZoomedIn = false;
      this.input_.target_.addEventListener('checkInteraction', () => this.checkInteraction());
  }
  
    async setInteractableObjects(interactableObjects) {
      this.interactableObjects = interactableObjects;
    }
  
    update(timeElapsedS) {
      this.updateRotation_(timeElapsedS);
      this.updateCamera_(timeElapsedS);
      this.updateHeadBob_(timeElapsedS);
      this.input_.update(timeElapsedS);
      this.updateCameraCoordinatesDisplay();
  
      if (!this.isZoomedIn) {
        this.updateTranslation_(timeElapsedS);
      }
      if ((this.input_.key(KEYS.r)) && this.isZoomedIn) {
        this.resetView();
      }
    }
  
    updateCamera_(_) {
      this.camera_.quaternion.copy(this.rotation_);
      this.camera_.position.copy(this.translation_);
      this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * 0.3;
  
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.rotation_);
  
      const dir = forward.clone();
  
      forward.multiplyScalar(100);
      forward.add(this.translation_);
  
      let closest = forward;
      const result = new THREE.Vector3();
      const ray = new THREE.Ray(this.translation_, dir);
      for (let i = 0; i < this.objects_.length; ++i) {
        if (ray.intersectBox(this.objects_[i], result)) {
          if (result.distanceTo(ray.origin) < closest.distanceTo(ray.origin)) {
            closest = result.clone();
          }
        }
      }
  
      this.camera_.lookAt(closest);
    }
  
    updateHeadBob_(timeElapsedS) {
      if (this.headBobActive_) {
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
      const roomDimensions = { minX: -14.5, maxX: 14.5, minY: 0, maxY: 4, minZ: -14.5, maxZ: 14.5 };
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
  
            // Limit camera translation in box
      const boxDimensions = { minX: -5, maxX: 5, minY: 0, maxY: 4, minZ: -5, maxZ: 5 };
      const inBox = this.translation_.x > boxDimensions.minX && this.translation_.x < boxDimensions.maxX && this.translation_.z > boxDimensions.minZ && this.translation_.z < boxDimensions.maxZ;
      
      if (inBox) {
        const distances = {
          minX: Math.abs(this.translation_.x - boxDimensions.minX),
          maxX: Math.abs(this.translation_.x - boxDimensions.maxX),
          minZ: Math.abs(this.translation_.z - boxDimensions.minZ),
          maxZ: Math.abs(this.translation_.z - boxDimensions.maxZ),
        };
      
        const minDistance = Math.min(distances.minX, distances.maxX, distances.minZ, distances.maxZ);
      
        switch (minDistance) {
          case distances.minX:
            this.translation_.x = boxDimensions.minX;
            break;
          case distances.maxX:
            this.translation_.x = boxDimensions.maxX;
            break;
          case distances.minZ:
            this.translation_.z = boxDimensions.minZ;
            break;
          case distances.maxZ:
            this.translation_.z = boxDimensions.maxZ;
            break;
        }
      }
    }
  
    updateRotation_(timeElapsedS) {
      const xh = this.input_.current_.mouseXDelta / window.innerWidth;
      const yh = this.input_.current_.mouseYDelta / window.innerHeight;
  
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
  
    checkInteraction() {
      this.raycaster_.setFromCamera(this.mouse_, this.camera_);
      const intersects = this.raycaster_.intersectObjects(this.interactableObjects, true);
    
      if (intersects.length > 0) {
        let object = intersects[0].object; // Assuming we're interested in the first intersected object
    
        // Traverse up to find the interactable object
        while (object && !this.interactableObjects.includes(object)) {
          object = object.parent;
        }
    
        if (object && this.camera_.position.distanceTo(object.position) < 8) {
          // Perform action based on the object's name without directly checking for mouse input here
          this.zoomToObject(object);
        }
      }
    }
    
    zoomToObject(object) {
      this.originalPosition = this.camera_.position.clone();
      console
      this.originalQuaternion = this.camera_.quaternion.clone();
  
      switch (object.name) {
        case 'Boxxx':
          console.log("Action for Boxxx");
          break;
  
        case 'jbox':
          const zoomPosition1 = new THREE.Vector3(14.85, 3, -14.85);
          this.translation_.copy(zoomPosition1);
  
          const zoomRotation1 = new THREE.Quaternion();
          zoomRotation1.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 7*Math.PI / 4);
    
          const q1 = new THREE.Quaternion();
          q1.multiply(zoomRotation1);
      
          this.rotation_.copy(q1);
          this.displayContent("contentForJBox")
          break;
        
        case 'computer':
          const zoomPosition2 = new THREE.Vector3(17, 3, 17);
          this.translation_.copy(zoomPosition2);
  
          const zoomRotation2 = new THREE.Quaternion();
          zoomRotation2.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 5*Math.PI / 4);
    
          const q2 = new THREE.Quaternion();
          q2.multiply(zoomRotation2);
      
          this.rotation_.copy(q2);
          this.displayContent("contentForComputer")
          break;
        
        default:
          break;
      }
      this.isZoomedIn = true;
    }
    
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
  
    resetView() {
      this.camera_.position.copy(this.originalPosition);
      this.camera_.quaternion.copy(this.originalQuaternion);
      
      this.isZoomedIn = false;
    
      // Hide all object-specific content divs
      document.querySelectorAll('.object-content').forEach(div => {
        div.style.display = 'none';
      });
    }
    
    updateCameraCoordinatesDisplay() {
      const coordinatesElement = document.getElementById('camera-coordinates');
      if (coordinatesElement) {
        coordinatesElement.textContent = `Camera Position: x=${this.translation_.x.toFixed(2)}, y=${this.translation_.y.toFixed(2)}, z=${this.translation_.z.toFixed(2)}`;
      }
    }
  }

  export default FirstPersonCamera;
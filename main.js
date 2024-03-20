import './style.css'

import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const KEYS = {
  'a': 65,
  's': 83,
  'w': 87,
  'd': 68,
};

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

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
    
    // document.addEventListener('pointerlockchange', this.lockChangeAlert.bind(this), false);
    // document.addEventListener('mozpointerlockchange', this.lockChangeAlert.bind(this), false);

    this.target_.addEventListener('click', (e) => {
      // Request pointer lock
      document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
      document.body.requestPointerLock();
    }, false);
    
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
  }

  update(timeElapsedS) {
    this.updateRotation_(timeElapsedS);
    this.updateCamera_(timeElapsedS);
    this.updateTranslation_(timeElapsedS);
    this.updateHeadBob_(timeElapsedS);
    this.input_.update(timeElapsedS);
    this.updateCameraCoordinatesDisplay();
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
      const wavelength = Math.PI;
      const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.00001) * 10) / wavelength);
      const nextStepTime = nextStep * wavelength / 10;
      this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);

      if (this.headBobTimer_ == nextStepTime) {
        this.headBobActive_ = false;
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

  updateCameraCoordinatesDisplay() {
    const coordinatesElement = document.getElementById('camera-coordinates');
    if (coordinatesElement) {
      coordinatesElement.textContent = `Camera Position: x=${this.translation_.x.toFixed(2)}, y=${this.translation_.y.toFixed(2)}, z=${this.translation_.z.toFixed(2)}`;
    }
  }
}


class FirstPersonCameraDemo {
  constructor() {
    this.initialize_();
  }

  initialize_() {
    this.initializeRenderer_();
    this.initializeLights_();
    this.initializeScene_();
    this.initializePostFX_();
    this.initializeDemo_();

    this.previousRAF_ = null;
    this.raf_();
    this.onWindowResize_();
  }

  initializeDemo_() {
    // this.controls_ = new FirstPersonControls(
    //     this.camera_, this.threejs_.domElement);
    // this.controls_.lookSpeed = 0.8;
    // this.controls_.movementSpeed = 5;

    this.fpsCamera_ = new FirstPersonCamera(this.camera_, this.objects_);
  }

  initializeRenderer_() {
    this.threejs_ = new THREE.WebGLRenderer({
      antialias: false,
    });
    this.threejs_.shadowMap.enabled = true;
    this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
    this.threejs_.physicallyCorrectLights = true;
    this.threejs_.outputEncoding = THREE.sRGBEncoding;

    document.body.appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.onWindowResize_();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(0, 2, 0);

    this.scene_ = new THREE.Scene();

    this.uiCamera_ = new THREE.OrthographicCamera(
        -1, 1, 1 * aspect, -1 * aspect, 1, 1000);
    this.uiScene_ = new THREE.Scene();
  }

  async initializeScene_() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([

      'concrete-backdrop.jpg',
  ]);

    // loads space background
    const spaceTexture = new THREE.TextureLoader().load('nebula-background.webp');
    spaceTexture.encoding = THREE.sRGBEncoding;
    const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      map: spaceTexture,
      side: THREE.BackSide
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene_.add(sphere);

    texture.encoding = THREE.sRGBEncoding;
    // this.scene_.background = texture;

    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();
    const checkerboard = mapLoader.load('concrete-backdrop.jpg');
    checkerboard.anisotropy = maxAnisotropy;
    checkerboard.wrapS = THREE.RepeatWrapping;
    checkerboard.wrapT = THREE.RepeatWrapping;
    checkerboard.repeat.set(32, 32);
    checkerboard.encoding = THREE.sRGBEncoding;

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      new THREE.MeshStandardMaterial({map: checkerboard}));
    box.position.set(0, 2, 0);
    box.rotation.y = Math.PI / 4; // Rotate the box by pi/4
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene_.add(box);

    const meshes = [
      box];

    this.objects_ = [];

    for (let i = 0; i < meshes.length; ++i) {
      const b = new THREE.Box3();
      b.setFromObject(meshes[i]);
      this.objects_.push(b);
    }

    // Load Floor
    try {
      const floor1 = await this.loadModel_('Map/Floor/floor.glb');
      floor1.scene.scale.set(11, 5, 11);
      floor1.scene.position.x += 11;
      floor1.scene.position.y += -4.3;
      floor1.scene.position.z += -11;
      this.scene_.add(floor1.scene);

      const floor2 = await this.loadModel_('Map/Floor/floor.glb');
      floor2.scene.scale.set(11, 5, 11);
      floor2.scene.position.x += 11;
      floor2.scene.position.y += -4.3;
      floor2.scene.position.z += 11;
      this.scene_.add(floor2.scene);

      const floor3 = await this.loadModel_('Map/Floor/floor.glb');
      floor3.scene.scale.set(11, 5, 11);
      floor3.scene.position.x += -11;
      floor3.scene.position.y += -4.3;
      floor3.scene.position.z += 11;
      this.scene_.add(floor3.scene);

      const floor4 = await this.loadModel_('Map/Floor/floor.glb');
      floor4.scene.scale.set(11, 5, 11);
      floor4.scene.position.x += -11;
      floor4.scene.position.y += -4.3;
      floor4.scene.position.z += -11;
      this.scene_.add(floor4.scene);
    } catch (error) {
      console.error('Error loading floor:', error);
    }
    // Load Walls
    try {
      const wall1 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall1.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall1.scene.position.x += 12;
      wall1.scene.position.z += -22;
      this.scene_.add(wall1.scene);
      
      const wall2 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall2.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall2.scene.position.x += -12;
      wall2.scene.position.z += -22;
      this.scene_.add(wall2.scene);
      
      const wall3 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall3.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall3.scene.rotation.y = Math.PI / 2; // Rotate the wall 90 degrees
      wall3.scene.position.x += -22;
      wall3.scene.position.z += 12;
      this.scene_.add(wall3.scene);
      
      const wall4 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall4.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall4.scene.rotation.y = Math.PI / 2;
      wall4.scene.position.x += -22;
      wall4.scene.position.z += -12;
      this.scene_.add(wall4.scene);

      const wall5 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall5.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall5.scene.rotation.y = Math.PI;
      wall5.scene.position.x += 12;
      wall5.scene.position.z += 22;
      this.scene_.add(wall5.scene);
      
      const wall6 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall6.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall6.scene.rotation.y = Math.PI;
      wall6.scene.position.x += -12;
      wall6.scene.position.z += 22;
      this.scene_.add(wall6.scene);
      
      const wall7 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall7.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall7.scene.rotation.y = 3*Math.PI / 2;
      wall7.scene.position.x += 22;
      wall7.scene.position.z += 12;
      this.scene_.add(wall7.scene);
      
      const wall8 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall8.scene.scale.set(6, 5, 8); // Scale the wall up by a factor of 2 in all directions
      wall8.scene.rotation.y = 3*Math.PI / 2;
      wall8.scene.position.x += 22;
      wall8.scene.position.z += -12;
      this.scene_.add(wall8.scene);
} catch (error) {
      console.error('Error loading model:', error);
    }

    // Load Signs
    try {
      const sign1 = await this.loadModel_('Map/Sign/billboard park-test.glb');
      sign1.scene.scale.set(0.7, 0.7, 0.7);
      sign1.scene.rotation.y = 5*Math.PI / 4;
      sign1.scene.position.x += 21;
      sign1.scene.position.y += 7;
      sign1.scene.position.z += 21;
      this.scene_.add(sign1.scene);

      const planeGeometry1 = new THREE.PlaneGeometry(20, 20);
      const planeMaterial1 = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane1 = new THREE.Mesh(planeGeometry1, planeMaterial1)
      plane1.scale.set(0.3, 1, 0.3);
      plane1.position.x += 20.5;
      plane1.position.y += -3;
      plane1.position.z += 20.5;
      plane1.rotation.y = 5*Math.PI / 4;
      plane1.receiveShadow = true;
      this.scene_.add(plane1);
      
      const sign2 = await this.loadModel_('Map/Sign/billboard_park.glb');
      sign2.scene.scale.set(0.7, 0.7, 0.7);
      sign2.scene.rotation.y = 3*Math.PI / 4;
      sign2.scene.position.x += -21;
      sign2.scene.position.y += 7;
      sign2.scene.position.z += 21;
      this.scene_.add(sign2.scene);

      const planeGeometry2 = new THREE.PlaneGeometry(20, 20);
      const planeMaterial2 = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane2 = new THREE.Mesh(planeGeometry2, planeMaterial2)
      plane2.scale.set(0.3, 1, 0.3);
      plane2.position.x += -20.5;
      plane2.position.y += -3;
      plane2.position.z += 20.5;
      plane2.rotation.y = 3*Math.PI / 4;
      plane2.receiveShadow = true;
      this.scene_.add(plane2);
      
      const sign3 = await this.loadModel_('Map/Sign/billboard_park.glb');
      sign3.scene.scale.set(0.7, 0.7, 0.7);
      sign3.scene.rotation.y = Math.PI / 4;
      sign3.scene.position.x += -21;
      sign3.scene.position.y += 7;
      sign3.scene.position.z += -21;
      this.scene_.add(sign3.scene);

      const planeGeometry3 = new THREE.PlaneGeometry(20, 20);
      const planeMaterial3 = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane3 = new THREE.Mesh(planeGeometry3, planeMaterial3)
      plane3.scale.set(0.3, 1, 0.3);
      plane3.position.x += -20.5;
      plane3.position.y += -3;
      plane3.position.z += -20.5;
      plane3.rotation.y = Math.PI / 4;
      plane3.receiveShadow = true;
      this.scene_.add(plane3);

      const sign4 = await this.loadModel_('Map/Sign/billboard_park.glb');
      sign4.scene.scale.set(0.7, 0.7, 0.7);
      sign4.scene.rotation.y = 7*Math.PI / 4;
      sign4.scene.position.x += 21;
      sign4.scene.position.y += 7;
      sign4.scene.position.z += -21;
      this.scene_.add(sign4.scene);

      const planeGeometry4 = new THREE.PlaneGeometry(20, 20);
      const planeMaterial4 = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane4 = new THREE.Mesh(planeGeometry4, planeMaterial4)
      plane4.scale.set(0.3, 1, 0.3);
      plane4.position.x += 20.5;
      plane4.position.y += -3;
      plane4.position.z += -20.5;
      plane4.rotation.y = 7*Math.PI / 4;
      plane4.receiveShadow = true;
      this.scene_.add(plane4);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Load Scaffolding
    try {
      const scaf1 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf1.scene.scale.set(1, 1, 1);
      scaf1.scene.position.x += -24;
      scaf1.scene.position.y += 1;
      scaf1.scene.position.z += 10;
      this.scene_.add(scaf1.scene);

      const scaf2 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf2.scene.scale.set(1, 1, 1);
      scaf2.scene.position.x += -24;
      scaf2.scene.position.y += 1;
      scaf2.scene.position.z += 8;
      this.scene_.add(scaf2.scene);

      const scaf3 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf3.scene.scale.set(1, 1, 1);
      scaf3.scene.rotation.y = Math.PI / 2;
      scaf3.scene.position.x += 10;
      scaf3.scene.position.y += 1;
      scaf3.scene.position.z += 24;
      this.scene_.add(scaf3.scene);

      const scaf4 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf4.scene.scale.set(1, 1, 1);
      scaf4.scene.rotation.y = Math.PI / 2;
      scaf4.scene.position.x += 8;
      scaf4.scene.position.y += 1;
      scaf4.scene.position.z += 24;
      this.scene_.add(scaf4.scene);

      const scaf5 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf5.scene.scale.set(1, 1, 1);
      scaf5.scene.rotation.y = Math.PI;
      scaf5.scene.position.x += 24;
      scaf5.scene.position.y += 1;
      scaf5.scene.position.z += -8;
      this.scene_.add(scaf5.scene);

      const scaf6 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf6.scene.scale.set(1, 1, 1);
      scaf6.scene.rotation.y = Math.PI;
      scaf6.scene.position.x += 24;
      scaf6.scene.position.y += 1;
      scaf6.scene.position.z += -10;
      this.scene_.add(scaf6.scene);

      const scaf7 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf7.scene.scale.set(1, 1, 1);
      scaf7.scene.rotation.y = 3*Math.PI/2;
      scaf7.scene.position.x += -10;
      scaf7.scene.position.y += 1;
      scaf7.scene.position.z += -24;
      this.scene_.add(scaf7.scene);

      const scaf8 = await this.loadModel_('Map/Scaffold/curved_scaffold.glb');
      scaf8.scene.scale.set(1, 1, 1);
      scaf8.scene.rotation.y = 3*Math.PI/2;
      scaf8.scene.position.x += -8;
      scaf8.scene.position.y += 1;
      scaf8.scene.position.z += -24;
      this.scene_.add(scaf8.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Load Speakers
    try {
      const speak1 = await this.loadModel_('Map/Speakers/low_poly_free_speakers_system_array.glb');
      speak1.scene.scale.set(2, 2, 2);
      speak1.scene.rotation.y = Math.PI / 5;
      speak1.scene.position.x += 4;
      speak1.scene.position.y += 10;
      speak1.scene.position.z += -20;
      this.scene_.add(speak1.scene);

      const speak2 = await this.loadModel_('Map/Speakers/low_poly_free_speakers_system_array.glb');
      speak2.scene.scale.set(2, 2, 2);
      speak2.scene.rotation.y = -Math.PI / 5;
      speak2.scene.position.x += -4;
      speak2.scene.position.y += 10;
      speak2.scene.position.z += -20;
      this.scene_.add(speak2.scene);

      const speak3 = await this.loadModel_('Map/Speakers/low_poly_free_speakers_system_array.glb');
      speak3.scene.scale.set(2, 2, 2);
      speak3.scene.rotation.y = 4*Math.PI / 5;
      speak3.scene.position.x += 4;
      speak3.scene.position.y += 10;
      speak3.scene.position.z += 20;
      this.scene_.add(speak3.scene);

      const speak4 = await this.loadModel_('Map/Speakers/low_poly_free_speakers_system_array.glb');
      speak4.scene.scale.set(2, 2, 2);
      speak4.scene.rotation.y = -4*Math.PI / 5;
      speak4.scene.position.x += -4;
      speak4.scene.position.y += 10;
      speak4.scene.position.z += 20;
      this.scene_.add(speak4.scene);

    }  catch (error) {
      console.error('Error loading model:', error);
    }

    // Load TV's
    try {
      const tv1 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv1.scene.scale.set(14, 14, 14);
      tv1.scene.rotation.y = Math.PI / 2;
      const rotationAxis1 = new THREE.Vector3(0, 0, -1).normalize();
      const rotationAngle1 = Math.PI / 5;
      tv1.scene.rotateOnWorldAxis(rotationAxis1, rotationAngle1);
      tv1.scene.position.x += -10;
      tv1.scene.position.y += 25;
      tv1.scene.position.z += 36;
      this.scene_.add(tv1.scene);

      const tv2 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv2.scene.scale.set(14, 14, 14);
      tv2.scene.rotation.y = -Math.PI / 2;
      const rotationAxis2 = new THREE.Vector3(0, 0, -1).normalize();
      const rotationAngle2 = -Math.PI / 5;
      tv2.scene.rotateOnWorldAxis(rotationAxis2, rotationAngle2);
      tv2.scene.position.x += 10;
      tv2.scene.position.y += 25;
      tv2.scene.position.z += -36;
      this.scene_.add(tv2.scene);
    }  catch (error) {
      console.error('Error loading model:', error);
    }

    // Add Software
    try {
      const table = await this.loadModel_('Software/Table/wooden_table_game_ready_asset.glb');
      table.scene.scale.set(3, 3, 3);
      table.scene.rotation.y = -Math.PI / 4;
      table.scene.position.x += 18;
      table.scene.position.y += -0.2;
      table.scene.position.z += 18;
      this.scene_.add(table.scene);

      const comp = await this.loadModel_('Software/Computer/old_computer.glb');
      comp.scene.scale.set(0.6, 0.6, 0.6);
      comp.scene.rotation.y = -3 *Math.PI / 4;
      comp.scene.position.x += 18.3;
      comp.scene.position.y += 2;
      comp.scene.position.z += 18.3;
      this.scene_.add(comp.scene);

      const shelf1 = await this.loadModel_('Software/Shelf/floating_shelf.glb');
      shelf1.scene.scale.set(2, 2, 2);
      shelf1.scene.rotation.y = Math.PI;
      shelf1.scene.position.x += 10;
      shelf1.scene.position.y += 4.8;
      shelf1.scene.position.z += 21;
      this.scene_.add(shelf1.scene);

      const shelf2 = await this.loadModel_('Software/Shelf/floating_shelf.glb');
      shelf2.scene.scale.set(2, 2, 2);
      shelf2.scene.rotation.y = Math.PI / 2;
      shelf2.scene.position.x += 21;
      shelf2.scene.position.y += 4.8;
      shelf2.scene.position.z += 10;
      this.scene_.add(shelf2.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Add Career
    try {
      const panth = await this.loadModel_('Career/Pantheon/wk3a_pillar_huth_will.glb');
      panth.scene.scale.set(0.14, 0.14, 0.14);
      panth.scene.rotation.y = 3*Math.PI / 4;
      panth.scene.position.x += -13;
      panth.scene.position.y += 0;
      panth.scene.position.z += 20;
      this.scene_.add(panth.scene);

      const plantA1 = await this.loadModel_('Career/PlantA/plant.glb');
      plantA1.scene.scale.set(0.0045, 0.0045, 0.0045);
      plantA1.scene.position.x += -16;
      plantA1.scene.position.y += 0.6;
      plantA1.scene.position.z += 20;
      this.scene_.add(plantA1.scene);

      const plantA2 = await this.loadModel_('Career/PlantA/plant.glb');
      plantA2.scene.scale.set(0.0045, 0.0045, 0.0045);
      plantA2.scene.position.x += -20;
      plantA2.scene.position.y += 0.6;
      plantA2.scene.position.z += 16;
      this.scene_.add(plantA2.scene);

      const plantB1 = await this.loadModel_('Career/PlantB/plant__rosa_chinensis.glb');
      plantB1.scene.scale.set(0.4, 0.4, 0.4);
      plantB1.scene.position.x += -20;
      plantB1.scene.position.y += -0.5;
      plantB1.scene.position.z += 10;
      this.scene_.add(plantB1.scene);

      const plantB2 = await this.loadModel_('Career/PlantB/plant__rosa_chinensis.glb');
      plantB2.scene.scale.set(0.4, 0.4, 0.4);
      plantB2.scene.position.x += -10;
      plantB2.scene.position.y += -0.5;
      plantB2.scene.position.z += 20;
      this.scene_.add(plantB2.scene);

      const holog = await this.loadModel_('Career/Hologram/hologram_police_robots.glb');
      plantB2.scene.scale.set(0.3, 0.3, 0.3);
      holog.scene.rotation.y = 3*Math.PI / 4;
      holog.scene.position.x += -18;
      holog.scene.position.y += 0.4;
      holog.scene.position.z += 18;
      this.scene_.add(holog.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Add Music
    try {
      const amp1 = await this.loadModel_('Music/Amp/dusty_passive_stage_speaker.glb');
      amp1.scene.scale.set(6, 6, 6);
      amp1.scene.rotation.y = -4*Math.PI / 5;
      amp1.scene.position.x += 14;
      amp1.scene.position.y += 0.5;
      amp1.scene.position.z += -20;
      this.scene_.add(amp1.scene);

      const amp2 = await this.loadModel_('Music/Amp/dusty_passive_stage_speaker.glb');
      amp2.scene.scale.set(6, 6, 6);
      amp2.scene.rotation.y = -3*Math.PI / 5;
      amp2.scene.position.x += 20;
      amp2.scene.position.y += 0.5;
      amp2.scene.position.z += -14;
      this.scene_.add(amp2.scene);

      const jbox = await this.loadModel_('Music/Jukebox/jukebox.glb');
      jbox.scene.scale.set(2, 2, 2);
      jbox.scene.rotation.y = -Math.PI / 4;
      jbox.scene.position.x += 16;
      jbox.scene.position.y += 0.5;
      jbox.scene.position.z += -16;
      this.scene_.add(jbox.scene);

      const guit = await this.loadModel_('Music/Guitar/fender_stratocaster_guitar.glb');
      guit.scene.scale.set(14, 14, 14);
      guit.scene.rotation.y = -Math.PI / 4;
      const rotationAxis = new THREE.Vector3(-1, 0, 1).normalize();
      const rotationAngle = -Math.PI / 4;
      guit.scene.rotateOnWorldAxis(rotationAxis, rotationAngle);
      guit.scene.position.x += 12;
      guit.scene.position.y += 15;
      guit.scene.position.z += -22;
      this.scene_.add(guit.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  

  async loadModel_(url) {
    const loader = new GLTFLoader();
    console.log(loader);
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  initializeLights_() {
    const distance = 50.0;
    const angle = Math.PI / 5.5;
    const penumbra = 0.5;
    const decay = 1.0;

    // Wall lights

    let light = new THREE.SpotLight(
      0xFFFFFF, 100.0, distance, angle, penumbra, decay);
    light.castShadow = true;
    light.shadow.bias = -0.00001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 100;

    light.position.set(10, 25, 10);
    light.target.position.set(20, 0, 20);
    light.target.updateMatrixWorld();
    this.scene_.add(light);
    this.scene_.add(light.target);

    //const spotLightHelper = new THREE.SpotLightHelper(light);
    //this.scene_.add(spotLightHelper)

    const light2 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light2.castShadow = light.castShadow;
    light2.shadow.bias = light.shadow.bias;
    light2.shadow.mapSize.width = light.shadow.mapSize.width;
    light2.shadow.mapSize.height = light.shadow.mapSize.height;
    light2.shadow.camera.near = light.shadow.camera.near;
    light2.shadow.camera.far = light.shadow.camera.far;

    light2.position.set(-10, 25, 10);
    light2.target.position.set(-20, 0, 20);
    light2.target.updateMatrixWorld();
    this.scene_.add(light2);
    this.scene_.add(light2.target);

    //const spotLightHelper2 = new THREE.SpotLightHelper(light2);
    //this.scene_.add(spotLightHelper2)

    const light3 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light3.castShadow = light.castShadow;
    light3.shadow.bias = light.shadow.bias;
    light3.shadow.mapSize.width = light.shadow.mapSize.width;
    light3.shadow.mapSize.height = light.shadow.mapSize.height;
    light3.shadow.camera.near = light.shadow.camera.near;
    light3.shadow.camera.far = light.shadow.camera.far;
    light3.position.set(-10, 25, -10);
    light3.target.position.set(-20, 0, -20);
    light3.target.updateMatrixWorld();
    this.scene_.add(light3);
    this.scene_.add(light3.target); //

    //const spotLightHelper3 = new THREE.SpotLightHelper(light3);
    //this.scene_.add(spotLightHelper3)

    const light4 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light4.castShadow = light.castShadow;
    light4.shadow.bias = light.shadow.bias;
    light4.shadow.mapSize.width = light.shadow.mapSize.width;
    light4.shadow.mapSize.height = light.shadow.mapSize.height;
    light4.shadow.camera.near = light.shadow.camera.near;
    light4.shadow.camera.far = light.shadow.camera.far;
    light4.position.set(10, 25, -10);
    light4.target.position.set(20, 0, -20);
    light4.target.updateMatrixWorld();
    this.scene_.add(light4);
    this.scene_.add(light4.target);

    //const spotLightHelper4 = new THREE.SpotLightHelper(light4);
    //this.scene_.add(spotLightHelper4)

    // Center liights

    const light5 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light5.castShadow = light.castShadow;
    light5.shadow.bias = light.shadow.bias;
    light5.shadow.mapSize.width = light.shadow.mapSize.width;
    light5.shadow.mapSize.height = light.shadow.mapSize.height;
    light5.shadow.camera.near = light.shadow.camera.near;
    light5.shadow.camera.far = light.shadow.camera.far;
    light5.position.set(10, 25, 10);
    light5.target.position.set(0, 0, 0);
    light5.target.updateMatrixWorld();
    this.scene_.add(light5);
    this.scene_.add(light5.target);

    //const spotLightHelper5 = new THREE.SpotLightHelper(light5);
    //this.scene_.add(spotLightHelper5)

    const light6 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light6.castShadow = light.castShadow;
    light6.shadow.bias = light.shadow.bias;
    light6.shadow.mapSize.width = light.shadow.mapSize.width;
    light6.shadow.mapSize.height = light.shadow.mapSize.height;
    light6.shadow.camera.near = light.shadow.camera.near;
    light6.shadow.camera.far = light.shadow.camera.far;
    light6.position.set(-10, 25, 10);
    light6.target.position.set(0, 0, 0);
    light6.target.updateMatrixWorld();
    this.scene_.add(light6);
    this.scene_.add(light6.target);

    //const spotLightHelper6 = new THREE.SpotLightHelper(light6);
    //this.scene_.add(spotLightHelper6)

    const light7 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light7.castShadow = light.castShadow;
    light7.shadow.bias = light.shadow.bias;
    light7.shadow.mapSize.width = light.shadow.mapSize.width;
    light7.shadow.mapSize.height = light.shadow.mapSize.height;
    light7.shadow.camera.near = light.shadow.camera.near;
    light7.shadow.camera.far = light.shadow.camera.far;
    light7.position.set(-10, 25, -10);
    light7.target.position.set(0, 0, 0);
    light7.target.updateMatrixWorld();
    this.scene_.add(light7);
    this.scene_.add(light7.target);

    //const spotLightHelper7 = new THREE.SpotLightHelper(light7);
    //this.scene_.add(spotLightHelper7)

    const light8 = new THREE.SpotLight(
      light.color, light.intensity, light.distance, light.angle, light.penumbra, light.decay);
    light8.castShadow = light.castShadow;
    light8.shadow.bias = light.shadow.bias;
    light8.shadow.mapSize.width = light.shadow.mapSize.width;
    light8.shadow.mapSize.height = light.shadow.mapSize.height;
    light8.shadow.camera.near = light.shadow.camera.near;
    light8.shadow.camera.far = light.shadow.camera.far;
    light8.position.set(10, 25, -10);
    light8.target.position.set(0, 0, 0);
    light8.target.updateMatrixWorld();
    this.scene_.add(light8);
    this.scene_.add(light8.target);

    //const spotLightHelper8 = new THREE.SpotLightHelper(light8);
    //this.scene_.add(spotLightHelper8)
      
    // Background light
    
    const upColour = 0xFFFF80;
    const downColour = 0x808080;
    light = new THREE.HemisphereLight(upColour, downColour, 0.5);
    light.color.setHSL( 0.6, 1, 0.6 );
    light.groundColor.setHSL( 0.095, 1, 0.75 );
    light.position.set(0, 4, 0);
    this.scene_.add(light);
   
  }

  loadMaterial_(name, tiling) {
    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();

    const metalMap = mapLoader.load('resources/freepbr/' + name + 'metallic.png');
    metalMap.anisotropy = maxAnisotropy;
    metalMap.wrapS = THREE.RepeatWrapping;
    metalMap.wrapT = THREE.RepeatWrapping;
    metalMap.repeat.set(tiling, tiling);

    const albedo = mapLoader.load('resources/freepbr/' + name + 'albedo.png');
    albedo.anisotropy = maxAnisotropy;
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;
    albedo.repeat.set(tiling, tiling);
    albedo.encoding = THREE.sRGBEncoding;

    const normalMap = mapLoader.load('resources/freepbr/' + name + 'normal.png');
    normalMap.anisotropy = maxAnisotropy;
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(tiling, tiling);

    const roughnessMap = mapLoader.load('resources/freepbr/' + name + 'roughness.png');
    roughnessMap.anisotropy = maxAnisotropy;
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(tiling, tiling);

    const material = new THREE.MeshStandardMaterial({
      metalnessMap: metalMap,
      map: albedo,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
    });

    return material;
  }

  initializePostFX_() {
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.uiCamera_.left = -this.camera_.aspect;
    this.uiCamera_.right = this.camera_.aspect;
    this.uiCamera_.updateProjectionMatrix();

    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  raf_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.step_(t - this.previousRAF_);
      this.threejs_.autoClear = true;
      this.threejs_.render(this.scene_, this.camera_);
      this.threejs_.autoClear = false;
      this.threejs_.render(this.uiScene_, this.uiCamera_);
      this.previousRAF_ = t;
      this.raf_();
    });
  }

  step_(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;

    // this.controls_.update(timeElapsedS);
    this.fpsCamera_.update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new FirstPersonCameraDemo();
});
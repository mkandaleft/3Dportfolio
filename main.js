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
    const roomDimensions = { minX: -18, maxX: 18, minY: 0, maxY: 4, minZ: -18, maxZ: 18 };
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

      /*
      './resources/skybox/posx.jpg', // replace with your own skybox (terrain) images ********
      './resources/skybox/negx.jpg',
      './resources/skybox/posy.jpg',
      './resources/skybox/negy.jpg',
      './resources/skybox/posz.jpg',
      './resources/skybox/negz.jpg',
      */
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
      const model = await this.loadModel_('Floor/floor.glb');
      model.scene.scale.set(11, 5, 11); // Scale the model up by a factor of 2 in all directions
      model.scene.position.x += 11;
      model.scene.position.y += -4.3;
      model.scene.position.z += -11;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Floor/floor.glb');
      model.scene.scale.set(11, 5, 11); // Scale the model up by a factor of 2 in all directions
      model.scene.position.x += 11;
      model.scene.position.y += -4.3;
      model.scene.position.z += 11;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Floor/floor.glb');
      model.scene.scale.set(11, 5, 11); // Scale the model up by a factor of 2 in all directions
      model.scene.position.x += -11;
      model.scene.position.y += -4.3;
      model.scene.position.z += 11;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Floor/floor.glb');
      model.scene.scale.set(11, 5, 11); // Scale the model up by a factor of 2 in all directions
      model.scene.position.x += -11;
      model.scene.position.y += -4.3;
      model.scene.position.z += -11;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Load Walls
    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.position.x += 12;
      model.scene.position.z += -22;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.position.x += -12;
      model.scene.position.z += -22;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.rotation.y = Math.PI / 2; // Rotate the model 90 degrees
      model.scene.position.x += -22;
      model.scene.position.z += 12;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.rotation.y = Math.PI / 2;
      model.scene.position.x += -22;
      model.scene.position.z += -12;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.rotation.y = Math.PI;
      model.scene.position.x += 12;
      model.scene.position.z += 22;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.rotation.y = Math.PI;
      model.scene.position.x += -12;
      model.scene.position.z += 22;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    
    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.rotation.y = 3*Math.PI / 2;
      model.scene.position.x += 22;
      model.scene.position.z += 12;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Wall/source/Wall (bake light).gltf');
      model.scene.scale.set(6, 5, 8); // Scale the model up by a factor of 2 in all directions
      model.scene.rotation.y = 3*Math.PI / 2;
      model.scene.position.x += 22;
      model.scene.position.z += -12;
      this.scene_.add(model.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Load Signs
    try {
      const model = await this.loadModel_('Sign/billboard_park.glb');
      model.scene.scale.set(0.7, 0.7, 0.7);
      model.scene.rotation.y = 5*Math.PI / 4;
      model.scene.position.x += 21;
      model.scene.position.y += 7;
      model.scene.position.z += 21;
      this.scene_.add(model.scene);

      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.scale.set(0.3, 1, 0.3);
      plane.position.x += 20.5;
      plane.position.y += -3;
      plane.position.z += 20.5;
      plane.rotation.y = 5*Math.PI / 4;
      plane.receiveShadow = true;
      this.scene_.add(plane);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Sign/billboard_park.glb');
      model.scene.scale.set(0.7, 0.7, 0.7);
      model.scene.rotation.y = 3*Math.PI / 4;
      model.scene.position.x += -21;
      model.scene.position.y += 7;
      model.scene.position.z += 21;
      this.scene_.add(model.scene);

      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.scale.set(0.3, 1, 0.3);
      plane.position.x += -20.5;
      plane.position.y += -3;
      plane.position.z += 20.5;
      plane.rotation.y = 3*Math.PI / 4;
      plane.receiveShadow = true;
      this.scene_.add(plane);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Sign/billboard_park.glb');
      model.scene.scale.set(0.7, 0.7, 0.7);
      model.scene.rotation.y = Math.PI / 4;
      model.scene.position.x += -21;
      model.scene.position.y += 7;
      model.scene.position.z += -21;
      this.scene_.add(model.scene);

      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.scale.set(0.3, 1, 0.3);
      plane.position.x += -20.5;
      plane.position.y += -3;
      plane.position.z += -20.5;
      plane.rotation.y = Math.PI / 4;
      plane.receiveShadow = true;
      this.scene_.add(plane);
    } catch (error) {
      console.error('Error loading model:', error);
    }
    try {
      const model = await this.loadModel_('Sign/billboard_park.glb');
      model.scene.scale.set(0.7, 0.7, 0.7);
      model.scene.rotation.y = 7*Math.PI / 4;
      model.scene.position.x += 21;
      model.scene.position.y += 7;
      model.scene.position.z += -21;
      this.scene_.add(model.scene);

      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.scale.set(0.3, 1, 0.3);
      plane.position.x += 20.5;
      plane.position.y += -3;
      plane.position.z += -20.5;
      plane.rotation.y = 7*Math.PI / 4;
      plane.receiveShadow = true;
      this.scene_.add(plane);
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
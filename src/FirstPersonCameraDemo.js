
import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.136/examples/jsm/loaders/GLTFLoader.js';
import FirstPersonCamera from './FirstPersonCamera';

/**
 * Represents a demo of a first-person camera in a 3D environment.
 * @class
 */
class FirstPersonCameraDemo {

  /**
   * Represents a FirstPersonCameraDemo object.
   * @constructor
   */
  constructor() {
    this.interactable = [];
  }

  /**
   * Initializes the camera demo.
   * @returns {Promise} A promise that resolves when the initialization is complete.
   */
  initialize_() {
    return new Promise(resolve => {
      this.initializeRenderer_();
      this.initializeLights_();
      this.initializeScene_();
      this.initializeDemo_();

      this.previousRAF_ = null;

      // Delay the start of rendering by 8 seconds
      setTimeout(() => {  
        this.raf_();
        this.onWindowResize_();
        resolve();
      }, 8000);

      document.addEventListener('checkTVDisplay', (event) => this.checkTVDisplay(event.detail.contentName));
      document.addEventListener('checkTVRemoveDisplay', (event) => this.checkTVRemoveDisplay(event.detail.contentName));

      document.addEventListener('addControlDisplay', (event) => this.addControlDisplay(event.detail.position, event.detail.rotation));
      document.addEventListener('removeControlDisplay', (event) => this.removeControlDisplay());
    });
    
  }

  /**
   * Initializes the demo by creating a new FirstPersonCamera instance and setting interactable objects.
   */
  initializeDemo_() {    
    console.log("initializeDemo_");
    this.fpsCamera_ = new FirstPersonCamera(this.camera_, this.objects_);
    this.fpsCamera_.setInteractableObjects(this.interactable);
  }

  /**
   * Initializes the renderer, camera, and scene for the first person camera demo.
   */
  initializeRenderer_() {
    console.log("initializeRenderer_");
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

  /**
   * Initializes the scene
   * This method adds the 3D models to the scene.
   */
  async initializeScene_() {
    console.log("initializeScene_");

    // loads space background
    const spaceTexture = new THREE.TextureLoader().load('Pictures/galaxy.jpg');
    spaceTexture.encoding = THREE.sRGBEncoding;
    const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      map: spaceTexture,
      side: THREE.BackSide
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene_.add(sphere);

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
      wall1.scene.scale.set(6, 5, 8);
      wall1.scene.position.x += 12;
      wall1.scene.position.z += -22;
      this.scene_.add(wall1.scene);
      
      const wall2 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall2.scene.scale.set(6, 5, 8);
      wall2.scene.position.x += -12;
      wall2.scene.position.z += -22;
      this.scene_.add(wall2.scene);
      
      const wall3 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall3.scene.scale.set(6, 5, 8);
      wall3.scene.rotation.y = Math.PI / 2;
      wall3.scene.position.x += -22;
      wall3.scene.position.z += 12;
      this.scene_.add(wall3.scene);
      
      const wall4 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall4.scene.scale.set(6, 5, 8);
      wall4.scene.rotation.y = Math.PI / 2;
      wall4.scene.position.x += -22;
      wall4.scene.position.z += -12;
      this.scene_.add(wall4.scene);

      const wall5 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall5.scene.scale.set(6, 5, 8);
      wall5.scene.rotation.y = Math.PI;
      wall5.scene.position.x += 12;
      wall5.scene.position.z += 22;
      this.scene_.add(wall5.scene);
      
      const wall6 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall6.scene.scale.set(6, 5, 8);
      wall6.scene.rotation.y = Math.PI;
      wall6.scene.position.x += -12;
      wall6.scene.position.z += 22;
      this.scene_.add(wall6.scene);
      
      const wall7 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall7.scene.scale.set(6, 5, 8);
      wall7.scene.rotation.y = 3*Math.PI / 2;
      wall7.scene.position.x += 22;
      wall7.scene.position.z += 12;
      this.scene_.add(wall7.scene);
      
      const wall8 = await this.loadModel_('Map/Wall/source/Wall (bake light).gltf');
      wall8.scene.scale.set(6, 5, 8);
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
      table.scene.position.x += 16.5;
      table.scene.position.y += -0.2;
      table.scene.position.z += 16.5;
      this.scene_.add(table.scene);

      const comp = await this.loadModel_('Software/Computer/old_computer.glb');
      comp.scene.name = "computer";
      comp.scene.scale.set(0.6, 0.6, 0.6);
      comp.scene.rotation.y = -3 *Math.PI / 4;
      comp.scene.position.x += 16.8;
      comp.scene.position.y += 2;
      comp.scene.position.z += 16.8;
      this.scene_.add(comp.scene);
      this.interactable.push(comp.scene);

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

      const scroll = await this.loadModel_('Career/Scroll/scroll.glb');
      scroll.scene.scale.set(0.8, 0.8, 0.8);
      scroll.scene.name = "scroll";

      const quaternionY = new THREE.Quaternion();
      quaternionY.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), 9*Math.PI / 16);
      scroll.scene.applyQuaternion(quaternionY);

      const quaternionX = new THREE.Quaternion();
      quaternionX.setFromAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), Math.PI / 2);
      scroll.scene.applyQuaternion(quaternionX);

      const quaternionY2 = new THREE.Quaternion();
      quaternionY2.setFromAxisAngle(new THREE.Vector3(0, 1, 0).normalize(), Math.PI);
      scroll.scene.applyQuaternion(quaternionY2);

      const quaternionX2 = new THREE.Quaternion();
      quaternionX2.setFromAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), Math.PI / 64);
      scroll.scene.applyQuaternion(quaternionX2);

      scroll.scene.position.x += -8.5;
      scroll.scene.position.y += 2.5;
      scroll.scene.position.z += 18.6;

      this.scene_.add(scroll.scene);
      this.interactable.push(scroll.scene);
    } catch (error) {
      console.error('Error loading model:', error);
    }

    // Add Projects
    try {
      const tv1 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv1.scene.name = "tv1";
      tv1.scene.scale.set(4, 4, 4);
      tv1.scene.rotation.y = 0 / 2;
      const rotationAxis1 = new THREE.Vector3(1, 0, 0).normalize();
      const rotationAngle1 = Math.PI / 5;
      tv1.scene.rotateOnWorldAxis(rotationAxis1, rotationAngle1);
      tv1.scene.position.x += -25;
      tv1.scene.position.y += 6.5;
      tv1.scene.position.z += -19;
      this.scene_.add(tv1.scene);
      this.interactable.push(tv1.scene);

      const tv2 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv2.scene.name = "tv2";
      tv2.scene.scale.set(4, 4, 4);
      tv2.scene.rotation.y = 0 / 2;
      tv2.scene.rotateOnWorldAxis(rotationAxis1, rotationAngle1);
      tv2.scene.position.x += -25;
      tv2.scene.position.y += 10;
      tv2.scene.position.z += -19;
      this.scene_.add(tv2.scene);
      this.interactable.push(tv2.scene);

      const tv3 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv3.scene.name = "tv3";
      tv3.scene.scale.set(4, 4, 4);
      tv3.scene.rotation.y = 0 / 2;
      tv3.scene.rotateOnWorldAxis(rotationAxis1, rotationAngle1);
      tv3.scene.position.x += -20;
      tv3.scene.position.y += 6.5;
      tv3.scene.position.z += -19;
      this.scene_.add(tv3.scene);
      // this.interactable.push(tv3.scene);

      const tv4 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv4.scene.name = "tv4";
      tv4.scene.scale.set(4, 4, 4);
      tv4.scene.rotation.y = 0 / 2;
      tv4.scene.rotateOnWorldAxis(rotationAxis1, rotationAngle1);
      tv4.scene.position.x += -20;
      tv4.scene.position.y += 10;
      tv4.scene.position.z += -19;
      this.scene_.add(tv4.scene);
      // this.interactable.push(tv4.scene);

      const tv5 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv5.scene.name = "tv5";
      tv5.scene.scale.set(4, 4, 4);
      tv5.scene.rotation.y = Math.PI / 2;
      const rotationAxis2 = new THREE.Vector3(0, 0, 1).normalize();
      const rotationAngle2 = -Math.PI / 5;
      tv5.scene.rotateOnWorldAxis(rotationAxis2, rotationAngle2);
      tv5.scene.position.x += -19;
      tv5.scene.position.y += 6.5;
      tv5.scene.position.z += -4.5;
      this.scene_.add(tv5.scene);
      // this.interactable.push(tv5.scene);

      const tv6 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv6.scene.name = "tv6";
      tv6.scene.scale.set(4, 4, 4);
      tv6.scene.rotation.y = Math.PI / 2;
      tv6.scene.rotateOnWorldAxis(rotationAxis2, rotationAngle2);
      tv6.scene.position.x += -19;
      tv6.scene.position.y += 10;
      tv6.scene.position.z += -4.5;
      this.scene_.add(tv6.scene);
      // this.interactable.push(tv6.scene);

      const tv7 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv7.scene.name = "tv7";
      tv7.scene.scale.set(4, 4, 4);
      tv7.scene.rotation.y = Math.PI / 2;
      tv7.scene.rotateOnWorldAxis(rotationAxis2, rotationAngle2);
      tv7.scene.position.x += -19;
      tv7.scene.position.y += 6.5;
      tv7.scene.position.z += 0.5;
      this.scene_.add(tv7.scene);
      // this.interactable.push(tv7.scene);

      const tv8 = await this.loadModel_('Map/TV/1b7eff20a86b4cc692bc4222ac1ac252.glb');
      tv8.scene.name = "tv8";
      tv8.scene.scale.set(4, 4, 4);
      tv8.scene.rotation.y = Math.PI / 2;
      tv8.scene.rotateOnWorldAxis(rotationAxis2, rotationAngle2);
      tv8.scene.position.x += -19;
      tv8.scene.position.y += 10;
      tv8.scene.position.z += 0.5;
      this.scene_.add(tv8.scene);
      // this.interactable.push(tv8.scene);
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
      jbox.scene.name = "jbox";
      jbox.scene.scale.set(2, 2, 2);
      jbox.scene.rotation.y = -Math.PI / 4;
      jbox.scene.position.x += 16;
      jbox.scene.position.y += 0.5;
      jbox.scene.position.z += -16;
      this.scene_.add(jbox.scene);
      this.interactable.push(jbox.scene);

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

  /**
   * Loads a model from the specified path using GLTFLoader.
   * @param {string} path - The path to the model file.
   * @returns {Promise} A promise that resolves with the loaded model.
   */
  async loadModel_(path) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(path, resolve, undefined, reject);
    });
  }

  /**
   * Initializes the lights in the scene.
   */
  initializeLights_() {
    console.log("initializeLights_");
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

    // Center lights
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

  checkTVDisplay(contentName) {
    switch (contentName) {
      case "computer":
        let computerDisplay = this.scene_.getObjectByName("computerDisplay");
        if (!computerDisplay) {
          // Load TV Display texture
          const computerTVDisplay = new THREE.TextureLoader().load('/Map/TVDisplay/softwareDisplay.png');
          computerTVDisplay.encoding = THREE.sRGBEncoding;
          
          // Create TV Display geometry and material
          const computerGeometry = new THREE.PlaneGeometry(2, 2);
          const computerMaterial = new THREE.MeshBasicMaterial({ map: computerTVDisplay });
          computerDisplay = new THREE.Mesh(computerGeometry, computerMaterial);
  
          // Set initial properties of the TV Display
          computerDisplay.rotation.y = 5*Math.PI / 4;
          computerDisplay.position.set(15.5, 2.2, 15.5);
          computerDisplay.name = "computerDisplay";
          this.scene_.add(computerDisplay);
  
          // Set initial and target scales for the animation
          const initialScale = new THREE.Vector3(1, 0.001, 1); // Start with a very thin line
          const targetScale = new THREE.Vector3(1.1, 1.2, 1.1); // The final desired scale
          const duration = 500; // Duration of the animation in milliseconds
          
          // Start the animation
          this.animateTVDisplay(computerDisplay, initialScale, targetScale, duration);
        }
        break;
      
      case "jbox":        
      let jboxDisplay = this.scene_.getObjectByName("jboxDisplay");
      if (!jboxDisplay) {
        // Load TV Display texture
        const jboxTVDisplay = new THREE.TextureLoader().load('/Map/TVDisplay/musicDisplay.png');
        jboxTVDisplay.encoding = THREE.sRGBEncoding;
        
        // Create TV Display geometry and material
        const jboxGeometry = new THREE.PlaneGeometry(2, 2);
        const jboxMaterial = new THREE.MeshBasicMaterial({ map: jboxTVDisplay });
        jboxDisplay = new THREE.Mesh(jboxGeometry, jboxMaterial);

        // Set initial properties of the TV Display
        jboxDisplay.rotation.y = 7*Math.PI / 4;
        jboxDisplay.position.set(15.4, 2.2, -15.4);
        jboxDisplay.name = "jboxDisplay";
        this.scene_.add(jboxDisplay);

        // Set initial and target scales for the animation
        const initialScale = new THREE.Vector3(1, 0.001, 1); // Start with a very thin line
        const targetScale = new THREE.Vector3(1.1, 1.2, 1.1); // The final desired scale
        const duration = 500; // Duration of the animation in milliseconds
        
        // Start the animation
        this.animateTVDisplay(jboxDisplay, initialScale, targetScale, duration);
      }
        break;

      case "scroll":
        let scrollDisplay = this.scene_.getObjectByName("scrollDisplay");
        if (!scrollDisplay) {
          // Load TV Display texture
          const scrollTVDisplay = new THREE.TextureLoader().load('/Map/TVDisplay/careerDisplay.png');
          scrollTVDisplay.encoding = THREE.sRGBEncoding;
          
          // Create TV Display geometry and material
          const scrollGeometry = new THREE.PlaneGeometry(2, 2);
          const scrollMaterial = new THREE.MeshBasicMaterial({ map: scrollTVDisplay });
          scrollDisplay = new THREE.Mesh(scrollGeometry, scrollMaterial);
  
          // Set initial properties of the TV Display
          scrollDisplay.rotation.y = 3*Math.PI / 4;
          scrollDisplay.position.set(-15.4, 2.2, 15.4);
          scrollDisplay.name = "scrollDisplay";
          this.scene_.add(scrollDisplay);
  
          // Set initial and target scales for the animation
          const initialScale = new THREE.Vector3(1, 0.001, 1); // Start with a very thin line
          const targetScale = new THREE.Vector3(1.1, 1.2, 1.1); // The final desired scale
          const duration = 500; // Duration of the animation in milliseconds
          
          // Start the animation
          this.animateTVDisplay(scrollDisplay, initialScale, targetScale, duration);
        }
        break;

      case "tv1":
        let tv1Display = this.scene_.getObjectByName("tv1Display");
        if (!tv1Display) {
          // Load TV Display texture
          const condoMAXiumTVDisplay = new THREE.TextureLoader().load('/Map/TVDisplay/condomaxTv.png');
          condoMAXiumTVDisplay.encoding = THREE.sRGBEncoding;
          
          // Create TV Display geometry and material
          const tv1Geometry = new THREE.PlaneGeometry(4, 2);
          const tv1Material = new THREE.MeshBasicMaterial({ map: condoMAXiumTVDisplay });
          tv1Display = new THREE.Mesh(tv1Geometry, tv1Material);
  
          // Set initial properties of the TV Display
          tv1Display.rotation.y = 0 / 2;
          tv1Display.rotation.x = Math.PI / 5;
          tv1Display.position.set(-14.8, 4.35, -20.55);
          tv1Display.name = "tv1Display";
          this.scene_.add(tv1Display);
  
          // Set initial and target scales for the animation
          const initialScale = new THREE.Vector3(1, 0.001, 1); // Start with a very thin line
          const targetScale = new THREE.Vector3(1.1, 1.2, 1.1); // The final desired scale
          const duration = 500; // Duration of the animation in milliseconds
          
          // Start the animation
          this.animateTVDisplay(tv1Display, initialScale, targetScale, duration);
        }
        break;
  
      case "tv2":
        let tv2Display = this.scene_.getObjectByName("tv2Display");
        if (!tv2Display) {
          // Load TV Display texture
          const time2ChillTVDisplay = new THREE.TextureLoader().load('/Map/TVDisplay/time2chillTv.png');
          time2ChillTVDisplay.encoding = THREE.sRGBEncoding;
          
          // Create TV Display geometry and material
          const tv2Geometry = new THREE.PlaneGeometry(4, 2);
          const tv2Material = new THREE.MeshBasicMaterial({ map: time2ChillTVDisplay });
          tv2Display = new THREE.Mesh(tv2Geometry, tv2Material);
  
          // Set initial properties of the TV Display
          tv2Display.rotation.y = 0 / 2;
          tv2Display.rotation.x = Math.PI / 5;
          tv2Display.position.set(-14.8, 7.8, -20.55);
          tv2Display.name = "tv2Display";
          this.scene_.add(tv2Display);
  
          // Set initial and target scales for the animation
          const initialScale = new THREE.Vector3(1, 0.001, 1); // Start with a very thin line
          const targetScale = new THREE.Vector3(1.1, 1.2, 1.1); // The final desired scale
          const duration = 500; // Duration of the animation in milliseconds
          
          // Start the animation
          this.animateTVDisplay(tv2Display, initialScale, targetScale, duration);
        }
        break;
    
      default:
        break;
    }
  }
  
  animateTVDisplay(mesh, initialScale, targetScale, duration) {
    const start = performance.now();
  
    const animate = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1); // Clamp progress between 0 and 1
      
      // No need to clone initialScale as we're not changing it
      mesh.scale.lerpVectors(initialScale, targetScale, progress);
  
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
  
    requestAnimationFrame(animate);
  }

  // if (this.scene_.getObjectById(tv1Display.id) == undefined) {
  //   // TV Display
  //   const condoMAXiumTVDisplay = new THREE.TextureLoader().load('/Map/TVDisplay/condomaxTv.png');
  //   condoMAXiumTVDisplay.encoding = THREE.sRGBEncoding;
  //   const tv1Geometry = new THREE.PlaneGeometry(4, 2);
  //   const tv1Material = new THREE.MeshBasicMaterial({ map: condoMAXiumTVDisplay });
  //   const tv1Display = new THREE.Mesh(tv1Geometry, tv1Material);


  //   tv1Display.rotation.y = 0 / 2;
  //   tv1Display.rotation.x = Math.PI / 5;
  //   // const rotationAxis1 = new THREE.Vector3(1, 0, 0).normalize();
  //   // const rotationAngle1 = Math.PI / 2;
  //   // tv1Display.rotateOnWorldAxis(rotationAxis1, rotationAngle1);
  //   tv1Display.scale.set(1.1, 1.2, 1.1);
  //   tv1Display.position.set(-14.8, 4.35, -20.55);
  //   this.scene_.add(tv1Display);
  //   break;
  // }

  checkTVRemoveDisplay(contentName) {
    
    switch (contentName) {
      case "computer":        
      const computerDisplay = this.scene_.getObjectByName("computerDisplay");
      if (computerDisplay) {
        this.scene_.remove(computerDisplay);
      }
        break;
    
      case "jbox":
        const jboxDisplay = this.scene_.getObjectByName("jboxDisplay");
        if (jboxDisplay) {
          this.scene_.remove(jboxDisplay);
        }
        break;

      case "scroll":
        const scrollDisplay = this.scene_.getObjectByName("scrollDisplay");
        if (scrollDisplay) {
          this.scene_.remove(scrollDisplay);
        }
        break;

      case "tv1":
        const tv1Display = this.scene_.getObjectByName("tv1Display");
        if (tv1Display) {
          this.scene_.remove(tv1Display);
        }
        break;

      case "tv2":
        const tv2Display = this.scene_.getObjectByName("tv2Display");
        if (tv2Display) {
          this.scene_.remove(tv2Display);
        }
        break;

      default:
        break;
    }
  }

  addControlDisplay(position, rotation) {
    let controlsDisplay = this.scene_.getObjectByName("controlsDisplay");
    if (!controlsDisplay) {
      // // Load TV Display texture
      // const controlsTVDisplay = new THREE.TextureLoader().load('/Pictures/controls.png');
      // controlsTVDisplay.encoding = THREE.sRGBEncoding;

      // // Create TV Display geometry and material
      // const controlsGeometry = new THREE.PlaneGeometry(2, 2);
      // const controlsMaterial = new THREE.MeshBasicMaterial({ map: controlsTVDisplay });
      // controlsDisplay = new THREE.Mesh(controlsGeometry, controlsMaterial);

      // // Set initial properties of the TV and add to scene
      // controlsDisplay.name = "controlsDisplay";
      // this.scene_.add(controlsDisplay);

      // // Set initial and target scales for the animation
      // const initialScale = new THREE.Vector3(1, 0.001, 1); // Start with a very thin line
      // const targetScale = new THREE.Vector3(1.1, 1.2, 1.1); // The final desired scale
      // const duration = 500; // Duration of the animation in milliseconds

      // // Start the animation
      // this.animateTVDisplay(controlsDisplay, initialScale, targetScale, duration);



      // Create a prism geometry with custom wall colors
      const prismGeometry = new THREE.BoxGeometry(2, 2, 2);
      const prismMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green
        new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue
        new THREE.MeshBasicMaterial({ color: 0xffff00 })  // Yellow
      ];
      const controlsDisplay = new THREE.Mesh(prismGeometry, prismMaterials);

      controlsDisplay.scale.set(4, 4, 4);
      // Set initial properties of the controlsDisplay and add it to the scene
      controlsDisplay.name = "controlsDisplay";
      this.scene_.add(controlsDisplay);

    }
    if (controlsDisplay) {
      controlsDisplay.position[0] = position.x + 6;
      controlsDisplay.position[1]  = position.y;
      controlsDisplay.position[2]  = position.z;
      controlsDisplay.position.copy(position);
      controlsDisplay.rotation.copy(rotation);
      console.log("position", controlsDisplay.position);
    }


    // Update the position and rotation of the controlsDisplay based on the camera



    // const distanceFromCamera = 3;
    



    // // Distance the controls menu should appear in front of the camera
    // const distanceInFrontOfCamera = 5;

    // // // Calculate the position in front of the camera
    // // const cameraDirection = new THREE.Vector3();  // Create a new vector to store direction
    // // camera.getWorldDirection(cameraDirection);    // Get the camera's current forward direction
    // // cameraDirection.multiplyScalar(-distanceInFrontOfCamera); // Move along the direction away from camera
    // // cameraDirection.add(camera.position);         // Apply the calculated offset to the camera's current position
    // console.log("position", controlsDisplay.position);
    // // Set the controls display position
    // controlsDisplay.position.copy(position).multiplyScalar(-distanceInFrontOfCamera);
    // controlsDisplay.position.y = 2;

    // // Make the controls display face towards the camera
    // // Since the camera's forward direction is the negative Z-axis, we take the opposite of the camera's quaternion
    // controlsDisplay.quaternion.copy(rotation);
    // controlsDisplay.rotateY(Math.PI); // Rotate the display to face the camera

  }

  removeControlDisplay() {

    const controlsDisplay = this.scene_.getObjectByName("controlsDisplay");
    if (controlsDisplay) {
      this.scene_.remove(controlsDisplay);
    }

  }

  /**
   * Handles the window resize event.
   * Updates the camera and UI camera aspect ratios and projection matrices,
   * and sets the new size for the threejs renderer.
   */
  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.uiCamera_.left = -this.camera_.aspect;
    this.uiCamera_.right = this.camera_.aspect;
    this.uiCamera_.updateProjectionMatrix();

    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Requests the next animation frame and performs necessary rendering steps.
   */
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

  /**
   * Performs a step in the animation loop.
   * @param {number} timeElapsed - The time elapsed since the last step in milliseconds.
   */
  step_(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    this.fpsCamera_.update(timeElapsedS);
  }
}

export default FirstPersonCameraDemo;
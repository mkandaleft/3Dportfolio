import '../style.css'
import FirstPersonCameraDemo from './FirstPersonCameraDemo.js'




// Create a global variable to hold the 3D application
let _APP = null;

// Listen for a click on the start button to display the loading screen
document.getElementById('start-button').addEventListener('click', function(event) {

  document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
  document.body.requestPointerLock();
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('loading').style.display = 'flex';

  // Initialize the 3D application
  _APP = new FirstPersonCameraDemo();
  _APP.initialize_();


  // // Function to hide the loading screen and show the app
  // function showApp() {
  //   document.getElementById('app').style.display = 'block';
  //   document.getElementById('loading').style.display = 'none';

  //   // Check if the pointer is locked on screen
    // if (document.pointerLockElement !== document.body && document.mozPointerLockElement !== document.body) {
    //   _APP.fpsCamera_.pointerLockChange();
    //   console.log("Pointer is not locked");
    // }
  // }

  // // Wait for the 3D scene to be ready
  // document.addEventListener('modelsLoaded', function() {
  //   // Use requestAnimationFrame to ensure that the app is visible immediately
  //   requestAnimationFrame(showApp);
  // });



  // document.addEventListener('modelsLoaded', function() {
  //   document.getElementById('loading').style.display = 'none';
  //   document.getElementById('app').style.display = 'block';


  // });
});

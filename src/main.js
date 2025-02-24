import '../style.css'
import FirstPersonCameraDemo from './FirstPersonCameraDemo.js'

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Create a global variable to hold the 3D application
let _APP = null;

// Listen for a click on the start button to display the loading screen
document.getElementById('start-button').addEventListener('click', function(event) {

  if (isMobileDevice()) {
    // If on a mobile device, display a message
    alert('This application is not available on mobile devices. Please use a desktop browser.');
    return;
  }

  document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
  document.body.requestPointerLock();
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('loading').style.display = 'flex';

  // Initialize the 3D application
  _APP = new FirstPersonCameraDemo();
  _APP.initialize_();
});

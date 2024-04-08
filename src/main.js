import '../style.css'
import FirstPersonCameraDemo from './FirstPersonCameraDemo.js'

// Create a global variable to hold the 3D application
let _APP = null;

// Listen for a click on the start button to display the loading screen
document.getElementById('start-button').addEventListener('click', function(event) {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('loading').style.display = 'flex';

  // Initialize the 3D application
  _APP = new FirstPersonCameraDemo();
  _APP.initialize_().then(function() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  });
});

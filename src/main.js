import '../style.css'
import FirstPersonCameraDemo from './FirstPersonCameraDemo.js'

let _APP = null;

// Wait for a click and display the loading screen.
document.getElementById('start-button').addEventListener('click', function() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('loading').style.display = 'flex';

  // Initialize the 3D application
  _APP = new FirstPersonCameraDemo();
  _APP.initialize_().then(function() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  });
});

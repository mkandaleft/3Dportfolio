import '../style.css'
import FirstPersonCameraDemo from './FirstPersonCameraDemo.js'

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new FirstPersonCameraDemo();
});

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

// // JavaScript
// document.getElementById('start-button').addEventListener('click', function() {
//   document.getElementById('overlay').style.display = 'none';
//   document.getElementById('loading').style.display = 'flex';

//   // Start loading your 3D models here. This is just a placeholder.
//   loadModels().then(function() {
//     document.getElementById('loading').style.display = 'none';
//     document.getElementById('app').style.display = 'block';

//     // Start your 3D application here.
//     _APP = new FirstPersonCameraDemo();
//   });
// });
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

    function domContentLoadedCallback() {
      var resetViewButtons = document.querySelectorAll(".resetView");
      resetViewButtons.forEach(function(button) {
        button.addEventListener("click", function() {
          if (_APP && _APP.fpsCamera_) {
            _APP.fpsCamera_.resetView();
            console.log("View Reset");
          } else {
            console.log("The _APP or _APP.fpsCamera_ is not defined.");
          }
        });
      });
    }
    // Verifies if loading is done before attaching listiners
    if (document.readyState === 'loading') {
      document.addEventListener("DOMContentLoaded", domContentLoadedCallback);
    } else {
      domContentLoadedCallback();
    }
  });
});

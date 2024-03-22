import '../style.css'
import FirstPersonCameraDemo from './FirstPersonCameraDemo.js'

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new FirstPersonCameraDemo();
});

import Model from './model';
import View from './view';
import Controller from './controller';
import './style.css';


export default (function() {
  const model = new Model();
  const view = new View();
  const controller = new Controller(model, view);

  controller.mount(document.getElementById('app'));
}());

/* DesiTease — set document state before first paint */
(function () {
  var root = document.documentElement;
  root.dataset.gate = 'accepted';
  root.classList.add('js');
})();

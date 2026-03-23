
(function () {
  window.codexPrototypePickFile = function () {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = function () {
      if (input.files && input.files[0]) {
        alert('Выбран файл: ' + input.files[0].name + '. В прототипе файл не загружается, но сценарий работает.');
      }
    };
    input.click();
  };
})();

var webpage = require('webpage').create();

webpage.onConsoleMessage = function (msg) {
    console.log(msg);
};

webpage.settings.userAgent = 'QuestoriaMailChecker';

var base = 'http://barad-dur.questoria.ru';

webpage
  .open(base + '/расписание-живых-квестов')
  .then(function(){
    webpage.viewportSize = { width:1024, height:768 };
    var link = webpage.evaluate(function() {
        var go_btn = document.querySelector('.red-button');
        return go_btn.getAttribute('href');
    });
    webpage.close();
    return webpage.open(base + link);
  })
  .then(function(){
    webpage.evaluate(function() {
        document.querySelector('input#name').value = "Евгений Ольшевский";
        document.querySelector('input#email').value = "mailchecker.questoria@gmail.com";
        document.querySelector('input#phone').value = "7978" + (Math.random() * 100).toString().replace('.', '').substr(0, 7)
        document.querySelector('[name=info]').value = "Info";
        document.querySelector('[name=submit]').click();
    });
    slimer.wait(1000);
    slimer.exit();
  })
;

var email   = require("emailjs");

var mail_config = require('./../config.json');

var mailer  = email.server.connect({
   user:        mail_config.user, 
   password:    mail_config.password, 
   host:        mail_config.smtp, 
   tls: 		{ciphers: "SSLv3"}
});

var sendAlert = function() {
    // send the message and get a callback with an error or details of the message that was sent
    mailer.send({
        text:    "В течение получаса письмо-подтверждение не пришло на тестовый ящик!", 
        from:    "Mailchecker Questoria <" + mail_config.user + ">", 
        to:      "Questoria Admin <test@questoria.ru>",
        subject: "Почта не приходит больше, чем 30 минут!"
    }, function(err, message) { console.log(err || message); });
}

exports.sendAlert = sendAlert;

/**
 * 
 * Creare order and wait for order approve message
 * 
 */
var path = require('path'),
    fs = require('fs'),
    childProcess = require('child_process'),
    slimerjs = require('slimerjs'),
    binPath = slimerjs.path,
    later = require('later'),
    Imap = require('imap'),
    inspect = require('util').inspect,
    moment = require('moment'),
    sendAlert = require('./lib/mailer'),
    mail_config = require('./config.json');

var mail_checker_schedule = null,
    mail_checker_schedule_abort_controller = null,
    childArgs = [path.join(__dirname, 'order-creator.js')],
    STATE_OK = false;

var log = function(msg) {
    fs.appendFile('log/info.log', "[" + moment().format('Y-M-D hh:mm:ss') + "] ~ " + msg + "\n");
}

var createOrder = function() {
    log('create order');
    STATE_OK = false;
    /** some code to create order */
    childProcess.execFileSync(binPath, childArgs);
    mail_checker_schedule = later.setInterval(checkMail, later.parse.text('every 1 minute'));
    mail_checker_schedule_abort_controller = later.setTimeout(function(){
        log('20 minute elapsed. STATE_OK=' + STATE_OK);
        mail_checker_schedule.clear();// stop checker after 20 min
        if (!STATE_OK) {
            fs.writeFileSync('res/error.log', 'error!');
            sendAlert();
        }
    }, later.parse.text('every 20 minute'));
}

var checkMail = function() {    
    log('check mail');
    var imap = new Imap({
        user: mail_config.user,
        password: mail_config.password,
        host: mail_config.imap,
        port: mail_config.imap_port,
        tls: mail_config.imap_tls
    });
        
    function openInbox(cb) {
        imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) throw err;
            var f = imap.seq.fetch('1:3', {
                bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                struct: true
            });
            f.on('message', function(msg, seqno) { // handle incoming message
                console.log('Message #%d', seqno);
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function(stream, info) {
                    var buffer = '';
                    stream.on('data', function(chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function() {
                        // console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                        var headers = Imap.parseHeader(buffer);
                        var subj = headers.subject[0];
                        var from = headers.from[0];
                        var date = parseInt(moment(new Date(headers.date[0])).toNow('m'));
                        log('subj=' + subj);
                        if (/game\@questoria\.ru/.test(from) && date < 20) {
                                log('matched!');
                                mail_checker_schedule.clear();// тушим таймер
                                if (mail_checker_schedule_abort_controller) {
                                    mail_checker_schedule_abort_controller.clear();
                                }
                                fs.writeFileSync('res/tmp.txt', "ok\n");
                                STATE_OK = true;
                        }
                    });
                });
                msg.once('end', function() {
                    console.log(prefix + 'Finished');
                });
            });
            f.once('error', function(err) {
                console.log('Fetch error: ' + err);
            });
            f.once('end', function() {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
    });

    imap.connect();
}


setInterval(createOrder, 7200 * 1000);

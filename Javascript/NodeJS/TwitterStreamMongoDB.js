var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , Twit = require('twit')
  , io = require('socket.io').listen(server)
  , _     = require('underscore')
  , mongoose = require('mongoose')


server.listen(1337);

io.disable('heartbeats');
io.set('log level', 0);

mongoose.connect('mongodb://localhost/tester');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
});

var userSchema = mongoose.Schema({
    username: String
})

var User = mongoose.model('User', userSchema);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var watchList = ["love","hate"];

var T = new Twit({
    consumer_key:         'XXXXXXXX'
  , consumer_secret:      'XXXXXXXX'
  , access_token:         'XXXXXXXX'
  , access_token_secret:  'XXXXXXXX'
})

io.sockets.on('connection', function (socket) {
  
  console.log('Connected');

  var stream = T.stream('statuses/filter', { track: watchList })

  stream.on('tweet', function (tweet) {

      saveTweet(tweet);

  });

});

function saveTweet(tweet)
{
  // console.log(tweet.user.screen_name);
  collection.insert(tweet, {w:1}, function(err, result) {
    console.log(result)
  });

  var newuser = new User({ username: tweet.user.screen_name });
  
  newuser.save(function (err, newuser) {
    if (err) return console.error(err);
  });


}

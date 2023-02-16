/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '164dceed83f04c21b21d198d94443ba9'; // Your client id
var client_secret = '1543f6f5bd4c4b3f8dcd751a6ac18467'; // Your secret
var redirect_uri = 'http://localhost:5500/callback'; // Your redirect uri
var discover_weekly_uri = 'spotify:playlist:37i9dQZEVXcNIdHpZg5YJ2';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  console.log('spider');

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // // use the access token to access the Spotify Web API
        // request.get(options, function(error, response, body) {

        //   //playlist id for discover weekly playlist and playlist that stores all of the discover weekly songs
        //   var id = '0qksI4hHzDpjH6irtKfD3f';
        //   var discoverWeekly_id = '37i9dQZEVXcNIdHpZg5YJ2';

        //   //object to request for all the tracks on the disover weekly playlist
        //   var tracks = {
        //     url: `https://api.spotify.com/v1/playlists/${discoverWeekly_id}/tracks`,
        //     headers: { 'Authorization': 'Bearer ' + access_token },
        //     json: true
        //   };
          
        //   //request for all of the tracks
        //   request.get(tracks, function(error, response, body) {
        //     let tracksUri = [];

        //     for(var i = 0; i < 30; i++) {
        //       tracksUri[i] = body.items[i].track.uri;
        //     }

        //     var addPlaylist = {
        //       url: `https://api.spotify.com/v1/playlists/${id}/tracks`,
        //       headers: { 'Authorization': 'Bearer ' + access_token },
        //       body: {
        //         uris: tracksUri
        //       },
        //       json: true
        //     };

        //     //add tracks to the new playlist
        //     request.post(addPlaylist, function(error, response, body) {
        //       console.log(response);
        //     });
        //   });
        // });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

//below is the code to save all of the discover weekly playlists into one playlist.
var refresh_token = 'AQAqXwccA1rhxedMk4WIcXxREL2bH12plTywoYvu-I3RJeIvVCID0PFlmEieIKYhf-Fi40QHmb9QWg5QHIxOFrlbt5QGaLIjh00ix1i85ibqTO-Txbp1kYxWTuZ0ktzaomw';

var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
  form: {
    grant_type: 'refresh_token',
    refresh_token: refresh_token
  },
  json: true
};

request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {
    var access_token = body.access_token;

    var options = {
      url: 'https://api.spotify.com/v1/me/playlists',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {

      //playlist id for discover weekly playlist and playlist that stores all of the discover weekly songs
      var id = '0qksI4hHzDpjH6irtKfD3f';
      var discoverWeekly_id = '37i9dQZEVXcNIdHpZg5YJ2';

      //object to request for all the tracks on the disover weekly playlist
      var tracks = {
        url: `https://api.spotify.com/v1/playlists/${discoverWeekly_id}/tracks`,
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      //** getting all the tracks through pagination **
      var playlist_request = {
        url: `https://api.spotify.com/v1/playlists/${id}`,
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      request.get(playlist_request, async function(error, response, body) {
        let allTracksUri = [];

        console.log('test');

        // var playlist_request = {
        //   url: `https://api.spotify.com/v1/playlists/0qksI4hHzDpjH6irtKfD3f/tracks?offset=100&limit=100`,
        //   headers: { 'Authorization': 'Bearer ' + access_token },
        //   json: true
        // };
        var totalPages = body.tracks.total / 100;
        var limit = body.tracks.limit;
        var total_tracks = body.tracks.total;
        var songs = body.tracks;

        //offset should allow you to skip a certain number of tracks. next is confusing me
          var body2 = await fetch(body.tracks.next, {
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        })
        .then((response) => response.json())

        //'spotify:track:1Aic3Xbzma3Nb0sSwqGCdf'

        for(var i = 0, j = 98; allTracksUri.length < total_tracks; i++, j++) {
          if(j == limit) {
            fetch(songs.next, {
              headers: { 'Authorization': 'Bearer ' + access_token },
              json: true
            })
            .then((response) => response.json())
            .then(function (body) { 
              limit = body.tracks.limit;
              songs = body.tracks;
              console.log('test');
            });
            j = 0;
          }
          allTracksUri.push(songs.items[j].track.uri);
        }

        // fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        //   headers: { 'Authorization': 'Bearer ' + access_token },
        //   json: true
        // })
        // .then((response) => response.json())
        // .then(function (data) {
        //   console.log(body.tracks.total)
          
        //   fetch(body.items.next, {
        //     headers: { 'Authorization': 'Bearer ' + access_token },
        //     json: true
        //   })
        //   .then((response) => response.json())
        //   .then((data) => console.log(body));
        // });
        
        // request.get(playlist_request, function(error, response, body) {
        //   console.log(body);
        // });
      });
      //** end of pagination code **

      //request for all of the tracks
      request.get(tracks, function(error, response, body) {
        let tracksUri = [];

        for(var i = 0; i < 30; i++) {
          tracksUri[i] = body.items[i].track.uri;
        }

        var addPlaylist = {
          url: `https://api.spotify.com/v1/playlists/${id}/tracks`,
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: {
            uris: tracksUri
          },
          json: true
        };

        //add tracks to the new playlist
        request.post(addPlaylist, function(error, response, body) {
          console.log('test');
        });
      });
    });
  }
});

function recurse(count, next, total) {

  if(count < total) {

  }
}



console.log('Listening on 5500');
app.listen(5500);
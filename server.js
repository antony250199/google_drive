// const express = require('express');
// const app = express();
// const session = require('express-session');
// const multer = require('multer')
// const {google} = require('googleapis');
// const fs = require('fs')

// app.set('view engine', 'ejs');

// app.use(session({
//   resave: false,
//   saveUninitialized: true,
//   secret: 'SECRET' 
// }));

// const oAuth2Client = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_URL
//   );
//   var authed = false;

// var Storage = multer.diskStorage({
//     destination: function (req, file, callback) {
//       callback(null, './images');
//     },
//     filename: function (req, file, callback) {
//       callback(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
//     },
//   });
  
//   var upload = multer({
//     storage: Storage,
//   }).single('file'); 

// app.get('/', function(req, res) {
//   res.render('pages/auth');
// });
// const passport = require('passport');
// var userProfile;

// app.use(passport.initialize());
// app.use(passport.session());

// app.set('view engine', 'ejs');

// app.get('/success', (req, res) => res.send(userProfile));
// app.get('/error', (req, res) => res.send("error logging in"));

// passport.serializeUser(function(user, cb) {
//   cb(null, user);
// });

// passport.deserializeUser(function(obj, cb) {
//   cb(null, obj);
// });
// const port = process.env.PORT || 4000;
// app.listen(port , () => console.log('App listening on port ' + port));

// const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// const GOOGLE_CLIENT_ID = '439032027886-32k6vroja8oqusne3upvt0p2o0c0sv7e.apps.googleusercontent.com';
// const GOOGLE_CLIENT_SECRET = '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';
// passport.use(new GoogleStrategy({
//     clientID: GOOGLE_CLIENT_ID,
//     clientSecret: GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//       userProfile=profile;
//       return done(null, userProfile);
//   }
// ));
 
// app.post('/upload', (req, res) => {
//     upload(req, res, function (err) {
//       if (err) {
//         console.log(err);
//         return res.end('Something went wrong');
//       } else {
//         // console.log(req.file.path);
//         const drive = google.drive({version: 'v3', auth: passport});
//         const fileMetadata = {
//           name: req.file.filename,
//         };
//         const media = {
//           mimeType: req.file.mimetype,
//           body: fs.createReadStream(req.file.path),
//         };
//         drive.files.create(
//           {
//             resource: fileMetadata,
//             media: media,
//             fields: 'id',
//           },
//           (err, file) => {
//             if (err) {
//               // Handle error
//               console.error(err);
//             } else {
//               fs.unlinkSync(req.file.path);
//               res.render('success', {name: name, pic: pic, success: true});
//             }
//           }
//         );
//       }
//     });
//   });

//   app.get('/', (req, res) => {
//     if (!authed) {
//       // Generate an OAuth URL and redirect there
//       var url = oAuth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: SCOPES,
//       });
//       console.log(url);
//       res.render('index', {url: url});
//     } else {
//       var oauth2 = google.oauth2({
//         auth: oAuth2Client,
//         version: 'v2',
//       });
//       oauth2.userinfo.get(function (err, response) {
//         if (err) {
//           console.log(err);
//         } else {
//           console.log(response.data);
  
//           res.render('success', {
//             success: false,
//           });
//         }
//       });
//     }
//   });
  
//   app.get('/logout', (req, res) => {
//     authed = false;
//     res.redirect('/');
//   });
  
//   app.get('/google/callback', function (req, res) {
//     const code = req.query.code;
//     if (code) {
//       // Get an access token based on our OAuth code
//       oAuth2Client.getToken(code, function (err, tokens) {
//         if (err) {
//           console.log('Error authenticating');
//           console.log(err);
//         } else {
//           console.log('Successfully authenticated');
//           console.log(tokens);
//           oAuth2Client.setCredentials(tokens);
  
//           authed = true;
//           res.redirect('/');
//         }
//       });
//     }
//   });

// app.get('/auth/google', 
//   passport.authenticate('google', { scope : ['profile', 'email'] }));
 
// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/error' }),
//   function(req, res) {
//     // Successful authentication, redirect success.
//     res.redirect('/success');
//   });

const fs = require('fs');
const express = require('express');
const multer = require('multer');
const OAuth2Data = require('./credentials.json');
var name, pic;

const {google} = require('googleapis');

const app = express();

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
var authed = false;

// If modifying these scopes, delete token.json.
const SCOPES =
  'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

app.set('view engine', 'ejs');

var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './images');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
  },
});

var upload = multer({
  storage: Storage,
}).single('file'); //Field name and max count

app.get('/', (req, res) => {
  if (!authed) {
    // Generate an OAuth URL and redirect there
    var url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log(url);
    res.render('index', {url: url});
  } else {
    var oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: 'v2',
    });
    oauth2.userinfo.get(function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);

        res.render('success', {
          success: false,
        });
      }
    });
  }
});

app.post('/upload', (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.end('Something went wrong');
    } else {
      console.log(req.file.path);
      const drive = google.drive({version: 'v3', auth: oAuth2Client});
      const fileMetadata = {
        name: req.file.filename,
      };
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };
      drive.files.create(
        {
          resource: fileMetadata,
          media: media,
          fields: 'id',
        },
        (err, file) => {
          if (err) {
            // Handle error
            console.error(err);
          } else {
            fs.unlinkSync(req.file.path);
            res.render('success', {name: name, pic: pic, success: true});
          }
        }
      );
    }
  });
});

app.get('/logout', (req, res) => {
  authed = false;
  res.redirect('/');
});

app.get('/google/callback', function (req, res) {
  const code = req.query.code;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log('Error authenticating');
        console.log(err);
      } else {
        console.log('Successfully authenticated');
        console.log(tokens);
        oAuth2Client.setCredentials(tokens);

        authed = true;
        res.redirect('/');
      }
    });
  }
});

const port = process.env.PORT || 4000;
app.listen(port , () => console.log('App listening on port ' + port));
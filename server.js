const express = require("express");
const app = express();
const fs = require("fs");
const { google } = require("googleapis");
const multer = require("multer");
const passport = require("passport");
const OAuth2Data = require("./credentials.json");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
let file_name = "";
let file_mime = "";
let file_original = "";
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const TOKEN_PATH = "token.json";

app.use(passport.initialize());
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: OAuth2Data.web.client_id,
      clientSecret: OAuth2Data.web.client_secret,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      const userResponse = {
        ...profile,
        accessToken,
        refreshToken,
        expires_in,
      };
      done(null, userResponse);
      // userProfile = profile;
      // return done(null, userProfile);
    }
  )
);

/**
 * Create an OAuth2 client with the given credentials, and then execute the given callback function.
 */
function authorize(req, res, flag) {
  //   const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    OAuth2Data.web.client_id,
    OAuth2Data.web.client_secret,
    OAuth2Data.web.redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      return getAccessToken(oAuth2Client);
    } else if (flag == "upload") {
      oAuth2Client.setCredentials(JSON.parse(token));
      uploadFile(req, res, oAuth2Client);
    } else {
      oAuth2Client.setCredentials(JSON.parse(token));
      shareFile(req, res, oAuth2Client);
    }
  });
}
/**
 * Describe with given media and metaData and upload it using google.drive.create method()
 */
function uploadFile(req, res, auth) {
  if (file_name != "") {
    console.log(auth);
    const drive = google.drive({ version: "v3", auth });
    let folder_id = "1PAhD5UcZpo1xOoRJjIJYv8McmXCWw_hg";
    const fileMetadata = {
      name: file_original,
      parents: [folder_id],
    };
    const media = {
      mimeType: file_mime,
      body: fs.createReadStream(`files/${file_name}`),
    };
    drive.files.create(
      {
        resource: fileMetadata,
        media: media,
        fields: "id",
      },
      (err, file) => {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log("File Id: ", file.id);
        }
      }
    );
  } else {
    return res.send("Please upload a valid file");
  }
}

async function shareFile(req, res, auth) {
  const drive = google.drive({ version: "v3", auth });
  let folder_id = "1PAhD5UcZpo1xOoRJjIJYv8McmXCWw_hg";
  const fileMetadata = {
    name: file_original,
    parents: [folder_id],
  };
  const resp = await drive.permissions
    .create({
      resource: {
        role: "writer",
        type: "user",
        emailAddress: req.body.email,
      },
      fileId: req.body.file_id,
      sendNotificationEmail: true,
      fields: "*",
    })
    .catch((err) => {
      res.send("error occured");
    });
  if (resp) {
    console.log(res.data);
    res.send("Permission provided");
  }
}

var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./files");
  },
  filename: function (req, file, callback) {
    // console.log(file);
    if (req.headers["content-length"] > 50 * 1024 * 1024) {
      var message = `File should be less that 50mb`;
      return callback(message, null);
    } else {
      if (typeof file.originalname != "undefined") {
        file_original = file.originalname;
        file_mime = file.mimetype;
        file_name = file.fieldname + "_" + Date.now() + "_" + file_original;
        callback(
          null,
          file.fieldname + "_" + Date.now() + "_" + file.originalname
        );
      } else {
        var message = `File should be less that 50mb`;
        return callback(message, null);
      }
    }
  },
});

var upload = multer({
  storage: Storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true,
}).single("file");

app.get("/login", function (req, res) {
  const oAuth2Client = new google.auth.OAuth2(
    OAuth2Data.web.client_id,
    OAuth2Data.web.client_secret,
    OAuth2Data.web.redirect_uris[0]
  );
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return res.send("Error occured");
    oAuth2Client.setCredentials(JSON.parse(token));
    res.send(JSON.parse(token));
  });
});

app.post("/upload", function (req, res) {
  file_name = "";
  file_mime = "";
  file = "";
  upload(req, res, function (err) {
    authorize(req, res, "upload");
  });
});

app.get("/google/callback", function (req, res) {
  const code = req.query.code;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log("Error authenticating");
        console.log(err);
      } else {
        console.log("Successfully authenticated");
        console.log(tokens);
        oAuth2Client.setCredentials(tokens);

        authed = true;
        res.redirect("/");
      }
    });
  }
});

app.put("/share_file", function (req, res) {
  authorize(req, res, "share");
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log("App listening on port " + port));

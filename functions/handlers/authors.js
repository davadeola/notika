const { db, admin } = require("../util/admin.js");

const config = require("../util/config");

const firebase = require("firebase");
firebase.initializeApp(config);

const { validateSignUpData, validateLoginData } = require("../util/validators");

exports.signup = (req, res) => {
  const newAuthor = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username: req.body.username,
  };

  const { valid, errors } = validateSignUpData(newAuthor);
  if (!valid) {
    return res.status(400).json(errors);
  }
  let noImg = "no-image.png";
  let token, userId;

  db.doc(`/users/${newAuthor.username}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ response: "Username is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newAuthor.email, newAuthor.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken(true);
    })
    .then((idToken) => {
      token = idToken;

      const authorCredentials = {
        username: newAuthor.username,
        email: newAuthor.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId,
      };

      db.doc(`/users/${newAuthor.username}`).set(authorCredentials);
    })
    .then(() => {
      return res.status(201).json({ response: token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code == "auth/email-already-in-use") {
        return res.status(400).json({ response: "Email already in use" });
      } else {
        return res
          .status(500)
          .json({ response: "Something went wrong please try again" });
      }
    });
};

exports.login = (req, res) => {
  const author = {
    email: req.body.email,
    password: req.body.password,
  };

  const { errors, valid } = validateLoginData(author);
  if (!valid) {
    return res.status(400).json({ errors });
  }

  let user, userData, mToken;

  firebase
    .auth()
    .signInWithEmailAndPassword(author.email, author.password)
    .then((data) => {
      user = data.user.uid;
      return data.user.getIdToken(true);
    })
    .then((token) => {
      mToken = token;
      return db.collection("users").where("userId", "==", user).limit(1).get();
    })
    .then((data) => {
      userData = {
        token: mToken,
        email: data.docs[0].data().email,
        imageUrl: data.docs[0].data().imageUrl,
        username: data.docs[0].data().username,
      };

      return res.json(userData).status(200);
    })
    .catch((err) => {
      console.error(err);
      if (err.code == "auth/email-already-in-use") {
        return res.status(401).json({ email: "Email already in use" });
      } else {
        return res
          .status(500)
          .json({ general: "Something went wrong please try again" });
      }
    });
};

exports.verifyAuthToken = (req, res) => {
  let idToken;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.username = data.docs[0].data().username;
      return res.status(200).json({ token: idToken });
    })
    .catch((err) => {
      console.error("Error while verifying token", err);
      return res.status(403).json(err);
    });
};

exports.refreshAuthToken = (req, res) => {
  let user = firebase.auth().currentUser;
  //console.log(" UID" + req.user.uid);

  user
    .getIdToken(true)
    .then((token) => {
      return res.json({ token }).status(200);
    })
    .catch((err) => {
      return res.status(500).json({ ServerError: "Something went wrong" });
    });
};

exports.uploadProfileImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const fs = require("fs");
  const os = require("os");

  const busboy = new BusBoy({ headers: req.headers });
  let imageFileName,
    imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    //check the type of the file name
    if (
      mimetype != "image/png" &&
      mimetype != "image/jpeg" &&
      mimetype != "image/jpg"
    ) {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }

    //get image extension from uploaded file
    const imageExtension = filename.split(".")[filename.split(".").length - 1];

    //generate file name
    imageFileName = `${Math.round(
      Math.random() * 100000000
    )}.${imageExtension}`;

    //puts file in directory in temporary folder for upload
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filePath, mimetype };

    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        db.doc(`users/${req.user.username}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Profile image updated successfully" });
      })
      .catch((err) => {
        return res.status(500).json({ error: err.code });
      });
  });

  busboy.end(req.rawBody);
};

exports.logout = (req, res) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      return res.status(200).json({ Success: "Successfully logged out" });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({ error });
    });
};

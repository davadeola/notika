const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const app = express();

const {
  getAllNotes,
  addNewNote,
  deleteNote,
  favoriteNote,
  editNote,
} = require("./handlers/notes");
const {
  signup,
  login,
  uploadProfileImage,
  verifyAuthToken,
  logout,
} = require("./handlers/authors");

//import middleware
const Auth = require("./util/Auth");

app.get("/notes", Auth, getAllNotes);
app.post("/note", Auth, addNewNote);
app.delete("/notes/:noteId", Auth, deleteNote);
app.post("/notes/:noteId/favorite", Auth, favoriteNote);
app.post("/notes/:noteId", Auth, editNote);

//author routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/uploadProfile", Auth, uploadProfileImage);
app.post("/verify", verifyAuthToken);
//app.post("/refreshAuthToken", refreshAuthToken);
app.post("/logout", Auth, logout);

exports.api = functions.https.onRequest(app);

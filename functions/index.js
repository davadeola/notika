const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const app = express();

const {
  getAllNotes,
  addNewNote,
  deleteNote,
  favoriteNote,
} = require("./handlers/notes");
const { signup, login, uploadProfileImage } = require("./handlers/authors");

//import middleware
const Auth = require("./util/Auth");

app.get("/notes", Auth, getAllNotes);
app.post("/note", Auth, addNewNote);
app.delete("/notes/:noteId", Auth, deleteNote);
app.post("/notes/:noteId/favorite", Auth, favoriteNote);
//app.post('notes/:noteId/editNote', Auth, editNote)

//author routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/uploadProfile", Auth, uploadProfileImage);

exports.api = functions.https.onRequest(app);

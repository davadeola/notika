const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

const {getAllNotes, addNewNote} = require('./handlers/notes');
const {signup, login} = require('./handlers/authors');

//import middleware
const Auth = require('./util/Auth');


app.get('/notes/:username', Auth, getAllNotes);
app.post('/note', Auth, addNewNote);


//author routes
app.post('/signup', signup);
app.post('/login', login);


exports.api = functions.https.onRequest(app);
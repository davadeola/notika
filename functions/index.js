const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

const {getAllNotes, addNewNote} = require('./handlers/notes');
const {signup, login} = require('./handlers/authors')

app.get('/notes', getAllNotes);
app.post('/note', addNewNote);


//author routes
app.post('/signup', signup);
app.post('/login', login);


exports.api = functions.https.onRequest(app);
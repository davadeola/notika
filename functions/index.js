const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

const {getAllNotes, addNewNote} = require('./handlers/notes')

app.get('/notes', getAllNotes);
app.post('/note', addNewNote);


exports.api = functions.https.onRequest(app);
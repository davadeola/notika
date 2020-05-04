const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

const {getAllNotes} = require('./handlers/notes')

app.get('/notes', getAllNotes);


exports.api = functions.https.onRequest(app);
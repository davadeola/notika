const { db } = require("../util/admin");
const moment = require("moment");

exports.getAllNotes = (req, res) => {
  db.collection("notes")
    .where("username", "==", req.user.username)
    .get()
    .then((notes) => {
      let allNotes = [];
      notes.forEach((note) => {
        allNotes.push({
          title: note.data().title,
          body: note.data().body,
          category: note.data().category,
          author: req.user.username,
          noteId: note.id,
          favorite: note.data().favorite,
          createdAt: note.data().createdAt,
          lastEdited: note.data().lastEdited,
        });
      });

      return res.json(allNotes);
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.addNewNote = (req, res) => {
  const newNote = {
    title: req.body.title != "" ? req.body.title : "Untitled",
    createdAt: moment.utc().utcOffset(3).format("MMMM DD YYYY, hh:mm:ss a"),
    favorite: false,
    username: req.user.username,
    category: req.body.category,
    body: req.body.body,
    lastEdited: moment.utc().utcOffset(3).format("MMMM DD YYYY, hh:mm:ss a"),
  };

  db.collection("notes")
    .add(newNote)
    .then((doc) => {
      const noteDone = { noteId: doc.id, ...newNote };
      res.json(noteDone);
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
};

exports.deleteNote = (req, res) => {
  let document = db.doc(`/notes/${req.params.noteId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Document does not exist" });
      } else if (doc.data().username != req.user.username) {
        return res.status(403).json({ error: "Unauthorized access" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Deleted Successfully" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ err: err.code });
    });
};

exports.favoriteNote = (req, res) => {
  let document = db.doc(`/notes/${req.params.noteId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Document not found" });
      } else if (doc.data().username != req.user.username) {
        return res.status(403).json({ error: "Unauthorized access" });
      } else {
        document.update({
          lastEdited: new Date().toISOString(),
          favorite: !doc.data().favorite,
        });
      }
    })
    .then(() => {
      res.json({ message: "Your note has been added to favorites" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ err: err.code });
    });
};

exports.editNote = (req, res) => {
  let document = db.doc(`/notes/${req.params.noteId}`);

  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Document not found" });
      } else if (doc.data().username != req.user.username) {
        return res.status(403).json({ error: "Unauthorized access" });
      } else {
        document.update({
          lastEdited: moment
            .utc()
            .utcOffset(3)
            .format("MMMM DD YYYY, hh:mm:ss a"),
          title: req.body.title != "" ? req.body.title : "Untitled",
          category: req.body.category,
          body: req.body.body,
        });
      }
    })
    .then(() => {
      res.json({ message: "Your note has been edited to favorites" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ err: err.code });
    });
};

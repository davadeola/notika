const {db} = require('../util/admin');


exports.getAllNotes = (req, res)=>{
       
        db
        .collection('notes')
        .get()
        .then((notes)=>{
            let allNotes = [];
            notes.forEach((note) => {
                allNotes.push({
                    title: note.data().title,
                    body: note.data().body,
                    category: note.data().category,
                    author: note.data().authorId,
                    noteId: note.id
                })
            });

            return res.json(allNotes)
        })
        .catch(err=>{
            console.error(err);
        })       
}


exports.addNewNote = (req, res)=>{
    const newNote = {
        title: req.body.title,
        createdAt: new Date().toISOString(),
        favorite: false,
        category: req.body.category,
        body: req.body.body,
        lastEdited: new Date().toISOString()
    }

    db
    .collection('notes')
    .add(newNote)
    .then(doc=>{
        const noteDone = newNote;
        res.json({noteDone});
    }).catch(err=>{
        res.status(500).json({error: 'Something went wrong'});
        console.error(err)
    })
}
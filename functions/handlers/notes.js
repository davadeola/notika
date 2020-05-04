const {db} = require('../util/admin');


exports.getAllNotes = (req, res)=>{
       
        db
        .collection('notes')
        .get()
        .then((notes)=>{
            let allNotes = [];
            notes.forEach((note) => {
                allNotes.push({
                    title: note.id,
                    body: note.data().body,
                    category: note.data().category,
                    author: note.data().author_id
                })
            });

            return res.json(allNotes)
        })
        .catch(err=>{
            console.error(err);
        })       
}
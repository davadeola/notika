const {db, admin} = require('../util/admin.js');

const config = require('../util/config')

const firebase = require('firebase');
firebase.initializeApp(config);


const {validateSignUpData, validateLoginData} = require('../util/validators');

exports.signup =(req, res)=>{
    const newAuthor = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        username: req.body.username
    }  

    const {valid, errors} = validateSignUpData(newAuthor);
    if (!valid) {
        return res.status(400).json(errors);
    
    }
    let noImg = "no-image.png"
    let token, userId;

    db.doc(`/users/${newAuthor.username}`).get()
    .then((doc) => {
        if (doc.exists) {
            return res.status(400).json({username: 'Username is already taken'});
        }else{
            return firebase.auth().createUserWithEmailAndPassword(newAuthor.email, newAuthor.password);
        }
    }).then((data)=>{
        userId = data.user.uid;
        return data.user.getIdToken();
    }).then((idToken)=>{

        token = idToken;

        const authorCredentials={
            username: newAuthor.username,
            email: newAuthor.email,
            createdAt: new Date().toISOString(),
            imageUrl:`https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            userId
        }

        db.doc(`/users/${newAuthor.username}`).set(authorCredentials);
    }).then(()=>{
        return res.status(201).json({token});
    })
    .catch((err) => {
        console.error(err);
    if (err.code == 'auth/email-already-in-use') {
      return res.status(400).json({email: 'Email already in use'})

    }else{
      return res.status(500).json({general: 'Something went wrong please try again'})
    }
    });
}


exports.login=(req, res)=>{
    const author={
        email: req.body.email,
        password: req.body.password
    }


    const{errors, valid} = validateLoginData(author)
    if(!valid){
        return res.status(400).json({errors});
    }

    firebase.auth().signInWithEmailAndPassword(author.email, author.password)
    .then((data)=>{
        return data.user.getIdToken();
    }).then((token)=>{
        return res.json({token})
    }).catch(err=>{
        console.error(err);
        if (err.code == 'auth/email-already-in-use') {
          return res.status(400).json({email: 'Email already in use'})
    
        }else{
          return res.status(500).json({general: 'Something went wrong please try again'})
        }
    })
}


exports.uploadProfileImage=(req,res)=>{
    const BusBoy = require('busboy');
    const path = require('path');
    const fs = require('fs');
    const os = require('os');

    const busboy = new BusBoy({headers: req.headers});
    let imageFileName, imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype)=>{

    //check the type of the file name
    if (mimetype != "image/png" && mimetype !="image/jpeg" && mimetype !="image/jpg") {
        return res.status(400).json({error: "Wrong file type submitted"});
    }

    //get image extension from uploaded file
    const imageExtension = filename.split('.')[filename.split('.').length-1];

    //generate file name
    imageFileName = `${Math.round(Math.random()*100000000)}.${imageExtension}`;


    //puts file in directory in temporary folder for upload
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = {filePath, mimetype};

    file.pipe(fs.createWriteStream(filePath));
})

busboy.on('finish' , ()=>{
    admin.storage().bucket().upload(imageToBeUploaded.filePath, {
        resumable:false, 
        metadata: {
            metadata:{
                contentType: imageToBeUploaded.mimetype
            }
        }
    }).then(()=>{
        const imageUrl= `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        db.doc(`users/${req.user.username}`).update({imageUrl})
    }).then(()=>{
        return res.json({message: "Profile image updated successfully"})
    }).catch(err=>{
        return res.status(500).json({error: err.code})
    })
})

busboy.end(req.rawBody);

}
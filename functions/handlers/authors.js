const {db} = require('../util/admin.js');

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

    let token, userId;

    db.doc(`/authors/${newAuthor.username}`).get()
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
const express = require('express')
const User = require('../models/users')
const auth = require('../middleware/auth')
const router = express.Router();
const {sendWelcomeMail, sendDeleteMail }= require('../emails/account')
const multer = require('multer');
const sharp = require('sharp')

router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);

        await user.save();
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken();

        console.log('data saved')

        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/login', async (req, res) => {
    try {
        // console.log(req.body.myPass)
        const user = await User.findByCredentials(req.body.email, req.body.myPass);
        const token = await user.generateAuthToken();
        // console.log(user);
        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

// router.get('/users/:id', async (req, res) => {
//     try {
//         const _id = req.params.id;
//         const data = await User.findById(_id);
//         if (!data) {
//             return res.status(404).send();
//         }
//         res.send(data);
//     } catch (e) {
//         res.status(500).send(e);
//     }

// })

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'myPass']
    const isValidOp = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOp) {
        return res.status(400).send({
            error: "invalid update!"
        })
    }
    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        // it bypasses mongoose hence our mongoose middleware won't work if this is used, instead we go traditional.

        // const user = await User.findById(req.user._id);

        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save();

        if (!req.user) {
            return res.status(404).send()
        }


        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.delete('/users/me', auth, async (req, res) => {
    // console.log("I am here")
    try {
        const user = await User.findByIdAndDelete(req.user._id);
        if (!user) {
            return res.status(404).send()
        }
        // await req.user.remove();
        // console.log("I am here")
        sendDeleteMail(user.email, user.name)
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        // if (!file.originalname.endsWith('.pdf')){
        //     return cb(new Error('please upload a PDF file'))
        // }
        // if (!file.originalname.match(/\.(doc|docx)$/)){
        //     return cb(new Error('Please upload a doc file'))
        // }
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('please upload an image'))
        }
        cb(undefined, true)
    }

})

// uploading profile pic
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res)=> {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error : error.message})
})

// deleting profile pic
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error : error.message})
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findOne({ _id: req.params.id});
        if (!user || !user.avatar){
           throw new Error();
        }
        res.set('Content-Type','image/png');
        res.send(user.avatar);
    }catch(e){
        res.status(404).send()
    }
})

module.exports = router;
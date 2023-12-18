const express = require('express')
const Task = require('../models/tasks')
const auth = require('../middleware/auth')
const multer = require('multer');
const router = express.Router();

// console.log('insie the router')

router.post('/tasks', auth, async (req, res) => {
    try {
        // const task = await Task(req.body)
        const task = await Task({
            ...req.body,
            owner:req.user._id
        })

        await task.save();
        console.log('data saved')

        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
})

// GET /tasks?completed:true
router.get('/tasks', auth, async (req, res) => {
    // console.log('hi');
    const match = {}
    const sort = {}

    if (req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    try {
        // method 1
        // const tasks = await Task.find({owner: req.user._id});
        // res.status(201).send(tasks);

        // method 2
        await req.user.populate({
            path: 'tasks',
            match,
            options : {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        // console.log(req.user.tasks)
        res.status(201).send(req.user.tasks)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const data = await Task.findOne({_id, owner: req.user._id});
        if (!data) {
            return res.status(404).send();
        }
        res.send(data);
    } catch (e) {
        res.status(500).send(e);
    }
})


router.patch('/tasks/:id', auth,  async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed']
    const isValidOp = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOp){
        return res.status(400).send({
            error : "invalid update!"
        })
    }
    try{
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        // const task = await Task.findById(req.params.id);


        const task2 = await Task.findOne({_id : req.params.id, owner: req.user._id})
        if (!task2){
            return res.status(404).send()
        }
        updates.forEach((update) => task2[update] = req.body[update]);
        await task2.save();
        res.send(task2)
    }catch(e){
        res.status(500).send()
    }
})



router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findByIdAndDelete({_id : req.params.id, owner: req.user._id});
        if (!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

// const upload = multer({
//     dest: 'avatars',
//     limits: {
//         fileSize: 1000000
//     },
//     fileFilter(req, file, cb){
        
//         cb(undefined, true);
//     }
// })

// router.post('/tasks/me/avatars', upload.single('avatar'), (req, res) => {
//     res.send();
// })

module.exports = router;


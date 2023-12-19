const mongoose = require('mongoose')
const validmod = require('validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./tasks')

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true,
        validate: {
            validator(val) {
                return validmod.isEmail(val);
            },
            message: props => `${props.value} is not a valid email`
        }
    },
    age: {
        type: Number,
        default: 0
    },
    myPass: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate: {
            validator(v) {
                return !v.toLowerCase().includes('password')
            },
            message: "Password not suitable"
        }
    },
    tokens: [{
        token:{
            type: String,
            required: true
        }
    }],
    avatar :{
        type: Buffer
    }
},{
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this;

    const publicUser = user.toObject();

    delete publicUser.myPass;
    delete publicUser.tokens;
    delete publicUser.avatar;

    return publicUser;
}

userSchema.methods.generateAuthToken = async function() {
    // console.log('I am here')
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET );

    user.tokens = user.tokens.concat( { token })
    await user.save(); 
    return token;
}


userSchema.statics.findByCredentials = async function(email, password) {
    const user = await User.findOne({ email })
    if (!user){
        throw new Error('Unable to login!');
    }
    // console.log(password);
    // console.log(user.myPass);
    const isMatch = await bcrypt.compare(password, user.myPass)
    console.log(isMatch)
    if (!isMatch){
        throw new Error('Unable to login!')
    }
    return user;
}

// hash the plain text password before saving
userSchema.pre('save', async function(next){
    // console.log('I was here')
    const user = this

    if (user.isModified('myPass')){
        // console.log(user.myPass);
        user.myPass = await bcrypt.hash(user.myPass, 8);
        // console.log(user.myPass);
    }

    next();
}) 

// delete tasks when the user is removed
userSchema.pre('deleteOne', async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema);

module.exports = User
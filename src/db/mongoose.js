const mongoose = require('mongoose')
// const User = require('../models/users')
// const Task = require('../models/tasks')


async function main() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('db connected')

    // await User.deleteMany({})
    // const tasks = await User.find();
    // console.log(tasks)


}


main().catch(console.log)

module.exports = main
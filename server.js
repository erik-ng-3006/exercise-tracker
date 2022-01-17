const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

//Connect to the database
mongoose.connect('mongodb+srv://erikng3006:erikdeptrai123@cluster0.vk9kc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')

//Create Schemas
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    }
})

const excerciseSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    username: {
        type: String
    },
    description: {
        type: String
    },
    duration: {
        type: Number
    },
    date: Date
})

const logSchema = new mongoose.Schema({
    username: String,
    count: Number,
    log: Array
})

//Create Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', excerciseSchema)
const Log = mongoose.model('Log', logSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

//Route 1
app.post('/api/users', async(req, res) => {
    const username = req.body.username
    try {
        await User.find({ username: username }, async(err, data) => {
            if (err) {
                console.log(err)
            } else {
                if (data.username === '') {
                    res.send('Path `username` is required.')
                } else {

                    const newUser = new User({ username: username })
                    try {
                        await newUser.save((err, data) => {
                            if (err || !data) {
                                res.send('There was an error while saving')
                            } else {
                                res.json({ username: newUser.username, _id: newUser._id })
                            }
                        })
                    } catch (err) {
                        console.log(err)
                    }
                }
            }
        }).clone()
    } catch (err) {
        console.log(err)
    }
});

//Route 2
app.get('/api/users', async(req, res) => {
    try {
        const allUser = await User.find({})
        res.send(allUser)
    } catch (err) {
        console.log(err)
    }
})

//Route 3
app.post('/api/users/:_id/exercises', async(req, res) => {
    let checkedDate = new Date(req.body.date);

    let noDateHandler = () => {
        if (checkedDate instanceof Date && !isNaN(checkedDate)) {
            return checkedDate
        } else {
            checkedDate = new Date();
        }
    }
    const { date, duration, description } = req.body
    try {
        noDateHandler(checkedDate);

        await User.findById(req.params._id, async(err, userData) => {

            const newExercise = new Exercise({
                userId: userData._id,
                username: userData.username,
                date: checkedDate.toDateString(),
                duration,
                description
            })
            try {
                await newExercise.save((err, data) => {
                    if (err || !data) {
                        res.send("There was an error while saving")
                        console.log(err)
                    } else {
                        res.json({
                            _id: data.userId,
                            username: data.username,
                            date: data.date.toDateString(),
                            duration: parseInt(data.duration),
                            description: data.description
                        })
                    }
                })
            } catch (err) {
                console.log(err)
            }
        }).clone()
    } catch (err) {
        console.log(err)
    }
})

//Route 4
app.get('/api/users/:id/logs', async(req, res) => {
    const id = req.params.id

    let { from, to, limit } = req.query
    try {
        await User.findById(id, async(err, userData) => {
            const queryObject = {
                userId: id
            }

            if (from !== undefined && to !== undefined) {
                queryObject.date = { $gte: new Date(from), $lte: new Date(to) }
            } else if (from !== undefined && to === undefined) {
                queryObject.date = { $gte: new Date(from) }
            } else if (from === undefined && to !== undefined) {
                queryOject.date = { $lte: new Date(to) }
            }

            const limitChecker = lim => {
                const maxLim = 100
                if (lim) {
                    return lim;
                }
                return maxLim;
            }
            try {
                await Exercise.find(queryObject, null, { limit: limitChecker(+limit) }, async(err, data) => {
                    let loggedArray = data.map(item => {
                        return {
                            description: item.description,
                            duration: item.duration,
                            date: item.date.toDateString()
                        }
                    })
                    const newLog = new Log({
                        username: userData.username,
                        count: data.length,
                        log: loggedArray
                    })
                    try {
                        await newLog.save((err, saveData) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.json({
                                    _id: id,
                                    username: saveData.username,
                                    count: saveData.count,
                                    log: saveData.log
                                })
                            }
                        })
                    } catch (err) {
                        console.log(err)
                    }
                }).clone()
            } catch (err) {
                console.log(err)
            }
        }).clone()
    } catch (err) {
        console.log(err)
    }
})


const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
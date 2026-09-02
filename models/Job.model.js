const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({

    title:{
        type: String,
        required: true,
        trim: true,
        length: [3, 100]
    },
    companyName:{
        type: String,
        required: true,
    },
    salaryMin:{
        type: Number,
        required: true,
    },
    salaryMax:{
        type: Number,
        required: true,
    },
    workMode:{
        type: String,
        enum: ['remote', 'on-site', 'hybrid'],
        required: true,
    },
    experience:{
        type: Number,
        required: true,
        min: 0
    },
    location:{
        type: String,
        required: true,
        trim: true,
    },
    jobDescription:{
        type: String,
        required: true,
        trim: true,
        length: [10, 1000]
    },
    requiredSkills:{
        type: String,
        required: true,
        trim: true,
        length: [3, 100]
    },
    applicationDeadline:{
        type: Date,
        required: true,
         validate: {
        validator: function (value) {
            return value > Date.now();
        },
        message: "Application deadline cannot be in the past"
    },
 },
 isArchived: {
    type: Boolean,
    default: false
},
postedBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"NaukriAspirant",
    required: true
},

},
{
    timestamps: true
}
);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
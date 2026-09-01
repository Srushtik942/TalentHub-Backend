const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role:{
        type: String,
        required: true,
        enum: ["applicant", "recruiter"]
    },
    password:{
        type: String,
        required: true
    },
    // Applicant fields
    experience:{
        type:Number,
        // required: true
    },
    location:{
        type: String,
        required: true
    },
    skills:{
        type: [String],
        default: []
    },
    resume:{
        type: String
    },
      bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job"
    }],
    //  Recruiter-only fields
     companyName:{
        type: String,
        // required: true,
        unique: true,
         sparse: true

    },
    website:{
        type:String,
        unique: true,
         sparse: true
    },
    about:{
        type: String
    }
},
{
    timestamps: true
}
);
module.exports = mongoose.model("NaukriAspirant", userSchema);
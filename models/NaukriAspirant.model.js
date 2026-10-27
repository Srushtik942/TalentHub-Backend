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
        type: String
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
    },
    companySize:{
        type: String,
         enum: ["11-50 employees", "51-200 employees", "201-500 employees", "501-1000 employees", "1000+ employees"],
    }
},
{
    timestamps: true
}
);
module.exports = mongoose.model("NaukriAspirant", userSchema);
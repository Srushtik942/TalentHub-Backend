const mongoose = require("mongoose");


const applicationSchema = new mongoose.Schema({
    applicant:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "NaukriAspirant",
        required: true
    },
    job:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    coverLetter:{
        type: String
    },
    status:{
        type: String,
        enum: ["pending", "shortlisted", "interview", "rejected", "hired"],
        default: "pending"
    },
      appliedAt: {
        type: Date,
        default: Date.now
    },
},
{
    timestamps: true
});

// preventing the same user from applying to the same job multiple times
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
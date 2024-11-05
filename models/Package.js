const mongoose = require("mongoose");

const generatePackageId = (firstName, lastName) => {
    const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase();
    const initials = firstName[0].toUpperCase() + lastName[0].toUpperCase();
    const randomDigits = Math.floor(100 + Math.random() * 900);  // Generate 3 random digits
    return `P${randomLetters}-${initials}-${randomDigits}`;
};


// Package Schema
const packageSchema = new mongoose.Schema({
    package_id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    package_title: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 15 
    },
    package_weight: { 
        type: Number, 
        required: true, 
        min: 0.1  // Ensures weight is positive
    },
    package_destination: { 
        type: String, 
        required: true, 
        minlength: 5, 
        maxlength: 15 
    },
    description: { 
        type: String, 
        maxlength: 30 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    isAllocated: { 
        type: Boolean, 
        default: false 
    },
    driver_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Driver',  // Reference to the Driver model
        required: true 
    }
});

// Package model
const Package = mongoose.model('Package', packageSchema);

module.exports = {
    Package,
    generatePackageId  // Export the function
};


const mongoose = require("mongoose");

// Driver Schema
const driverSchema = new mongoose.Schema({
    driver_id: {
        type: String,
        required: true,
        unique: true,
        match: /^D\d{2}-\d{2}-[A-Z]{3}$/,  // Ensure it follows the format "Dxx-yy-XXX"
    },
    driver_name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20,
        match: /^[A-Za-z]+$/, // Only alphabets allowed
    },
    driver_licence: {
        type: String,
        required: true,
        match: /^[A-Za-z0-9]{5}$/,  // 5 alphanumeric characters
    },
    driver_isActive: {
        type: Boolean,
        default: true
    },
    driver_department: {
        type: String,
        required: true,
        enum: ['food', 'furniture', 'electronic'],  // Valid departments only
    },
    driver_createdAt: {
        type: Date,
        default: Date.now
    },
    assigned_packages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",  // References the Package model
    }],
});

// Utility functions for ID generation
function getRandomUppercaseLetter() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
}

function getRandomDigit() {
    return Math.floor(Math.random() * 10);
}

function generateDriverID() {
    const randomDigits = `${getRandomDigit()}${getRandomDigit()}`;
    const studentIDPart = 33;  // Hardcoding '33' based on image
    const randomLetters = `${getRandomUppercaseLetter()}${getRandomUppercaseLetter()}${getRandomUppercaseLetter()}`;
    const driverID = `D${randomDigits}-${studentIDPart}-${randomLetters}`;
    return driverID;
}

// Driver model
const Driver = mongoose.model('Driver', driverSchema);

module.exports = {
    Driver,
    generateDriverID, // Export the ID generation function
};

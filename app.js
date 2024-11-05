const express = require("express");
const mongoose = require("mongoose");
const { Driver, generateDriverID } = require('./models/Driver');
const { Package, generatePackageId } = require("./models/Package");
const router = express.Router();

const PORT_NUMBER = 8080;
const app = express();

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/logisticsDB")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Middleware
app.use(express.static("node_modules/bootstrap/dist/css"));
app.use(express.static("images"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Mount router at the root
app.use("/", router);

// Start the server
app.listen(PORT_NUMBER, () => {
    console.log(`listening on port ${PORT_NUMBER}`);
});


// New API endpoint to add a new driver and respond with JSON
app.post("/33906548/Patrick/api/v1/drivers/add", async (req, res) => {
    try {
        const { driver_name, driver_department, driver_licence, driver_isActive } = req.body;

        // Check if all required fields are provided
        if (!driver_name || !driver_department || !driver_licence) {
            return res.status(400).json({ error: "All fields are required: driver_name, driver_department, driver_licence." });
        }

        // Generate driver_id
        const driverID = generateDriverID();

        // Create a new driver instance with the generated driver_id
        const newDriver = new Driver({
            driver_id: driverID,
            driver_name,
            driver_department,
            driver_licence,
            driver_isActive
        });

        // Save the driver
        const savedDriver = await newDriver.save();

        // Respond with the driver_id and MongoDB _id
        res.status(201).json({
            id: savedDriver._id,
            driver_id: savedDriver.driver_id
        });
    } catch (error) {
        console.error("Error saving driver:", error.message);
        res.status(400).json({ error: error.message });
    }
});

app.get("/33906548/Patrick/api/v1/drivers", async (req, res) => {
    try {
        // Fetch all drivers and populate their assigned_packages field
        const drivers = await Driver.find({})
            .populate({
                path: "assigned_packages",  // Populate the packages associated with the driver
                select: "package_id package_title package_weight package_destination isAllocated"  // Select only specific fields from the package
            })
            .exec();

        // Send the response with driver details and their packages (if they exist)
        res.status(200).json(drivers);
    } catch (error) {
        console.error("Error fetching drivers:", error.message);
        res.status(500).json({ error: "Failed to fetch drivers" });
    }
});


app.delete("/33906548/Patrick/api/v1/drivers/:id", async (req, res) => {
    try {
        const driverId = req.params.id;

        // Find the driver by ID first to get their assigned packages
        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({ acknowledged: false, message: "Driver not found" });
        }

        // Delete all packages assigned to the driver
        const packageDeletionResult = await Package.deleteMany({ _id: { $in: driver.assigned_packages } });

        // Delete the driver itself
        const driverDeletionResult = await Driver.deleteOne({ driver_id: driverId });

        // Send the response containing the number of deleted documents
        res.status(200).json({
            acknowledged: true,
            deletedDriverCount: driverDeletionResult.deletedCount,
            deletedPackageCount: packageDeletionResult.deletedCount
        });
    } catch (error) {
        console.error("Error deleting driver and packages:", error);
        res.status(500).json({ acknowledged: false, error: "Error deleting driver and packages" });
    }
});

app.put('/33906548/Patrick/api/v1/packages/update', async (req, res) => {
    const { package_id, package_destination } = req.body;  // package_id here refers to the MongoDB ObjectId (_id)

    try {
        // Find the package by _id and update the destination
        const result = await Package.findByIdAndUpdate(
            package_id,  // Search by _id (MongoDB ObjectId)
            { $set: { package_destination: package_destination } },  // Update the destination field
            { new: true }  // Return the updated document
        );

        // If no package is found, return 404
        if (!result) {
            return res.status(404).json({ status: "ID not found" });
        }

        // If update is successful, return success message
        res.json({ status: "updated successfully" });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ status: "error", message: error.message });
    }
});


app.post('/33906548/Patrick/api/v1/packages/add', async (req, res) => {
    try {
        const { package_title, package_weight, package_destination, isAllocated, driver_id, firstName, lastName } = req.body;

        // Generate package_id using the appropriate method
        let package_id;
        if (firstName && lastName) {
            package_id = generatePackageId(firstName, lastName);
        } else {
            package_id = `PZA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        }

        // Create a new package object
        const newPackage = new Package({
            package_title,
            package_weight,
            package_destination,
            isAllocated,
            driver_id,
            package_id
        });

        // Save the package to the database
        const savedPackage = await newPackage.save();

        // Return the new package ID and package_id
        res.status(201).json({
            id: savedPackage._id,
            package_id: savedPackage.package_id
        });
    } catch (error) {
        console.error("Error adding package:", error);
        res.status(500).json({ status: "Error adding package", error: error.message });
    }
});


app.delete('/33906548/Patrick/api/v1/packages/:id', async (req, res) => {
    try {
        const packageId = req.params.id;

        // Delete the package by ID
        const deleteResult = await Package.deleteOne({ _id: packageId });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ acknowledged: false, message: "Package not found" });
        }

        // Remove the package ID from the 'assigned_packages' array in all drivers
        await Driver.updateMany(
            { assigned_packages: packageId },
            { $pull: { assigned_packages: packageId } }
        );

        // Return the result
        res.status(200).json({
            acknowledged: true,
            deletedCount: deleteResult.deletedCount
        });
    } catch (error) {
        console.error("Error deleting package:", error);
        res.status(500).json({ status: "Error deleting package", error: error.message });
    }
});

// Update package destination by ID
app.put('/33906548/Patrick/api/v1/packages/update', async (req, res) => {
    const { package_id, package_destination } = req.body;
    
    try {
        const result = await Package.updateOne(
            { package_id: package_id },
            { $set: { destination: package_destination } } // Update the destination
        );

        if (result.modifiedCount === 1) {
            res.json({ status: "updated successfully" });
        } else {
            res.status(404).json({ status: "ID not found or no changes made" });
        }
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ status: "error", message: error.message });
    }
});


// Routes
app.get("/33906548/Patrick/", async (req, res) => {
    try {
        const driverCount = await Driver.countDocuments();
        const packageCount = await Package.countDocuments();

        res.render("index", {
            driverCount,
            packageCount
        });
    } catch (error) {
        console.error("Error fetching counts:", error);
        res.render("index", {
            driverCount: 0,
            packageCount: 0
        });
    }
});

app.get("/33906548/Patrick/invalid-data", (req, res) => {
    res.render("invalid-data");
});

app.get("/33906548/Patrick/add-driver", (req, res) => {
    res.render("add-driver");
});

app.get("/33906548/Patrick/view-drivers", async (req, res) => {
    try {
        const drivers = await Driver.find({});
        res.render("view-drivers", { db: drivers });
    } catch (err) {
        console.error("Error fetching drivers:", err);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});


// Define the full path inside the router
router.post('/33906548/Patrick/add-driver-post', async (req, res) => {
    try {
        const newDriver = new Driver({
            driver_id: generateDriverID(),
            driver_name: req.body.driver_name,
            driver_department: req.body.driver_department,
            driver_licence: req.body.driver_licence,
            driver_isActive: req.body.driver_isActive === 'on',  // Checkbox value comes in as 'on'
        });

        // Save the new driver to the database
        await newDriver.save();

        // Redirect to the "view-drivers" page after saving
        res.redirect("/33906548/Patrick/view-drivers");
    } catch (error) {
        console.error("Error saving driver:", error);
        res.status(400).json({ message: "Error saving driver", error });
    }
});


app.get("/33906548/Patrick/delete-driver", (req, res) => {
    res.render("delete-driver");
});

app.get("/33906548/Patrick/delete-driver-submit", async (req, res) => {
    try {
        const driverId = req.query.id;
        if (!driverId) {
            return res.redirect("/33906548/Patrick/invalid-data");
        }

        await Driver.findOneAndDelete({ driver_id: driverId });
        res.redirect("/33906548/Patrick/view-drivers");
    } catch (err) {
        console.error("Error deleting driver:", err);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});

app.get("/33906548/Patrick/add-package", async (req, res) => {
    try {
        const drivers = await Driver.find({});
        res.render("add-package", { drivers });
    } catch (err) {
        console.error("Error fetching drivers:", err);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});

app.post("/33906548/Patrick/add-package-post", async (req, res) => {
    try {
        const { title, weight, destination, description, driverID, isAllocated } = req.body;
        const newPackage = new Package({
            package_id: `P${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            package_title: title,
            package_weight: parseFloat(weight),
            package_destination: destination,
            description: description || '',
            driver_id: driverID,
            isAllocated: isAllocated === 'on'
        });

        await newPackage.save();
        res.redirect("/33906548/Patrick/view-packages");
    } catch (error) {
        console.error("Error saving package:", error.message);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});


app.get("/33906548/Patrick/view-packages", async (req, res) => {
    try {
        const packages = await Package.find({});
        res.render("view-packages", { packageDb: packages });
    } catch (err) {
        console.error("Error fetching packages:", err);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});

app.get("/33906548/Patrick/delete-package", (req, res) => {
    res.render("delete-package");
});

app.post("/33906548/Patrick/delete-package-post", async (req, res) => {
    try {
        const packageId = req.body.packageId;
        await Package.findOneAndDelete({ package_id: packageId });
        res.redirect("/33906548/Patrick/view-packages");
    } catch (err) {
        console.error("Error deleting package:", err);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});

app.get("/33906548/Patrick/list-drivers-by-department", async (req, res) => {
    try {
        const result = await Driver.aggregate([
            { $group: { _id: "$department", drivers: { $push: "$$ROOT" } } }
        ]);
        res.render("list-drivers-by-department", { driversByDepartment: result });
    } catch (err) {
        console.error("Error grouping drivers:", err);
        res.redirect("/33906548/Patrick/invalid-data");
    }
});

app.get("*", (req, res) => {
    res.render("404");
});

module.exports = router;
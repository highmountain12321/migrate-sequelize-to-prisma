const { prisma } = require("../../../../prisma/client");

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.equipment_residential_battery.findMany();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching data.");
    }
}

exports.show = async function (req, res, next) {
    try {
        const id = req.params.batteryId;
        const data = await prisma.equipment_residential_battery.findUnique({
            where: {
                id: Number(id)
            }
        });
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching the data.");
    }
}

exports.update = async function (req, res, next) {
    try {
        const id = req.params.batteryId;
        
        const updatedBattery = await prisma.equipment_residential_battery.update({
            where: { id: Number(id) },
            data: req.body
        });
        
        res.status(201).json(updatedBattery);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.create = async function (req, res, next) {
    try {
        const { user } = req.token;
        const newBattery = {
            ...req.body,
            userId: user
        };

        const createdBattery = await prisma.equipment_residential_battery.create({
            data: newBattery
        });

        res.json(createdBattery);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.batteryId;
        
        const deletedBattery = await prisma.equipment_residential_battery.delete({
            where: { id: Number(id) }
        });

        res.json(deletedBattery);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

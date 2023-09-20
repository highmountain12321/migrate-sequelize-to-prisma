const { prisma } = require("../../../../prisma/client");

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.equipment_residential_inverter.findMany();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching data.");
    }
}

exports.show = async function (req, res, next) {
    try {
        const id = req.params.inverterId;
        const data = await prisma.equipment_residential_inverter.findUnique({
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
        const id = req.params.inverterId;
        
        const updatedInverter = await prisma.equipment_residential_inverter.update({
            where: { id: Number(id) },
            data: req.body
        });
        
        res.status(201).json(updatedInverter);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.create = async function (req, res, next) {
    try {
        const { user } = req.token;
        const newInverter = {
            ...req.body,
            userId: user
        };

        const createdInverter = await prisma.equipment_residential_inverter.create({
            data: newInverter
        });

        res.json(createdInverter);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.inverterId;
        
        const deletedInverter = await prisma.equipment_residential_inverter.delete({
            where: { id: Number(id) }
        });

        res.json(deletedInverter);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

const { prisma } = require("../../../../prisma/client");

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.equipment_residential_module.findMany();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching data.");
    }
}

exports.show = async function (req, res, next) {
    try {
        const id = req.params.moduleId;
        const data = await prisma.equipment_residential_module.findUnique({
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
        const id = req.params.moduleId;
        
        const updatedModule = await prisma.equipment_residential_module.update({
            where: { id: Number(id) },
            data: req.body
        });
        
        res.status(201).json(updatedModule);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.create = async function (req, res, next) {
    try {
        const { user } = req.token;
        const newModule = {
            ...req.body,
            userId: user
        };

        const createdModule = await prisma.equipment_residential_module.create({
            data: newModule
        });

        res.json(createdModule);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.moduleId;
        
        const deletedModule = await prisma.equipment_residential_module.delete({
            where: { id: Number(id) }
        });

        res.json(deletedModule);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

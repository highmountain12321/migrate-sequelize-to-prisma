exports.create = async function(req, res, next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const model = await prisma.closingformCommentType.create({
                data: req.body
            });
            res.json(model);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
}

exports.update = async function(req, res, next) {
    // Assuming that you will be updating based on an ID and you will send the update data in req.body
    try {
        const id = Number(req.params.id);  // assuming the id is passed as a parameter
        const updatedModel = await prisma.closingformCommentType.update({
            where: { id },
            data: req.body
        });
        res.json(updatedModel);
    } catch (error) {
        console.error(error);
        next(error);
    }
}

exports.destroy = async function(req, res, next) {
    try {
        const id = Number(req.params.id);
        const response = await prisma.closingformCommentType.delete({ where: { id } });
        res.json(response);
    } catch (error) {
        console.error(error);
        next(error);
    }
}

exports.list = async function(req, res) {
    try {
        const data = await prisma.closingformCommentType.findMany({
            where: {
                isActive: true
            }
        });
        res.json({ count: data.length, rows: data });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while fetching data.");
    }
}

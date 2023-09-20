exports.createComment = async function(req, res, next) {
    try {
        const { user, role } = req.token;
        const closingFormId = Number(req.params.closingFormId);
        const { comment, typeId: type } = req.body;

        const newComment = await prisma.closingformComment.create({
            data: {
                userId: user,
                comment: comment,
                typeId: type,
                closingForm: {
                    connect: { id: closingFormId }
                }
            }
        });

        const comments = await prisma.closingformComment.findMany({
            where: { closingFormId: closingFormId },
            include: {
                user: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.status(200).json(comments);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.listComment = async function(req, res, next) {
    try {
        const { user, role } = req.token;
        const closingFormId = Number(req.params.closingFormId);

        const comments = await prisma.closingformComment.findMany({
            where: { closingFormId: closingFormId },
            include: {
                user: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.status(200).json(comments);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Update function is empty, so I'm skipping it for now

exports.destroy = async function(req, res, next) {
    try {
        const id = Number(req.params.id);
        const response = await prisma.closingformComment.delete({ where: { id } });
        res.json(response);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

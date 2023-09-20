const prisma = require('../../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const projectBoards = await prisma.projectBoard.findMany({
            where: {
                isPrimary: true
            },
            include: {
                lanes: {
                    include: {
                        projects: {
                            include: {
                                contact: {
                                    include: {
                                        users: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        res.json({ rows: projectBoards });
    } catch (error) {
        next(error);
    }
};

exports.listLanes = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const projectBoard = await prisma.projectBoard.findUnique({
            where: { id },
            include: { lanes: true }
        });
        res.json(projectBoard);
    } catch (error) {
        next(error);
    }
};

exports.listProjects = async function (req, res, next) {
    try {
        const projectBoard = await prisma.projectBoard.findUnique({
            where: { id: req.loadedProjectBoardModel.id },
            include: {
                lanes: {
                    include: {
                        projects: {
                            include: {
                                contact: {
                                    include: {
                                        users: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        res.json({ rows: projectBoard.lanes.flatMap(lane => lane.projects) });
    } catch (error) {
        next(error);
    }
};

exports.createProject = async function (req, res, next) {
    try {
        const project = {
            ...req.body,
            ownerId: req.userModel.id,
            projectLaneId: req.loadedProjectBoardModel.lanes[0].id,
            boardId: req.loadedProjectBoardModel.id
        };
        const newProject = await prisma.project.create({ data: project });
        res.json(newProject);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    try {
        const projectBoard = await prisma.projectBoard.findUnique({
            where: { id: req.loadedProjectBoardModel.id },
            include: {
                lanes: {
                    include: {
                        projects: {
                            include: {
                                contact: {
                                    include: {
                                        users: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(projectBoard);
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const updatedProjectBoard = await prisma.projectBoard.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedProjectBoard);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        const newProposal = {
            ...req.body,
            userId: req.token.user
        };
        const newProposalModel = await prisma.projectBoard.create({ data: newProposal });
        res.json(newProposalModel);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.projectBoardId);
        await prisma.projectBoard.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

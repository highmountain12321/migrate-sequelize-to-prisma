const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await models.project_board.findAll({
        include: [{
            separate: true,
            model: models.project_lane,
            as: 'lanes',
            include: [{
                separate: true,
                model: models.project,
                as: 'projects',
                include: [{
                    model: models.contact,
                    as: 'contact',
                    include: [{
                        model: models.user,
                        as: 'users',
                    }]
                }]
            }]
        }],
        where:{
        isPrimary:true
        }});
    res.json({rows:obj_array});
}
exports.listLanes = async function (req, res, next) {
    const id = req.params.id;
    const obj_array = await models.project_board.findByPk(id);
    res.json(obj_array);
}
exports.listProjects = async function (req, res, next) {

    const projectBoardModel = req.loadedProjectBoardModel;
    let allProjects = [];
    const obj_array = await projectBoardModel.getLanes( {
        include: [{
                separate: true,
                model: models.project,
                as: 'projects',
                include: [{
                    model: models.contact,
                    as: 'contact',
                    include: [{
                        model: models.user,
                        as: 'users',
                    }]
                }]
            }]
    });
    allProjects = [...allProjects, ..._.flatten(obj_array.map(r=>r.projects))];
    res.json({rows:allProjects});
}
exports.createProject = async function (req, res, next) {
    const projectBoardModel = req.loadedProjectBoardModel;
    const laneModels = await projectBoardModel.getLanes();

    const userModel = req.userModel;
    const project = req.body;
    project.ownerId = userModel.id;
    project.projectLaneId = laneModels[0].id;
    project.boardId = projectBoardModel.id;
    const newProjectModel = await models.project.create(project);
    return res.json(newProjectModel);

}


exports.show = async function (req, res, next) {
    const projectBoardModel = req.loadedProjectBoardModel;
    projectBoardModel.setDataValue('lanes', await projectBoardModel.getLanes({
        include: [{
            separate: true,
            model: models.project,
            as: 'projects',
            include: [{
                model: models.contact,
                as: 'contact',
                include: [{
                    model: models.user,
                    as: 'users',
                }]
            }]
        }]
    }));
    res.json(projectBoardModel);
}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.project_board.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.project_board.findByPk(id);
    res.status(201).json(newProposal);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;
    const newProposal = req.body;
    newProposal.userId = user;

    const newProposalModal = await models.project_board.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.projectBoardId;
        const obj = await models.project_board.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}

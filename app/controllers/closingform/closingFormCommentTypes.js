const {models} = require("../../../sequelize");

exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const model = await models.closingform_comment_type.create(req.body);
        return res.json(model);
    }

}

exports.update = async function (req, res, next) {

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await  models.closingform_comment_type.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
exports.list = async function (req, res) {
    const data = await models.closingform_comment_type.findAndCountAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}

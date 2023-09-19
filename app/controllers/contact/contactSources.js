const {models} = require("../../../sequelize");
exports.list = async function (req, res) {
    const data = await models.contact_source.findAndCountAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}
exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    const newProposal = req.body;
    newProposal.userId = user;

    const newProposalModal = await models.contact_source.create(newProposal);
    return res.json(newProposalModal);

}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body = req.body;
    await models.contact_source.update(body, {
        returning: true,
        plain: true,
        where:
        {
            id: id
        }
    });
    const newProposal = await models.contact_source.findByPk(id);
    res.status(201).json(newProposal);
}
exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.contact_source.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
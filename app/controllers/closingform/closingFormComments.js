const { models } = require("../../../sequelize");

exports.createComment = async function (req, res, next) {
    const { user, role } = req.token;
    const closingFormId = req.params.closingFormId;
    const comment = req.body.comment;
    const type = req.body.typeId;
    const newComment = await models.closingform_comment.create({
        userId: user,
        comment: comment,
        typeId: type
    });
    const closingForm = await models.closing_form.findByPk(closingFormId);
    console.log(closingForm);
    await closingForm.addClosingform_comments(newComment);
    await closingForm.save();
    const comments = await closingForm.getClosingform_comments({
        include: [{
            model: models.user,
            as: 'user',
            attributes: ['firstName', 'lastName'],
        }],
        order: [
            ['id', 'desc']
        ]
    });
    res.status(200).json(comments);
}

exports.listComment = async function (req, res, next) {
    const { user, role } = req.token;
    const closingFormId = req.params.closingFormId;
    const closingForm = await models.closing_form.findByPk(closingFormId);
    const comment = await closingForm.getClosingform_comments({
        include: [{
            model: models.user,
            as: 'user',
            attributes: ['firstName', 'lastName'],
        }],
        order: [
            ['id', 'desc']
        ]
    });
    res.status(200).json(comment);
}
exports.update = async function (req, res, next) {

}
exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.closingform_comment.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
// exports.list = async function (req, res) {
//     const data = await models.closingform_comment.findAndCountAll({
//         where: {
//             isActive: true
//         }
//     });
//     res.json(data);
// }

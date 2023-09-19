const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');
const jsonexport = require("jsonexport");
const {Op} = require("sequelize");
const moment = require("moment");

exports.listAPI = async function (req, res, next) {


}
exports.list = async function (req, res, next) {
    const obj_array = await models.closing_form.findAll({
        where:{
            createdAt : {
                [Op.between] : [
                    moment().subtract(1,'month').format('YYYY-MM-DD'),
                    moment().format('YYYY-MM-DD')
                ]
            }
        },
        order: [
            ['id', 'DESC']
        ],
        include: [
            {
                model: models.user,
                as: 'submittedBy',
                attributes:['firstName','lastName','roleId'],
                include:[ {
                    model: models.role,
                    as: 'role',
                    attributes:['name']
                }]
            },
            {
                model: models.closing_form_update,
                as: 'update',
                attributes:['toId','createdAt'],
                include:[ {
                    model: models.closing_form_update_type,
                    as: 'to',
                    attributes: ['name']
                }]
            },
            {
                model: models.contact,
                as: 'contact',
                attributes: ['partnerProposalId','firstName','lastName','email','primaryPhone'],
                include:[{
                    model: models.gen_type,
                    as: 'genType',
                    attributes:['name']
                }, {
                    model: models.partner_proposal,
                    as: 'partnerProposals',
                    include:[ {
                        model: models.partner,
                        as: 'partner',
                        attributes:['name']
                    }]
                },{
                    model: models.lender_proposal,
                    as: 'lenderProposals',
                    include:[ {
                        model: models.lender,
                        as: 'lender',
                        attributes:['name']
                    }]
                },{
                    model: models.user,
                    as: 'users',
                    attributes:['firstName','lastName','roleId','baseline'],
                    include:[ {
                        model: models.role,
                        as: 'role',
                        attributes:['name']
                    }]
                }]
            }
        ]
    });
    const filtered = obj_array.filter(o => o.submittedBy);
    const grouped = _.groupBy(filtered, function(option) {
        if(option.contact) {
            return option.contact.firstName + ' ' + option.contact.lastName;
        } else {
            return option.id
        }
    });


    res.json(grouped);
}


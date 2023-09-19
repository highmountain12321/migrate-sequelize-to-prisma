
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');






exports.context = async function (req, res) {



    const dispositions = await Disposition.find({}).lean();
    const lead_sources = await Lead_Source.find({}).lean();
    const grouped_dispositions = _.chain(dispositions)
        // Group the elements of Array based on `color` property
        .groupBy("group")
        // `key` is group's name (color), `value` is the array of objects
        .map((value, key) => ({ key: key, items: value }))
        .value();

    const grouped_lead_sources = _.chain(lead_sources)
        // Group the elements of Array based on `color` property
        .groupBy("group")
        // `key` is group's name (color), `value` is the array of objects
        .map((value, key) => ({ key: key, items: value }))
        .value();


    res.json({
        dispositions: grouped_dispositions,
        lead_sources: grouped_lead_sources
    })
}

exports.add = async function(req, res,next) {
    const model = req.params.model;




    try {
        res.json({_id: ""})
    } catch (err) {
        next(err);
    }
}
exports.remove = async function(req, res,next) {
    const role = new Disposition(req.body);

    try {
        await role.save();
        res.json({_id: role._id})
    } catch (err) {
        next(err);
    }
}

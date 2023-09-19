/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const moment = require('moment');
const assign = Object.assign;
const _ = require('lodash');
const sequalize = require('../../sequelize');
const {models} = require("../../sequelize");
const {Op} = require("sequelize");

const statusReportForTeam = async (start,end, teamId)=>{
	//'2024-10-01

	const object = await models.user_group.findByPk(teamId);
	const contacts = await object.getContacts();
	const contactIds = contacts.map((m)=>m.id);

	const query = 'SELECT count(*) as count, `name`, oid FROM (\n' +
		'SELECT count(cu.id) as count, `name`, op.id as oid, cu.contactId from contact_updates as cu\n' +
		'INNER JOIN options op ON cu.toId = op.id \n' +
		'WHERE (cu.createdAt BETWEEN "'+start+'" AND "'+end+'" AND cu.contactId IN('+contactIds.toString()+')) \n' +
		'GROUP BY cu.userId,cu.contactId,oid, `name`\n' +
		')t GROUP BY name;';


	return  sequalize.query(query, {
		type: sequalize.QueryTypes.SELECT,
	});
}


const statusReportForOrganization = (start,end, orgId)=>{
	//'2024-10-01
	const query = 'SELECT count(*) as count, `name`, oid, orgId FROM (\n' +
		'SELECT count(cu.id) as count, con.organizationId as orgId, `name`, op.id as oid, cu.contactId from contact_updates as cu\n' +
		'INNER JOIN options op ON cu.toId = op.id \n' +
		'INNER JOIN contacts con ON cu.contactId = con.id \n' +
		'WHERE (cu.createdAt BETWEEN "'+start+'" AND "'+end+'" AND con.organizationId='+orgId+') \n' +
		'GROUP BY cu.userId,cu.contactId,oid, `name`\n' +
		')t GROUP BY name;';
	return  sequalize.query(query, {
		type: sequalize.QueryTypes.SELECT,
	});
}

const statusReport = (start,end)=>{
	//'2024-10-01
	const query = 'SELECT count(*) as count, `name`, oid FROM (\n' +
		'SELECT count(cu.id) as count,`name`, op.id as oid, cu.contactId from contact_updates as cu\n' +
		'INNER JOIN options op ON cu.toId = op.id \n' +
		'WHERE (cu.createdAt BETWEEN "'+start+'" AND "'+end+'")\n' +
		'GROUP BY cu.userId,cu.contactId,oid, `name`\n' +
		')t GROUP BY name;';
	return  sequalize.query(query, {
		type: sequalize.QueryTypes.SELECT,
	});
}
exports.index = async function (req, res) {
	const {orgId, groupId, repId} = req.query;


	const optionModels  = await models.option.findAll({
		attributes:['id','name'],
		where: {
			isActive: true,
			isVisible: true
		},
		order: [
			['order', 'ASC'],
		],
		raw: true
	});

	const week = {
		current : {
			start: moment().startOf('isoWeek').format('YYYY-M-D'),
			stop: moment().endOf('isoWeek').format('YYYY-M-D'),
		},
		prev : {
			start: moment().subtract(1, 'isoWeek').startOf('isoWeek').format('YYYY-M-D'),
			stop: moment().startOf('isoWeek').format('YYYY-M-D'),
		}
	}
	const month = {
		current : {
			start: moment().startOf('month').format('YYYY-M-D'),
			stop: moment().endOf('month').format('YYYY-M-D'),
		},
		prev : {
			start: moment().subtract(1, 'month').startOf('isoWeek').format('YYYY-M-D'),
			stop: moment().subtract(1, 'month').endOf('month').format('YYYY-M-D'),
		}
	}

	if(groupId){
		return res.json({
			statusIds: optionModels,
			current: {
				month :{
					start: month.current.start,
					stop: month.current.stop,
					report: await statusReportForTeam(month.current.start,month.current.stop,groupId)
				},
				week : {
					start: week.current.start,
					stop: week.current.stop,
					report: await statusReportForTeam(week.current.start,week.current.stop,groupId)
				}
			},
			previous: {
				month:{
					start: month.prev.start,
					stop: month.prev.stop,
					report: await statusReportForTeam(month.prev.start,month.prev.stop,groupId)
				},
				week : {
					start: week.prev.start,
					stop: week.prev.stop,
					report: await statusReportForTeam(week.prev.start,week.prev.stop,groupId)
				}
			}
		});
	}


	if(orgId){
		return res.json({
			statusIds: optionModels,
			current: {
				month :{
					start: month.current.start,
					stop: month.current.stop,
					report: await statusReportForOrganization(month.current.start,month.current.stop,orgId)
				},
				week : {
					start: week.current.start,
					stop: week.current.stop,
					report: await statusReportForOrganization(week.current.start,week.current.stop,orgId)
				}
			},
			previous: {
				month:{
					start: month.prev.start,
					stop: month.prev.stop,
					report: await statusReportForOrganization(month.prev.start,month.prev.stop,orgId)
				},
				week : {
					start: week.prev.start,
					stop: week.prev.stop,
					report: await statusReportForOrganization(week.prev.start,week.prev.stop,orgId)
				}
			}
		});
	}



	return res.json({
		statusIds: optionModels,
		current: {
			month :{
				start: month.current.start,
				stop: month.current.stop,
				report: await statusReport(month.current.start,month.current.stop)
			},
			week : {
				start: week.current.start,
				stop: week.current.stop,
				report: await statusReport(week.current.start,week.current.stop)
			}
		},
		previous: {
			month:{
				start: month.prev.start,
				stop: month.prev.stop,
				report: await statusReport(month.prev.start,month.prev.stop)
			},
			week : {
				start: week.prev.start,
				stop: week.prev.stop,
				report: await statusReport(week.prev.start,week.prev.stop)
			}
		}
	});
}


exports.old = async function (req, res) {
	const { value, range } = req.params;
	//console.log(moment().subtract(1, range).format('YYYY-M-D'));
	const dateFormatted = moment().subtract(1, range).format('YYYY-M-D');
	if (value === 'individual') {
		var query = `SELECT SUM(c.system_size) kw,  u.id, 
        CONCAT(u.firstName,' ', u.lastName) as name, count(c.closeDate) sales, count(c.sitDate) sits from users u left join contacts 
        c on c.user1Id = u.id where c.closeDate >= '${dateFormatted}' || c.sitDate >= '${dateFormatted}'  group by u.id`;
	} else {
		var query = `SELECT SUM(c.system_size) kw, t.id, t.name,
        count(c.closeDate) sales, count(c.sitDate) sits from teams t left join users u ON t.id = u.team_id left join contacts 
        c on c.user1Id = u.id where c.closeDate >= '${dateFormatted}' || c.sitDate >= '${dateFormatted}' group by t.id`;
	}
	let count_array = await sequalize.query(query, {
		type: sequalize.QueryTypes.SELECT,
	});

	res.json({
		data: count_array,
	});
};
var leaderboardQuery = (column, from, to, userGroupId, slug = 'close', role = 'closer')=>{
	return `SELECT count(*) as ${column}, oSlug, userId, name, picUrl, userIsActive, roleName, userGroupId FROM (
SELECT ugu.userGroupId as userGroupId, count(cu.id) as ${column}, op.slug as oSlug, ugu.userId as userId,u.isActive as userIsActive, CONCAT(u.firstName,' ', u.lastName) as name,u.picUrl as picUrl, cu.contactId, r.name as roleName  from contact_updates as cu
INNER JOIN options op ON cu.toId = op.id 
INNER JOIN users u ON cu.userId = u.id 
INNER JOIN roles r ON u.roleId = r.id 
INNER JOIN user_group_user ugu ON u.id = ugu.userId 
WHERE ugu.userGroupId=${userGroupId} AND (cu.createdAt BETWEEN '${from}' AND '${to}') AND u.isActive=1 AND (op.slug = '${slug}') AND (r.name = '${role}') 
GROUP BY cu.userId,cu.contactId, op.slug HAVING ${column} > 0
)t GROUP BY userId,oSlug ORDER BY ${column} DESC;`
}



exports.getLeaderboard = async function (req, res) {

	let userGroupId = req.query.userGroupId;
	const typeId = parseInt(req.query.type) || 1;
	let type;
	console.log('WA ',typeId)
	if(!isNaN(typeId) && typeId === 1){
		type = 'Closer';
	}else {
		type = 'Setter';
	}
	let {user} = req.token;

	let role = req.userModel.role.slug;
	let userGroupModel;
	if(!userGroupId){
		const groupModels = await req.userModel.getGroups();
		if(!groupModels || groupModels.length === 0){
			 userGroupModel = await models.user_group.findOne({where:{isDefault:true}});
			 await userGroupModel.addUser(user);
		}else {
			userGroupModel = groupModels[0];
		}
	}else {
		userGroupModel = await models.user_group.findByPk(userGroupId);
	}


	console.log('TYPE ',type);
	const teamModels = await models.user_group.findAll({
		where: {
			isActive: true
		},
		attributes: ['name','id'],
		include :[
			{
			as:'type',
			required:true,
			model: models.user_group_type,
				attributes: ['name','id'],
				where: {
				name: type
				}
		},{
			   required: false,
				attributes: ['createdAt','id'],
				as:'contacts',
				model: models.contact,
				where : {
					isActive:true
				},
				include:[{
					attributes: ['createdAt'],
					model: models.contact_update,
					as: 'updates',
					include: [{
						attributes: ['name'],
						model: models.option,
						as: 'to'
					}]
				}]
			}
		]
	});



	function assign(obj, keyPath, value) {
		lastKeyIndex = keyPath.length-1;
		for (var i = 0; i < lastKeyIndex; ++ i) {
			key = keyPath[i];
			if (!(key in obj)){
				obj[key] = {}
			}
			obj = obj[key];
		}
		if(obj[keyPath[lastKeyIndex]]){
			obj[keyPath[lastKeyIndex]]++;
		}else {
			obj[keyPath[lastKeyIndex]] = value;
		}
	}


	const getDates = (date) =>{
		let day, month, year;
		if(!date){
			 day = moment().date();
			 month = moment().month()+1;
			 year = moment().year();
			return {day,month,year};
		}
		 day = moment(date).date();
		 month = moment(date,).month()+1;
		 year = moment(date).year()
		return {day,month,year};
	}


	const leaderboardReport = {
		array : [],
		teamProfile: {},
		score:{}
	};
	for(let i = 0; i < teamModels.length; i++){
		const teamModel = teamModels[i];
		const teamScore = {
			type: teamModel.type,
			id: teamModel.id,
			description: teamModel.description,
			name: teamModel.name,
			picUrl: teamModel.picUrl,
			report: {
				current: {
					month: {
						Close: 0,
						'Appointment Set': 0
					},
					year: {
						Close: 0,
						'Appointment Set': 0
					},
				},
				previous: {
					month: {
						Close: 0,
						'Appointment Set': 0

					},
					year: {
						Close: 0,
						'Appointment Set': 0
					},
				}
			},
			breakdown:{},
		};
		/* Create the breakdown */
		teamModel.contacts.forEach((contact)=>{
			const contactScore = {};
			if(contact) {
				contact.updates.forEach((update) => {
					if (update && update.to) {
						const {year, month, day} = getDates(update.get('createdAt'));
						const currentDates = getDates();
						const name = update.to.name;
						assign(contactScore, ['report',year, month, day, name], 1);

						if(year === currentDates.year){
							assign(teamScore, ['report','current','year',name], 1);
						}
						if(year === (currentDates.year-1)){
							assign(teamScore, ['report','previous','year','previous',name], 1);
						}
						if(year === currentDates.year && month === currentDates.month){
							assign(teamScore, ['report','current','month',name], 1);
						}

						if(year === currentDates.year && month === (currentDates.month-1)){
							assign(teamScore, ['report','previous','month',name], 1);
						}
					}
				});
				if(Object.keys(contactScore).length > 0) {
					teamScore.breakdown[contact.id] = contactScore;
				}
			}
		});
		leaderboardReport.array.push(teamScore);
	}

	leaderboardReport.array.sort((a, b) => {
		return b.report.current.year.Close < a.report.current.year.Close ? -1 : 0
	});
	if(type === 'Setter'){
		leaderboardReport.array.sort((a, b) => {
			return b.report.current.year['Appointments Set'] < a.report.current.year['Appointments Set'] ? -1 : 0
		});
	}


	return res.json({rows:leaderboardReport.array, typeId});




	const groupContacts = await userGroupModel.getContacts({
		where:{
			isActive:true
		},
		attributes:['id'],
		include:[{
			required:true,
			model: models.contact_update,
			as:'updates',
			include:[{
				attributes:['name'],
				required:true,
				model: models.option,
				as:'to'
			},{
				attributes:['firstName','lastName','id','picUrl'],
				required:true,
				model: models.user,
				as:'user',
				where :{
					isActive:true
				},
				include:[{
					attributes:['slug'],
					required:true,
					model: models.role,
					as:'role',
					where: {
						slug: role
					}
				}]
			}]
		}]
	});
	const leaderboard = {
		array : [],
		profile: {},
		score:{}
	};

	for(let i = 0; i < groupContacts.length; i++){
		const groupContact = groupContacts[i];
		groupContact.updates.forEach((update)=>{
			const month = moment(update.createdAt).month();
			const year = moment(update.createdAt).year();

			if(!leaderboard.profile[update.user.id]) {
				leaderboard.profile[update.user.id] = update.user;
			}
			if(!leaderboard.score[update.user.id]) {
				leaderboard.score[update.user.id] = {
					currentYear: {
						Close: 0,
						'Appointment Set':0
					},
					currentMonth: {
						Close: 0,
						'Appointment Set':0
					},
					prevMonth: {
						Close: 0,
						'Appointment Set':0
					},
					date : {

					}
				}
				leaderboard.score[update.user.id].date[year] = {}
				leaderboard.score[update.user.id].date[year][month] = {}

			}
			if(!leaderboard.score[update.user.id].date[year]) {
				leaderboard.score[update.user.id].date[year] = {}
				leaderboard.score[update.user.id].date[year][month] = {}
			}
			if(!leaderboard.score[update.user.id].date[year][month]) {
				leaderboard.score[update.user.id].date[year][month] = { Close : 0}
			}

			if(!leaderboard.score[update.user.id].date[year][month][update.to.name]) {
				leaderboard.score[update.user.id].date[year][month][update.to.name] = 0;
			}
			if(moment().month() === month){
				if(!leaderboard.score[update.user.id].currentMonth[update.to.name]) {
					leaderboard.score[update.user.id].currentMonth[update.to.name] = 0;
				}
				leaderboard.score[update.user.id].currentMonth[update.to.name]++;
			}
			if(moment().subtract(1,'month').month() === month){
				if(!leaderboard.score[update.user.id].prevMonth[update.to.name]) {
					leaderboard.score[update.user.id].prevMonth[update.to.name] = 0;
				}
				leaderboard.score[update.user.id].prevMonth[update.to.name]++;
			}

			if(moment().year() === year){
				if(!leaderboard.score[update.user.id].currentYear[update.to.name]) {
					leaderboard.score[update.user.id].currentYear[update.to.name] = 0;
				}
				leaderboard.score[update.user.id].currentYear[update.to.name]++;
			}


			leaderboard.score[update.user.id].date[year][month][update.to.name]++

		});
	}
	Object.keys(leaderboard.profile).forEach((key)=>{
		const profile = leaderboard.profile[key];
		const score = leaderboard.score[key];
		leaderboard.array.push({
			profile,
			score
		});
	});
	return res.json({userGroupId, report:leaderboard.array, role});

}





exports.report = async function (req, res) {
	const from = req.query.from ?  moment(req.query.from).format('YYYY-MM-DD') :  moment().startOf('month').format('YYYY-MM-DD');
	const to = req.query.to ?  moment(req.query.to).format('YYYY-MM-DD') :  moment().endOf('month').format('YYYY-MM-DD');
	const type = req.query.type;

	const statusSummary = `SELECT count(*) as count, \`name\` FROM (
SELECT count(cu.id) as count, slug,\`name\`,  cu.contactId from contact_updates as cu
INNER JOIN options op ON cu.toId = op.id 
WHERE (cu.createdAt BETWEEN '2022-10-01' AND '2024-10-01')
GROUP BY cu.userId,cu.contactId, \`name\`
)t GROUP BY slug;`;


	if(type === 'leaderboard') {
		const leaderboardQuery = `
SELECT count(*) as count, slug, userId, name, picUrl, userIsActive FROM (
SELECT count(cu.id) as count, slug, userId,u.isActive as userIsActive, CONCAT(u.firstName,' ', u.lastName) as name,u.picUrl as picUrl, cu.contactId from contact_updates as cu
INNER JOIN options op ON cu.toId = op.id 
INNER JOIN users u ON cu.userId = u.id 
WHERE (cu.createdAt BETWEEN '${from}' AND '${to}')
AND u.isActive=1 AND (slug = 'close' 
OR slug LIKE '%appointment-set%'
OR slug LIKE '%sit%')
GROUP BY cu.userId,cu.contactId, slug HAVING count > 0
)t GROUP BY userId,slug ORDER BY count DESC;
	`

		let queryResults = await sequalize.query(leaderboardQuery, {
			raw: true,
			type: sequalize.QueryTypes.SELECT,
		});

		let grouped_data = _.groupBy(queryResults, 'userId')

		_.each( grouped_data, ( val, key ) => {
			grouped_data[key] = {
				appointment: _.result(_.find(val, function(obj) {
					return obj.slug.indexOf('appointment') > -1
				}), 'count') || 0,
				close: _.result(_.find(val, function(obj) {
					return obj.slug.indexOf('close') > -1
				}), 'count') || 0,
				sit: _.result(_.find(val, function(obj) {
					return obj.slug.indexOf('sit') > -1
				}), 'count') || 0,
				install: _.result(_.find(val, function(obj) {
					return obj.slug.indexOf('install') > -1
				}), 'count') || 0,
				name: _.result(_.find(val, function(obj) {
					return obj.name;
				}), 'name'),
				picUrl: _.result(_.find(val, function(obj) {
					return obj.picUrl;
				}), 'picUrl')
			}
		} );

		return res.json(_.values(grouped_data));


	}

	if(type === 'employeeSummary') {


		// summary count
		const counts = `
	SELECT count(*) as count, slug FROM (
SELECT count(cu.id) as count, slug,  cu.contactId from contact_updates as cu
INNER JOIN options op ON cu.toId = op.id 
WHERE (cu.createdAt BETWEEN '${from}' AND '${to}')
AND cu.userId=${user}
GROUP BY cu.userId,cu.contactId, slug
)t GROUP BY slug`;



		let queryResults = await sequalize.query(counts, {
			raw: true,
			type: sequalize.QueryTypes.SELECT,
		});


		let appointment = 0;
		let sit = 0;
		let close = 0;
		let drop = 0;
		const apt = queryResults.find((f)=> f.slug.indexOf('appointment-set') > -1);
		const cl = queryResults.find((f)=> f.slug.indexOf('close') > -1);
		const dr = queryResults.find((f)=> f.slug.indexOf('drop') > -1);

		if(apt){
			appointment = apt.count
		}
		if(cl){
			close = cl.count
		}
		if(dr){
			drop = dr.count
		}




		return res.json({
			sit,
			close,
			drop,
			appointment,
		});
	}
};

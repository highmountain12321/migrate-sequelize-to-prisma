'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');
const { models } = require('../../sequelize');
const {QueryTypes,Op} = require("sequelize");
const Sequelize = require('sequelize');
const {Services} = require("../services");

exports.listClosingForms = async function(req, res, next) {
    const isActive = req.query.isActive === 'true'; // Parse from query

    try {
        const id = parseInt(req.params.groupId);
        // Assuming userGroupModel is previously loaded into the request object
        const userGroupModel = req.loadedUserGroupModel; 

        const contacts = await prisma.userGroup.findUnique({
            where: { id: id },
            select: {
                contacts: {
                    select: {
                        id: true,
                        closingForms: {
                            where: {
                                isActive: isActive
                            },
                            include: {
                                status: {
                                    select: { name: true }
                                },
                                updates: {
                                    select: {
                                        createdAt: true,
                                        type: {
                                            select: { name: true }
                                        }
                                    }
                                },
                                contact: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        primaryPhone: true,
                                        busName: true,
                                        system: true,
                                        genType: {
                                            select: { name: true }
                                        },
                                        partnerProposals: {
                                            select: {
                                                partner: {
                                                    select: { name: true, id: true }
                                                }
                                            }
                                        },
                                        lenderProposals: {
                                            select: {
                                                lender: {
                                                    select: { name: true }
                                                }
                                            }
                                        },
                                        users: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                                picUrl: true,
                                                role: {
                                                    select: { name: true }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            orderBy: {
                                id: 'desc'
                            }
                        }
                    }
                }
            }
        });

        let closingForms = [];

        for (let contact of contacts.contacts) {
            if (contact.closingForms) {
                closingForms = [...closingForms, ...contact.closingForms];
            }
        }

        res.json({ rows: closingForms, count: closingForms.length });

    } catch (e) {
        console.error(e);
        next(e);
    }
}


exports.list = async function (req, res) {
    const {isActive = true, type, isManager = false, q, name, organizationFilter} = req.query;
    const userModel = req.userModel;

    const where = {
        isActive,
    };

    if (q && q.length > 0) {
        where.OR = Services.Search.teamName(q); // Assuming `Services.Search.teamName` returns an array
    }
    if (name && name.length > 0) {
        where.OR = Services.Search.teamName(name); // Assuming `Services.Search.teamName` returns an array
    }

    const query = {
        where: where,
        select: {
            isActive: true,
            id: true,
            name: true,
            typeId: true,
            isDefault: true,
            description: true,
            type: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            organization: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            id: 'desc'
        }
    };

    if (organizationFilter) {
        if (organizationFilter.toString().indexOf(',') > -1) {
            query.where.organization = {
                id: {
                    in: organizationFilter.split(',')
                }
            };
        } else {
            query.where.organization = {
                id: organizationFilter
            };
        }
    }

    if (type) {
        query.where.type = {
            slug: type
        };
    }

    if (userModel.isAdmin()) {
        const allGroups = await prisma.userGroup.findMany(query);
        res.json(allGroups);
        return;
    }

    if (isManager === true) {
        // The following lines need clarification as Prisma doesn't directly support operations like getManagedGroups
        // You may need custom logic based on your schema
        const managedGroups = await userModel.getManagedGroups(query); 
        const managedGroupsCount = await userModel.countManagedGroups(query);
        res.json({ rows: managedGroups, count: managedGroupsCount });
        return;
    }

    const userGroups = await prisma.userGroup.findMany(query);
    res.json({ rows: userGroups });
    return;
}

const { Prisma } = require('@prisma/client'); // Adjust the import path as necessary

exports.listTypes = async function (req, res) {
    const objArray = await prisma.userGroupType.findMany({
        where: {
            isActive: true
        }
    });
    res.json({ rows: objArray || [], count: objArray ? objArray.length : 0 });
}

exports.listBoards = async function (req, res) {
    const id = req.params.groupId;
    const userGroupModel = req.loadedUserGroupModel;
    const boards = await prisma.board.findMany({
        where: {
            userGroupId: id
        }
    });
    res.json({ rows: boards });
}

exports.createBoard = async function (req, res) {
    // The logic seems to be misnamed. "createBoard" shouldn't list boards.
    // Here's the code that lists boards (as per your provided function):
    const id = req.params.groupId;
    const boards = await prisma.board.findMany({
        where: {
            userGroupId: id
        }
    });
    res.json({ rows: boards });
}

exports.listUsers = async function (req, res) {
    const id = req.params.groupId;
    const { role, isActive = true, q } = req.query;

    const where = {
        isActive,
    };

    if (q && q.length > 1) {
        where.OR = Services.Search.query(q); // Assuming `Services.Search.query` returns an array
    }

    const query = {
        orderBy: {
            id: 'desc'
        },
        where: where,
        select: {
            createdAt: true,
            id: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            email: true,
            picUrl: true,
            role: {
                select: {
                    name: true
                }
            }
        }
    };

    if (role) {
        query.where.role = {
            slug: role
        };
    }

    const rows = await prisma.userGroup.findMany(query);
    const count = await prisma.userGroup.count(query);

    res.json({ rows, count });
}

exports.listManagers = async function (req, res) {
    const { isActive = true, q } = req.query;

    const where = {
        isActive,
    };

    if (q && q.length > 1) {
        where.OR = Services.Search.query(q); // Assuming `Services.Search.query` returns an array
    }

    const query = {
        where: where,
        select: {
            createdAt: true,
            id: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            email: true,
            picUrl: true,
            role: {
                select: {
                    name: true
                }
            }
        }
    };

    const rows = await prisma.userGroup.findMany(query);
    const count = await prisma.userGroup.count(query);

    res.json({ rows, count });
}



exports.showContact = async function(req, res, next) {
    const groupId = req.params.groupId;
    const contactId = req.params.contactId;
    const { user, role } = req.token;

    try {
        const contactModel = await prisma.contact.findUnique({
            where: {
                id: parseInt(contactId)
            },
            orderBy: {
                id: 'desc'
            },
            select: {
                documents: {
                    select: {
                        type: {
                            select: {
                                name: true,
                                slug: true
                            }
                        }
                    }
                },
                lenderProposals: {
                    select: {
                        months: true,
                        years: true,
                        rate: true,
                        loanAmount: true,
                        systemPrice: true,
                        isCash: true,
                        cashAmount: true,
                        id: true,
                        ppwNet: true,
                        ppwGross: true,
                        systemSize: true,
                        lender: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                partnerProposals: {
                    select: {
                        url: true,
                        partner: {
                            select: {
                                id: true,
                                name: true,
                                userId: true
                            }
                        }
                    }
                },
                updates: {
                    select: {
                        note: true,
                        createdAt: true,
                        id: true,
                        from: {
                            select: {
                                name: true,
                                id: true
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        to: {
                            select: {
                                name: true,
                                id: true,
                                slug: true
                            }
                        }
                    }
                },
                genType: {
                    select: {
                        name: true,
                        slug: true,
                        id: true
                    }
                },
                roofType: {
                    select: {
                        name: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        picUrl: true,
                        primaryPhone: true,
                        email: true,
                        role: {
                            select: {
                                name: true,
                                slug: true
                            }
                        }
                    }
                },
                source: true, 
                type: true, 
                hoa: true,
                appointments: {
                    select: {
                        user: true
                    }
                }
            }
        });

        if (!contactModel) {
            return next({ message: 'Homeowner not found' });
        }

        if (!contactModel.users) {
            return next({ message: 'No users assigned' });
        }

        const userIds = contactModel.users.map(u => parseFloat(u.id));

        res.status(200).json(contactModel);

    } catch (error) {
        console.error(error);
        next(error);
    }
}


exports.listCounts = async function(req, res, next) {
    const groupId = req.params.groupId;

    try {
        const contactCount = await prisma.userGroup.findUnique({
            where: {
                id: parseInt(groupId)
            },
            select: {
                id: true,
                contacts: {
                    where: {
                        isActive: true
                    },
                    select: {
                        id: true
                    }
                }
            }
        });

        const countResult = {
            id: contactCount.id,
            contactCount: contactCount.contacts.length
        };

        res.status(200).json(countResult);
    } catch (error) {
        console.error(error);
        next(error);
    }
}


exports.listContacts = async function(req, res, next) {
    const loadedUserGroupModelId = req.loadedUserGroupModel.id;
    const { stageId, propertyType, isActive = true, limit = 1000, offset = 0, q } = req.query;

    const where = {
        isActive: isActive,
        userGroupId: parseInt(loadedUserGroupModelId)
    };

    // For the `q` condition, Prisma's equivalent to Sequelize's Op.or is using the `OR` key
    if (q && q.length > 1) {
        const searchConditions = Services.Search.query(q); // Assuming this function returns an array of conditions
        where.OR = searchConditions; // This will implement the OR logic for Prisma
    }

    if (propertyType) {
        if (propertyType.toLowerCase() === 'commercial') {
            where.propertyTypeId = 2;
        } else if (propertyType.toLowerCase() === 'residential') {
            where.propertyTypeId = 1;
        }
    }

    const queryOptions = {
        where: where,
        take: limit,
        skip: offset,
        orderBy: {
            id: 'desc'
        },
        include: {
            updates: {
                orderBy: {
                    id: 'desc'
                },
                include: {
                    to: true
                }
            },
            stage: true,
            users: {
                select: {
                    firstName: true,
                    lastName: true,
                    primaryPhone: true,
                    email: true,
                    roleId: true,
                    id: true,
                    picUrl: true,
                    role: true
                }
            }
        }
    };

    if (stageId) {
        queryOptions.where.stageId = parseInt(stageId);
    }

    try {
        const contacts = await prisma.contact.findMany(queryOptions);
        const count = await prisma.contact.count({
            where: queryOptions.where
        });

        res.status(200).json({ rows: contacts, count: count });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


exports.count = async function(req, res, next) {
    try {
        const count = await prisma.userGroup.count();
        res.status(200).json({
            count: count
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};



exports.create = async function(req, res, next) {
    const group = req.body;
    try {
        if (group.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const newGroupModel = await prisma.userGroup.create({
                data: group,
                include: {
                    organization: true
                }
            });
            if (newGroupModel.isDefault) {
                await prisma.userGroup.updateMany({
                    where: {
                        NOT: {
                            id: newGroupModel.id
                        }
                    },
                    data: {
                        isDefault: false
                    }
                });
            }
            const reloadedGroup = await prisma.userGroup.findUnique({
                where: { id: newGroupModel.id },
                include: { organization: true }
            });
            res.status(201).json(reloadedGroup);
        }
    } catch (e) {
        console.log(e);
        next({ message: e.message });
    }
};



exports.patchUser = async function(req, res, next) {
    const groupId = parseInt(req.params.groupId, 10);
    const obj = req.body;
    let userId = obj.add;
    if (obj.remove) {
        userId = obj.remove;
    }
    try {
        const groupModel = await prisma.userGroup.findUnique({ where: { id: groupId } });
        if (!groupModel || groupModel.isActive === false) {
            return next({ message: 'Group is not active' });
        }
        const userModel = await prisma.user.findUnique({ where: { id: userId } });
        if (!userModel || userModel.isActive === false) {
            return next({ message: 'User is not active' });
        }
        await prisma.user.update({
            where: { id: userId },
            data: { organizationId: groupModel.organizationId }
        });
        if (obj.add) {
            // Assuming a many-to-many relation
            await prisma.userGroup.update({
                where: { id: groupId },
                data: {
                    users: {
                        connect: { id: userId }
                    }
                }
            });
        }
        if (obj.remove) {
            // Assuming a many-to-many relation
            await prisma.userGroup.update({
                where: { id: groupId },
                data: {
                    users: {
                        disconnect: { id: userId }
                    }
                }
            });
        }
        res.status(201).json(groupModel);
    } catch (e) {
        next({ message: e.message });
    }
};

exports.patchManager = async function(req, res, next) {
    const groupId = parseInt(req.params.groupId, 10);
    const obj = req.body;
    let managerId = obj.add;
    if (obj.remove) {
        managerId = obj.remove;
    }
    try {
        const groupModel = await prisma.userGroup.findUnique({ where: { id: groupId } });
        if (!groupModel || groupModel.isActive === false) {
            return next({ message: 'Group is not active' });
        }
        const managerModel = await prisma.user.findUnique({ where: { id: managerId } });
        if (!managerModel || managerModel.isActive === false) {
            return next({ message: 'Manager is not active' });
        }
        await prisma.user.update({
            where: { id: managerId },
            data: { organizationId: groupModel.organizationId }
        });
        if (obj.add) {
            // Assuming a many-to-many relation between userGroup and managers
            await prisma.userGroup.update({
                where: { id: groupId },
                data: {
                    managers: { // Assuming "managers" is the relation field in your Prisma schema.
                        connect: { id: managerId }
                    }
                }
            });
        }
        if (obj.remove) {
            await prisma.userGroup.update({
                where: { id: groupId },
                data: {
                    managers: {
                        disconnect: { id: managerId }
                    }
                }
            });
        }
        res.status(201).json(groupModel);
    } catch (e) {
        next({ message: e.message });
    }
};


exports.patchContact = async function(req, res, next) {
    const groupId = parseInt(req.params.groupId, 10);
    const obj = req.body;
    let id = obj.add;
    if(obj.remove) {
        id = obj.remove;
    }
    
    try {
        const groupModel = await prisma.userGroup.findUnique({ where: { id: groupId } });
        if(!groupModel || !groupModel.isActive) {
            return next({message: 'Group is not active'});
        }
        
        const idArray = Array.isArray(id) ? id : [id];
        for(let i = 0; i < idArray.length; i++) {
            const contactModel = await prisma.contact.findUnique({ where: { id: idArray[i] } });
            if(!contactModel || !contactModel.isActive) {
                return next({message: 'Contact is not active'});
            }
            
            if(obj.add) {
                // Assuming a many-to-many relation between userGroup and contacts
                await prisma.userGroup.update({
                    where: { id: groupId },
                    data: {
                        contacts: { 
                            connect: { id: idArray[i] }
                        }
                    }
                });
                
                // Similarly, assuming a many-to-many relation from contact's side
                await prisma.contact.update({
                    where: { id: idArray[i] },
                    data: {
                        groups: { 
                            connect: { id: groupId }
                        }
                    }
                });
            }
            
            if(obj.remove) {
                await prisma.userGroup.update({
                    where: { id: groupId },
                    data: {
                        contacts: { 
                            disconnect: { id: idArray[i] }
                        }
                    }
                });
                
                // Similarly, assuming a many-to-many relation from contact's side
                await prisma.contact.update({
                    where: { id: idArray[i] },
                    data: {
                        groups: { 
                            disconnect: { id: groupId }
                        }
                    }
                });
            }
        }
        res.status(201).json(groupModel);
    } catch(e) {
        next({message: e.message});
    }
};

// deleteUser
exports.deleteUser = async function(req, res, next) {
    const groupId = parseInt(req.params.groupId, 10);
    const userId = parseInt(req.params.userId, 10);
    try {
        const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
        if(!group || !group.isActive) {
            return next({message: 'Group is not active'});
        }

        // Disconnect the user from the group
        await prisma.userGroup.update({
            where: { id: groupId },
            data: {
                users: {
                    disconnect: { id: userId }
                }
            }
        });

        res.status(201).json(group);
    } catch(e) {
        next({message: e.message});
    }
}

// deleteContact
exports.deleteContact = async function(req, res, next) {
    const groupId = parseInt(req.params.groupId, 10);
    const contactId = parseInt(req.params.contactId, 10);

    try {
        const group = await prisma.userGroup.findUnique({ where: { id: groupId } });
        if(!group || !group.isActive) {
            return next({message: 'Group is not active'});
        }

        // Disconnect the contact from the group
        await prisma.userGroup.update({
            where: { id: groupId },
            data: {
                contacts: {
                    disconnect: { id: contactId }
                }
            }
        });

        res.status(201).json(group);
    } catch(e) {
        next({message: e.message});
    }
}

// createContact
exports.createContact = async function(req, res, next) {
    const groupId = parseInt(req.params.groupId, 10);
    const obj = req.body;

    try {
        const groupModel = await prisma.userGroup.findUnique({ where: { id: groupId } });
        if(!groupModel || !groupModel.isActive) {
            return next({message: 'Group is not active'});
        }

        const contactModel = await prisma.contact.findUnique({ where: { id: obj.contactId } });
        if(!contactModel || !contactModel.isActive) {
            return next({message: 'Contact is not active'});
        }

        // Link the contact to the group
        await prisma.userGroup.update({
            where: { id: groupId },
            data: {
                contacts: {
                    connect: { id: contactModel.id }
                }
            }
        });

        // Update the organizationId of the contact
        await prisma.contact.update({
            where: { id: contactModel.id },
            data: {
                organizationId: groupModel.organizationId
            }
        });

        res.status(201).json(groupModel);
    } catch(e) {
        next({message: e.message});
    }
};


// update
exports.update = async function(req, res, next) {
    const id = parseInt(req.params.groupId, 10);
    const body = req.body;

    if(body.isDefault === true) {
        await prisma.userGroup.updateMany({
            where: { isDefault: true },
            data: { isDefault: false }
        });
    }

    if(body.isDefault === false) {
        const userGroups = await prisma.userGroup.findMany({ where: { isDefault: true } });
        if(userGroups.length === 0) {
            return next({message: 'At least 1 user team must be default'});
        }
    }

    const updatedUserGroup = await prisma.userGroup.update({
        where: { id: id },
        data: body,
        include: {
            organization: true
        }
    });

    if(body.organization) {
        await prisma.userGroup.update({
            where: { id: id },
            data: {
                organizationId: body.organization.id
            }
        });
    }

    res.status(201).json(updatedUserGroup);
}

// show
exports.show = async function(req, res) {
    const id = parseInt(req.params.groupId, 10);
    const userGroup = await prisma.userGroup.findUnique({
        where: { id: id },
        include: {
            organization: true
        }
    });

    res.status(200).json(userGroup);
}

// destroy
exports.destroy = async function(req, res, next) {
    try {
        const id = parseInt(req.params.groupId, 10);
        const deletedUserGroup = await prisma.userGroup.delete({ where: { id: id } });
        res.json({ data: deletedUserGroup });
    } catch(e) {
        console.log(e);
        next(e);
    }
}

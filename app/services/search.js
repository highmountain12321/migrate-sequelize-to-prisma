const {Op} = require("sequelize");


exports.statusFilter = (status) => {
    if(!status){
        return false;
    }
    return status.split(',').map((f) => {
        return {
            slug: f
        }
    });
}


exports.repName = (searchText) => {
    const [firstName, lastName] = searchText.split(' ');
    const obj = {
        firstName: {
            [Op.substring]: firstName
        }
    }
    if(lastName){
        obj.lastName = {
            [Op.substring]: lastName
        }
    }
    return obj;

}

exports.teamName = (searchText) => {
        return {
            name: {
                [Op.like]: `%${searchText}%`
            }
        }

}
exports.query = (searchText,propertyTypeId = 1) => {
    let isCommercial = false;
    console.log('HEREE ',propertyTypeId)
    if(propertyTypeId && propertyTypeId === 2){
        isCommercial = true;
    }
    console.log('HEREE 2',propertyTypeId)

    const where = {};
    where[Op.or] = [];

    console.log('SEARCH '+isCommercial,searchText);
    if(!searchText) {
        return false;
    }


    const isNumeric = (num) => (typeof(num) === 'number' || typeof(num) === "string" && num.trim() !== '') && !isNaN(num);



    if(isNumeric(searchText)){
        where[Op.or].push({
            primaryPhone: {
                [Op.like]: `%${searchText}%`
            }
        });
        return where[Op.or];
    }

    let text = searchText.trim();

    if(isCommercial){
        where[Op.or].push({
            busName: {
                [Op.like]: `%${text}%`
            }
        });
        return where[Op.or]
    }


       let phone = false;
    // tslint:disable-next-line:radix
        const isPhone = parseInt(text);
        console.log('IS  PHONE ',isPhone);
        if(!isNaN(isPhone)){
            phone = isPhone;
        }
        console.log('PEN ',phone);

        if(text.indexOf('@') > -1){
            where[Op.or].push({
                email: {
                    [Op.like]: `%${text}%`
                }
            });
            return where[Op.or];
        }
        if(phone){
            where[Op.or].push({
                primaryPhone: {
                    [Op.like]: `%${phone}%`
                }
            });
            return where[Op.or];
        }
        if(text.match(' ')){
            const names = text.split(' ');
            const firstName = names[0];
            const lastName = names[1];
            if(firstName.length > 0) {
                where[Op.or].push({
                    firstName: {
                        [Op.like]: `%${firstName}%`
                    }
                });
            }
            if(lastName.length > 0) {
                where[Op.or].push({
                    lastName: {
                        [Op.like]: `%${lastName}%`
                    }
                });
            }
            return where[Op.or];
        }else {
            where[Op.or].push({
                firstName: {
                    [Op.like]: `%${text}%`
                }
            });
            where[Op.or].push({
                lastName: {
                    [Op.like]: `%${text}%`
                }
            });
            return where[Op.or];
        }
}

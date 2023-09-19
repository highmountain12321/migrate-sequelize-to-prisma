//Player.belongsTo(Team)  // `teamId` will be added on Player / Source model
///Coach.hasOne(Team)  // `coachId` will be added on Team / Target model

function applyExtraSetup(sequelize) {
    const {
        order,
        order_status,
        order_type,
        contact_action,
        contact_action_type,
        contact_automation_run,
        property_type,
        organization,
        resource,
        resource_category,
        closingform_comment,
        closingform_comment_type,
        contact_comment,
        meter,
        tenant,
        app_event,
        app_event_level,
        app_event_type,
        app_event_category,
        manufacturer,
        equipment_residential_inverter,
        equipment_residential_battery,
        equipment_residential_module,
        login,
        note,
        activity,
        activity_type,
        closing_form_update_type,
        closing_form_update,
        roof_type,
        api_key,
        integration,
        calendar,
        design_request,
        product_panel_type,
        product_panel,
        contact_update,appointment_type,
        solar_incentive,
        incentive,
        incentive_type,
        promotion,
        promotion_type,
        adder,
        contact_source,
        contact_system,
        document_type,
        closing_form,
        closing_form_status,
        contact_type, contact_stage,gen_type, role, lender,
        product,
        product_type,
        product_brand,
        panel_manufacturer,
        service,task, document,user, appointment, user_group,user_group_type, contact,hoa,
        partner,
        partner_sector,
        partner_type,
        partner_proposal,
        lender_proposal,
        canvas_user_areas, canvas_area_coords, option, zone, service_area, state,
        auto_automation,
        contact_event,
        contact_event_type,
        auto_event_trigger,
        auto_event_trigger_type,
        auto_action,
        auto_action_type,
        app_phone,
        app_email,
        auto_automation_log,
        project,
        project_board,
        project_comment,
        project_attachment,
        project_attachment_type,
        project_label,
        project_lane
    } = sequelize.models;


    organization.hasMany(project_board, {
        as: "boards",
    });
    organization.hasMany(project, {
        as: "projects",
    });
    user_group.hasMany(project, {
        as: "projects",
    });

    user_group.hasMany(project_board, {
        as: "boards",
    });



    project.belongsTo(project_lane, {as: "lane"});
    project.belongsTo(project_board, {as: "board"});
    project_lane.belongsTo(project_board, {as: "board",foreignKey: "projectBoardId"});
    project_lane.hasMany(project, {as: "projects"});


    project_board.hasMany(project_lane, {as: "lanes", foreignKey: "projectBoardId"});
    project_board.belongsTo(user, {as: 'owner'});
    project_board.belongsTo(user_group, {as: "userGroup"});



    project.belongsTo(contact, {as: 'contact'});
    project.belongsTo(user, {as: 'owner'});

    project.belongsToMany(user, {
        through: "project_user_contributor",
        foreignKey: "projectId",
        as: "contributors",
    });
    project.belongsToMany(project_attachment, {
        as: "attachments",
        through: "project_attachment",
        foreignKey: "projectId",
    });
    project_attachment.belongsTo(project_attachment_type, {as: "type"});
    project.hasMany(project_label, {as: "labels"});

    project.hasMany(project_comment, {as: "comments"});
    project_comment.belongsTo(user, {as: "rep"});


    project.belongsToMany(user, {
        through: "project_user",
        as: "reps",
        foreignKey: "projectId",
    });

    user.belongsToMany(project, {
        through: "project_user",
        as: "projects",
        foreignKey: "userId",
    });
    contact.belongsTo(project, {as: "project"});


    organization.hasMany(order,{as:'orders',constraints: false});
    user.hasMany(order,{as:'orders',constraints: false});
    order.belongsTo(order_status,{as:'status',foreignKey: 'statusId',constraints: false});
    order.belongsTo(order_type,{as:'type',foreignKey: 'typeId',constraints: false});


    contact.belongsTo(order,{as:'order', foreignKey: 'genTypeId', constraints: false});
    order.belongsTo(user,{as:'user',constraints: false});
    order.belongsTo(user,{as:'filledBy', foreignKey: 'filledById', constraints: false});



    contact.belongsTo(gen_type,{as:'genType', foreignKey: 'genTypeId', constraints: false});
    closing_form.belongsTo(closing_form_status,{as:'status',foreignKey: 'statusId',constraints: false});

        closing_form.hasMany(closingform_comment,{as:'comments',constraints: false});
        user.hasMany(closingform_comment,{as:'closingform_comments'});
        closingform_comment_type.hasOne(closingform_comment,{as:'type'});
        closingform_comment.belongsTo(user,{as:'user'});



    contact.hasMany(contact_comment,{as:'comments',constraints: false});
    contact.hasMany(contact_automation_run,{as:'automation_runs',constraints: false});
    contact_automation_run.belongsTo(auto_automation, {as:'automation', constraints: false});
  ///  auto_automation.hasMany(contact_automation_run,{as:'contact_automation_runs',constraints: false});


    contact.hasMany(contact_action,{as:'actions',constraints: false});
    contact_action.belongsTo(contact_action_type, {as:'type', constraints: false});


    user.hasMany(contact_comment,{as:'contact_comments'});
    contact_comment.belongsTo(user,{as:'user'});

    contact.hasMany(meter,{as:'meters',constraints: false});

    closing_form.hasMany(closing_form_update,{as:'updates',constraints: false});

    contact.hasMany(contact_update,{as:'updates', foreignKey: 'contactId', constraints: false});
    user.hasMany(contact_update,{as:'updates', foreignKey: 'userId', constraints: false});

    contact_update.belongsTo(user,{as:'user', foreignKey: 'userId', constraints: false});

    user.hasMany(app_phone,{as:'app_phones'});
    user.hasMany(app_email,{as:'app_emails'});

    user.hasMany(auto_automation,{as:'automations'});
    auto_automation.belongsTo(contact_source, {as:'contactSource', constraints: false});
    auto_automation.belongsTo(user, {as:'targetUser', constraints: false});
    auto_automation.belongsTo(user_group, {as:'targetGroup', constraints: false});
    auto_automation.belongsTo(user, {as:'creator', constraints: false});
    auto_automation.belongsTo(app_phone, {as:'phone', constraints: false});
    auto_automation.belongsTo(app_email, {as:'email', constraints: false});
    auto_automation.belongsTo(auto_action, {as:'action', constraints: false});
    auto_action.belongsTo(auto_action_type, {as:'type', constraints: false});
    auto_automation.belongsTo(auto_event_trigger, {as:'trigger', constraints: false});
    auto_event_trigger.belongsTo(auto_event_trigger_type, {as:'type', constraints: false});

    auto_event_trigger.belongsToMany(auto_action, {
        through: "auto_event_trigger_auto_action",
        as: "actions",
        foreignKey: "autoEventTriggerId",
    });


    auto_automation.hasMany(auto_automation_log,{as:'logs'});



   contact_event_type.hasOne(contact_event,{as:'type'});

    contact.hasMany(contact_event,{as:'events'});
    user.hasMany(contact_event,{as:'events'});


  //  partner.hasMany(partner_sector,{as:'sectors'});

    tenant.belongsToMany(user, {
        through: "tenant_user",
        as: "users"
    });
    user.belongsToMany(tenant, {
        through: "tenant_user",
        as: "tenants"
    });

    partner_sector.belongsToMany(partner, {
        through: "partner_partner_sector",
        as: "partners",
        foreignKey: "partner_sector_id",
    });

    partner.belongsToMany(partner_sector, {
        through: "partner_partner_sector",
        as: "sectors",
        foreignKey: "partner_id",
    });

    partner.belongsTo(partner_type, {as: 'type'});

    lender.belongsToMany(partner, {
        through: "lender_partner",
        as: "partners",
        foreignKey: "lender_id",
    });

    partner.belongsToMany(lender, {
        through: "lender_partner",
        as: "lenders",
        foreignKey: "partner_id",
    });

    user.hasMany(closing_form,{as: 'closingForms', foreignKey:'submittedById'});

    partner.hasMany(closing_form,{as: 'closingForms'});
    contact.hasMany(closing_form,{as: 'closingForms'})

    closing_form.belongsToMany(user, {
        through: "user_closingform",
        as: "users",
        foreignKey: "closingform_id",
    });

    product_panel.belongsTo(panel_manufacturer,{as: 'manufacturer'});
    product_panel.belongsTo(product_panel_type, {as: 'type'});

    user.hasMany(appointment, {as:"appointments",constraints:false});

    contact.hasMany(appointment, {as:"appointments",constraints:false});

    appointment.belongsTo(contact,{as:'contact', constraints:false});

    appointment.belongsTo(user, {as: 'user'});
    appointment.belongsTo(appointment_type, {as: 'type'});

    closing_form_update.belongsTo(closing_form_update_type, {as: 'type',  constraints:false});
    closing_form_update.belongsTo(closing_form,{as:'closing_form', constraints:false});
    closing_form_update.belongsTo(user,{as:'user'});
    closing_form.belongsTo(closing_form_update,{as:'update'});

    contact_update.belongsTo(option, {as: 'to'});
    contact_update.belongsTo(appointment, {as: 'appointment'});

   // contact.belongsTo(contact_update, {as: 'update',constraints:false});


    document.belongsTo(partner,{as:'partner'});

    document.belongsTo(contact,{as:'contact'});
    promotion.belongsTo(contact,{as:'contact'});
    promotion.belongsTo(user,{as:'user'});
    promotion.belongsTo(promotion_type,{as:'type'});
    contact.hasMany(promotion,{as:'promotions'});
    contact.hasMany(solar_incentive,{as:'incentives'});

    user.hasMany(promotion,{as:'promotions'});

    user.hasMany(activity,{as:'activities'});

    contact.hasMany(adder,{as:'adders'});
    contact.hasMany(note,{as:'notes'});
    user.hasMany(note,{as:'notes'});

    adder.belongsTo(contact,{as:'contact'});
    adder.belongsTo(user,{as:'user'});

    note.belongsTo(contact,{as:'contact'});
    note.belongsTo(user,{as:'user'});

    service_area.belongsTo(state, {as: 'state'});
    service_area.belongsTo(partner, {as: 'partner'});

    state.hasMany(service_area, {as: 'areas'});

    partner.hasMany(service_area,{as: 'areas'})

    zone.belongsTo(partner, {as: 'partner'});
    zone.belongsTo(lender, {as: 'lender'});
    partner.hasMany(zone,{as: 'zones'})

    user.belongsTo(partner, {as: 'partner',constraints:true});
    partner.belongsTo(user, {as: 'user',constraints:false});

    task.belongsTo(contact);
    task.belongsTo(user, {as: 'assigned_to'});
    task.belongsTo(user, {as: 'assigned_by'});



    manufacturer.hasOne(equipment_residential_battery,{as:'manufacturer','foreignKey':'manufacturer_id'});
    equipment_residential_module.belongsTo(manufacturer, {as:'manufacturer','foreignKey':'manufacturer_id'});
    equipment_residential_inverter.belongsTo(manufacturer, {as:'manufacturer','foreignKey':'manufacturer_id'});

    equipment_residential_inverter.belongsToMany(partner, {
        through: "equipment_residential_inverter_partner",
        as: "partners",
        foreignKey: "module_id",
    });

    partner.belongsToMany(equipment_residential_inverter, {
        through: "equipment_residential_inverter_partner",
        as: "inverters",
        foreignKey: "partner_id",
    });

    equipment_residential_module.belongsToMany(partner, {
        through: "equipment_residential_module_partner",
        as: "partners",
        foreignKey: "module_id",
    });

    partner.belongsToMany(equipment_residential_module, {
        through: "equipment_residential_module_partner",
        as: "modules",
        foreignKey: "partner_id",
    });

    equipment_residential_battery.belongsToMany(partner, {
        through: "equipment_residential_battery_partner",
        as: "partners",
        foreignKey: "battery_id",
    });

    partner.belongsToMany(equipment_residential_battery, {
        through: "equipment_residential_battery_partner",
        as: "batteries",
        foreignKey: "partner_id",
    });

    contact.hasOne(contact_system, {as: 'system', foreignKey:'contactId'});

    design_request.belongsTo(contact, {as: "contact"});
    design_request.belongsTo(partner, {as: "partner"});
    design_request.belongsTo(user, {as: "requested_by"});

    app_event.belongsTo(app_event_level,{as:'level', constraints: false});
    app_event.belongsTo(app_event_type,{as:'type', constraints: false});
    app_event_type.belongsTo(app_event_category,{as:'category', constraints: false});

    contact.hasMany(app_event,{as:'app_events'});
    user.hasMany(app_event,{as:'app_events'});
    closing_form.hasMany(app_event,{as:'app_events'});

    partner.hasMany(partner_proposal, {as: "proposals", foreignKey:'partnerId'});
    contact.hasMany(partner_proposal, {as: "partnerProposals", foreignKey:'contactId'});
    contact.hasMany(lender_proposal, {as: "lenderProposals"});

    partner.hasMany(document, {as: 'documents'});
    resource.belongsTo(resource_category, {as: "category"});

    document.belongsTo(document_type, {as: "type"});


    user.hasMany(login,{as:'logins'});
    login.belongsTo(user, {as: "user"});
    login.belongsTo(user, {as: "manager"});

    contact.belongsTo(user, {as: "assigned_by"});
    contact.belongsTo(contact_source, {as: "source"});
    api_key.belongsTo(contact_source, {as: "source"});


    contact.belongsTo(contact_type, {as: "type"});
    contact.belongsTo(contact_stage, {as: "stage"});

    activity.belongsTo(activity_type, {as: "type"});

    closing_form.belongsTo(partner, {as: "partner"});
    closing_form.belongsTo(contact, {as: "contact"});

    contact.belongsTo(hoa, {as: "hoa"});
    contact.belongsTo(roof_type, {as: "roofType"});

    user.belongsTo(user_group);
    api_key.belongsTo(organization, {as: "organization",foreignKey:'' +
            ''});
    api_key.belongsTo(user_group, {as: "group",foreignKey:'userGroupId'});
      api_key.belongsTo(user, {as: "user"});

//userGroupId
    //user.hasMany(contact, {as: 'leads', constraints:false});
  //  contact.belongsToMany(user, {as: 'users', constraints:false});

    contact.belongsToMany(user, {
        through: "contact_user",
        as: "users",
        foreignKey: "contactId",
        constraints: false
    });

    user.belongsToMany(contact, {
        through: "contact_user",
        as: "contacts",
        foreignKey: "userId",
        constraints: false
    });

    user_group.belongsToMany(user, {
        through: "user_group_manager",
        as: "managers",
        foreignKey: "userGroupId",
    });

    user.belongsToMany(user_group, {
        through: "user_group_manager",
        as: "managedGroups",
        foreignKey: "userId",
    });

    user_group.belongsToMany(user, {
        through: "user_group_user",
        as: "users",
        foreignKey: "userGroupId",
    });

    user_group.belongsToMany(user, {
        through: "user_group_user",
        as: "closers",
        foreignKey: "userGroupId",
    });

    user_group.belongsToMany(user, {
        through: "user_group_user",
        as: "setters",
        foreignKey: "userGroupId",
    });

    user.belongsToMany(user_group, {
        through: "user_group_user",
        as: "groups",
        foreignKey: "userId",
    });

    user_group.belongsTo(user_group_type, {as: 'type'});

    contact.belongsToMany(user_group, {
        through: "user_group_contact",
        as: "groups",
        foreignKey: "contactId",
    });

    user_group.belongsToMany(contact, {
        through: "user_group_contact",
        as: "contacts",
        foreignKey: "userGroupId",
    });

    user.hasMany(api_key, {as: 'api_keys'});

    user.hasMany(integration, {as: 'integrations'});

    user.hasMany(calendar, {as: 'calendars'});

    user.hasMany(resource, {as: 'resources'});

    user.hasMany(document, {as: 'documents'});

    contact.hasMany(document, {as: 'documents'});

    user.hasMany(task, {as: 'tasks'});
    user.belongsTo(role,{as: 'role'});
    product.belongsTo(product_brand,{as: 'brand'});
    product.belongsTo(panel_manufacturer,{as: 'manufacturer'});
    product.belongsTo(product_type,{as: 'type'});

    partner.hasMany(product, {as: 'products',constraint:false});
    partner.hasMany(service, {as: 'services', constraint:false});

    user.hasOne(user_group, {as: 'manager',constraints:false});
    user_group.belongsTo(zone);
   // user_group.hasMany(user, {as:'users'})

    incentive.belongsTo(incentive_type,{as:'type'});

    partner_proposal.belongsTo(partner,{constraints:false});
    partner_proposal.belongsTo(user, {as: 'submitted_by'});

    lender_proposal.belongsTo(contact,{constraints:false});
    lender_proposal.belongsTo(lender,{constraints:false});
    lender_proposal.belongsTo(user, {as: 'submitted_by'});

    canvas_user_areas.hasMany(canvas_area_coords, {as: 'coordinates', foreignKey: 'canvas_user_area_id'});
    user.hasMany(canvas_user_areas);




    ///organizations
    organization.hasMany(contact, {
        as: "contacts",
    });
    contact.belongsTo(organization,{as:'organization', constraints: false})
    contact.belongsTo(property_type,{as:'propertyType', constraints: false})



    organization.hasMany(user, {
        as: "users",
    });
    user.belongsTo(organization,{as:'organization', constraints: false});
    organization.hasMany(user_group, {
        as: "teams",
    });
    user_group.belongsTo(organization,{as:'organization', constraints: false});

    organization.hasOne(user_group,{as:'organization', constraints: false});

    organization.hasMany(closing_form, {
        as: "closingforms",
    });
    closing_form.belongsTo(organization,{as:'organization', constraints: false});
}

module.exports = {applyExtraSetup};

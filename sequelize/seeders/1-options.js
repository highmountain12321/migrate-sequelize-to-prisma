'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const forceSync = async () => {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await queryInterface.sequelize.sync({ force: true });
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); // setting the flag back for security
    };

    await forceSync();


    const documentTypes = [{
      name: 'Utility Bill',
      slug: 'utility-bill',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Drivers License',
      slug: 'drivers-license',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Homeowner Insurance',
      slug: 'homeowner-insurance',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Loan Documents',
      slug: 'loan-documents',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Contact Agreement',
      slug: 'contact-agreement',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Solar Design',
      slug: 'solar-design',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default'
    },{
      name: 'Other',
      slug: 'other',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default'
    }];

    const appointmentTypes = [{
       name: 'Zoom',
        slug: 'zoom',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        add:15
    },{
      name: 'Phone Call',
      slug: 'phone-call',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
      add:15
    },{
      name: 'In House',
      slug: 'in-house',
      isDefault: false,
      isActive: true,
      order:1,
      group:'default',
      add:60
    }];


    const contactSources = [{
      name: 'Canvassing',
      slug: 'canvassing',
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Phone',
      slug: 'phone',
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Internet',
      slug: 'internet',
      isActive: true,
      order:1,
      group:'default',
    },{
      name: 'Other',
      slug: 'other',
      isActive: true,
      order:1,
      group:'default',
    }];




    const genTypes = [{
      name:'Setter',
      slug:'setter',
      isActive:true,
    },{
      name:'Self Gen',
      slug:'self-gen',
      isActive:true,
    },{
      name:'Company',
      slug:'company',
      isActive:true,
      isDefault:true,
    },{
      name:'Canvassing',
      slug:'canvassing',
      isActive:true,

    }]
    const contactTypes = [{
      name:'Lead',
      slug:'lead',
      isDefault: true,
      isActive:true,
    },{
      name:'Opportunity',
      slug:'opportunity',
      isActive:true,

    },{
      name:'Contact',
      slug:'contact',
      isActive:true,

    },{
      name:'Drop',
      slug:'drop',
      isActive:true,
    }]

    const roles = [{
      name:'Admin',
      description:'',
      slug:'admin',
      order:1,
      isActive:true
    },{
      name:'Setter',
      description:'',
      slug:'setter',
      order:1,
      isActive:true
    },{
      name:'Closer',
      description:'',
      slug:'closer',
      isDefault:true,
      order:1,
      isActive:true
    },{
      name:'Contact',
      description:'',
      slug:'contact',
      order:1,
      isActive:true
    },{
      name:'Partner',
      description:'',
      slug:'partner',
      order:1,
      isActive:true
    },{
      name:'Lender',
      description:'',
      slug:'lender',
      order:1,
      isActive:true
    }]


    const options = [
      {
        name: 'No Go',
        slug: 'drop',
        value: 'drop',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Knock',
        slug: 'knock-lead',
        value: 'contact',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Call / Voicemail',
        slug: 'call-vm-lead',
        value: 'contact',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Call / No Answer',
        slug: 'call-no-answer-lead',
        value: 'contact',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Call / Answer',
        slug: 'call-vm-lead',
        value: 'contact',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Text',
        slug: 'text-lead',
        value: 'contact',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Email',
        slug: 'email-lead',
        value: 'contact',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'Appointment Set',
        slug: 'appointment-set-opportunity',
        value: 'appointment',
        isDefault: false,
        isActive: true,
        order:1,
        group:'default',
        type:'leadStatus'
      },{
        name: 'No Show',
        slug: 'no-show-drop',
        value: 'drop',
        isDefault: false,
        isActive: true,
        order:1,
        isVisible:true,
        group:'default',
        type:'disposition'
      },{
        name: 'Rescheduled',
        slug: 'reschedule',
        value: 'reschedule',
        isDefault: false,
        isActive: true,
        order:1,
        isVisible:true,
        group:'default',
        type:'disposition'
      },{
        name: 'Followup',
        slug: 'followup-sit',
        value: 'sit',
        isDefault: false,
        isActive: true,
        order:1,
        isVisible:true,
        group:'default',
        type:'disposition'
      },{
        name: 'Failed Credit',
        slug: 'failed-credit-drop',
        value: 'sit',
        isDefault: false,
        isActive: true,
        order:1,
        isVisible:true,
        group:'default',
        type:'disposition'
      },{
        name: 'Request New Design',
        slug: 'request-new-design',
        value: 'redesign',
        isDefault: false,
        isActive: true,
        order:1,
        isVisible:true,
        group:'default',
        type:'disposition'
      },{
        name: 'Close',
        slug: 'close',
        value: 'redesign',
        isDefault: false,
        isActive: true,
        isVisible:false,
        order:1,
        group:'default',
        type:'disposition'
      },{
        name: 'All Docs Signed',
        slug: 'all-docs-signed',
        isDefault: true,
        isActive: true,
        value:true,
        options:null,
        order:1,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Site Survey Scheduled',
        slug: 'site-survey-scheduled',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:2,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Site Survey Completed',
        slug: 'site-survey-completed',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:3,
        group:'default',
        type:'projectStatus'
      },{
        name: 'NTP',
        slug: 'ntp',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:4,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Entered into Permitting',
        slug: 'entered-into-permitting',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:5,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Permits Completed',
        slug: 'permits-completed',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:6,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Install Scheduled',
        slug: 'install-sheduled',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:7,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Install Complete',
        slug: 'install-completed',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:8,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Inspection Scheduled',
        slug: 'inspection-scheduled',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:9,
        group:'default',
        type:'projectStatus'

      },{
        name: 'Inspection Passed',
        slug: 'inspection-passed',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:10,
        group:'default',
        type:'projectStatus'
      },{
        name: 'Interconnection',
        slug: 'interconnection',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:11,
        group:'default',
        type:'projectStatus'
      },{
        name: 'PTO',
        slug: 'pto',
        isDefault: false,
        isActive: true,
        value:true,
        options:null,
        order:12,
        group:'default',
        type:'projectStatus'
      }];




    await queryInterface.bulkInsert('contact_sources', contactSources, {});
    await queryInterface.bulkInsert('document_types', documentTypes, {});
    await queryInterface.bulkInsert('appointment_types', appointmentTypes, {});
    await queryInterface.bulkInsert('contact_types', contactTypes, {});
    await queryInterface.bulkInsert('gen_types', genTypes, {});
    await queryInterface.bulkInsert('roles', roles, {});
    await queryInterface.bulkInsert('options', options, {});
  },

  down: async (queryInterface, Sequelize) => {
    const forceSync = async () => {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await queryInterface.sequelize.sync({ force: true });
    };

    await forceSync();

    await queryInterface.dropTable('lead_sources');
    await queryInterface.dropTable('document_types');
    await queryInterface.dropTable('appointment_types');
    await queryInterface.dropTable('contact_types');
    await queryInterface.dropTable('gen_types');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('options');


  }
};

const Recipient = require("mailersend").Recipient;
const EmailParams = require("mailersend").EmailParams;
const MailerSend = require("mailersend");

const mailersend = new MailerSend({
    api_key: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYTI4YmZkMDcwN2YzZTNmMDE3NjAwMjFhMjkwYjA5MmVjOTUyYWU4MzY0OTcyNDYzYjZiMzNkODNhNTQ3ODEyMGE1Y2EyM2I0N2FmOThhZjMiLCJpYXQiOjE2NTA3Mjg2NjYuMzYxNDI3LCJuYmYiOjE2NTA3Mjg2NjYuMzYxNDMxLCJleHAiOjQ4MDY0MDIyNjYuMzU2OTk4LCJzdWIiOiIyNTQ4MyIsInNjb3BlcyI6WyJlbWFpbF9mdWxsIiwiZG9tYWluc19mdWxsIiwiYWN0aXZpdHlfZnVsbCIsImFuYWx5dGljc19mdWxsIiwidG9rZW5zX2Z1bGwiLCJ3ZWJob29rc19mdWxsIiwidGVtcGxhdGVzX2Z1bGwiLCJzdXBwcmVzc2lvbnNfZnVsbCIsInNtc19mdWxsIl19.A3LRjViwhgq-U_tXrLK8EgeR8mpNQWzr9nWQFVz0wzml4tZOterqUJxXKnLeQoBx5NO0zCTVWRj0m8l4Qvrr1mAzcXxwrxkaUJAAn3wU5HKuEbCKxBm61T7Bp192PFVLyes4C5LFb0TZB7sSffAD3C2k-0z3A_Z7NaouJkjV7HKhvKzUSBaWoGctbS_08GQpr5Wz0Rg7Pjm_-RHpUyM_0LWzpq1Ps5pUqFMX1SB3nhOGxKKmLEyS0MnOfySyR2b-rsM4HYsmkHlRLO3LoU1uIw_RpZkARZl95Cstnfvi1XT08p3dRBxwYkgUg9Fc3j4vnJ46wxQjnNgXd5ABUM6UvSbMnUc50Xjm_zpopKQG0PsfU-zG8vbLlcwNyoaVM16mNEYdUcfnYyR5LzgqTMiJ-ZomhDfU7XFWDsaeG_qJv03CIJfzRTfwhScvfz3YfxmgqLC4DpDQqSqoTc3RppO4kGN4fEVWh1gfO_5iguq1mCr8c6NVEtA7llTT2d3hUuViLElbqDTQAPCLX2lxN9eSFg4UW15vHv3RsF5KE_kd7Nk8PJw13BFJ7-1e_BVWhvqMUxrEfYhClSvJsF_Ce3KkplQ9lUFm8JW3zIJGqCw0AiGEicavFb7-zq6Mrgpc0iWBr9-YklUFiimkHidnBbR7U78y4zwKh6CERrbZFIQ3vu4",
});
///



exports.sendRepLeadFormEmail = async(email,contact) =>{
    try{
        const recipients = [new Recipient(email)];

        const variables = [
            {
                email: email,
                substitutions: [
                    {
                        var: 'phone',
                        value: contact.phone
                    },
                    {
                        var: 'contactName',
                        value: contact.name
                    }
                ],
            }
        ];

        const emailParams = new EmailParams()
            .setFrom("do-not-reply@g3.app")
            .setFromName("G3.app")
            .setRecipients(recipients)
            .setSubject("Leadform Submitted")
            .setTemplateId('z86org8erm0gew13')
            .setVariables(variables);

        return mailersend.send(emailParams);
    }catch(e){
        console.error(e);

        return false;
    }
}

exports.sendEmail = async({subject, recipientEmail,templateName,parameters}) =>{

    const map = {
        statusChangeNotification:{
            subject: subject || 'Status/Disposition Change Notification',
            templateId:'7dnvo4dmmr945r86',
            substitutions: (params)=>{
                return [
                    {
                        var: 'statusName',
                        value: params.statusName
                    },
                    {
                        var: 'contactName',
                        value: params.contactName
                    }
                ]
            }
        },
        newContact:{
            subject: subject || 'New Contact',
            templateId:'z86org8erm0gew13',
            substitutions: (params)=>{
                return [{
                    var: 'header',
                    value: params.header || "Contact Added"
                },
                    {
                        var: 'phone',
                        value: params.phone
                    },
                    {
                        var: 'contactName',
                        value: params.name
                    }
                ]
            }
        },
        generic:{
            subject: subject || 'G3 Email',
            templateId:'o65qngkd76dlwr12',
            substitutions: (params)=>{
                return [
                    {
                        var: 'link',
                        value: params.link
                    },
                    {
                        var: 'link_text',
                        value: params.link_text
                    },
                    {
                        var: 'header',
                        value: params.header
                    },
                    {
                        var: 'content',
                        value: params.content
                    },
                    {
                        var: 'label_1',
                        value: params.label_1
                    },
                    {
                        var: 'text_1',
                        value: params.text_1
                    },
                    {
                        var: 'label_2',
                        value: params.label_2
                    },
                    {
                        var: 'text_2',
                        value: params.text_2
                    }
                ]
            }
        }
    }

    const template = map[templateName];
    const substitutions = template.substitutions(parameters);
    const recipients = [new Recipient(recipientEmail)];
    const variables = [
        {
            email: recipientEmail,
            substitutions,
        }
    ];
    console.log('WHA ',variables[0]);
    const emailParams = new EmailParams()
        .setFrom("no-reply@g3.app")
        .setFromName("G3.app")
        .setRecipients(recipients)
        .setSubject(template.subject)
        .setTemplateId(template.templateId)
        .setVariables(variables);

    return mailersend.send(emailParams);

}


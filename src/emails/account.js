const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        from: 'vschaudhary2001@gmail.com',
        to: email,
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendDeleteMail = (email, name) => {
    sgMail.send({
        from: 'vschaudhary2001@gmail.com',
        to: email,
        subject: 'Sorry to see you go',
        text: `Goodbye ${name}. I hope to see you back sometime soon`
    })
}

module.exports = {
    sendWelcomeMail,
    sendDeleteMail
}

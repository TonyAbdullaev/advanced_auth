const nodeMailer = require('nodemailer')
class MailService {
    constructor() {
        this.transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                password: process.env.SMTP_PASSWORD,
            },
        })
    }
    async sendActivationMail (to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `Activation account in ${process.env.API_URL}`,
            text: '',
            html:
                `
                <div>
                    <h1>To activate an account, please go to</h1>
                    <a href="${link}">${link}</a>
                </div> 
                `
        })
    }
}

module.exports = new MailService();
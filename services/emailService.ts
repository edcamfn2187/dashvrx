import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { getConfigPool } from '../server/services/dbService.js';
import sql from 'mssql';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments: {
    filename: string;
    path: string;
    contentType?: string;
    cid?: string;
  }[];
}

async function getTransporter() {
  let smtpConfig = {
    host: process.env.SMTP_SERVER || '192.168.16.93',
    port: parseInt(process.env.SMTP_PORT || '25'),
    secure: false,
    auth: undefined as any,
    tls: {
      rejectUnauthorized: false
    }
  };

  try {
    const pool = await getConfigPool();
    const result = await pool.request()
      .input('key', sql.NVarChar, 'smtp_config')
      .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');

    if (result.recordset.length > 0) {
      const dbConfig = JSON.parse(result.recordset[0].config_value);
      smtpConfig = {
        host: dbConfig.host || smtpConfig.host,
        port: parseInt(dbConfig.port) || smtpConfig.port,
        secure: dbConfig.secure || false,
        auth: dbConfig.user ? {
          user: dbConfig.user,
          pass: dbConfig.pass
        } : undefined,
        tls: {
          rejectUnauthorized: false
        }
      };
    }
  } catch (error) {
    console.warn('Failed to fetch SMTP config from DB, using defaults/env:', error);
  }

  return nodemailer.createTransport(smtpConfig);
}

export async function sendEmail(options: EmailOptions) {
  // Add template images as inline attachments
  const imgDir = path.join(process.cwd(), 'img');
  const templateImages = [
    { filename: 'topo_report.png', path: path.join(imgDir, 'topo_report.png'), cid: 'topo_report.png' },
    { filename: 'footer_email.jpg', path: path.join(imgDir, 'footer_email.jpg'), cid: 'footer_email.jpg' }
  ];

  const attachments = [...options.attachments];

  templateImages.forEach(img => {
    if (fs.existsSync(img.path)) {
      attachments.push(img);
    }
  });

  try {
    const transporter = await getTransporter();

    // Get sender email from DB config if available
    let fromEmail = process.env.EMAIL_FROM || 'cybersecup-reports@ish.com.br';
    try {
      const pool = await getConfigPool();
      const result = await pool.request()
        .input('key', sql.NVarChar, 'smtp_config')
        .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');
      if (result.recordset.length > 0) {
        const dbConfig = JSON.parse(result.recordset[0].config_value);
        if (dbConfig.from) fromEmail = dbConfig.from;
      }
    } catch (e) {
      // ignore
    }

    console.log(`Attempting to send email to ${options.to} from ${fromEmail}...`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: attachments,
    });
    console.log('Email sent: %s', info.messageId);
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Provide more context in the error message if possible
    const errorMsg = error.message || 'Unknown SMTP error';
    throw new Error(`Failed to send email: ${errorMsg}`);
  }
}

export function getEmailTemplate(data: Record<string, string> = {}): { subject: string; body: string } {
  const templatePath = path.join(process.cwd(), 'email.html');
  let templateContent = '';

  try {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  } catch (e) {
    console.error('Error reading email.html, falling back to default.', e);
    return { subject: 'Relatório Agendado', body: '<p>Relatório em anexo.</p>' };
  }

  // Replace placeholders
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{ ${key} }}`, 'g');
    templateContent = templateContent.replace(regex, data[key]);
  });

  // Also replace without spaces just in case
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    templateContent = templateContent.replace(regex, data[key]);
  });

  // Extract subject from title tag if present, otherwise default
  const subjectMatch = /<title>(.*?)<\/title>/.exec(templateContent);
  const subject = subjectMatch ? subjectMatch[1] : 'Relatório de Ambiente';

  return {
    subject: subject,
    body: templateContent,
  };
}

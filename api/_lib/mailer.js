// api/lib/mailer.js — helper compartido de Gmail para toda la API
const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Envía un correo de notificación de tarea asignada.
 * @param {object} opts
 * @param {string} opts.toEmail      - Correo del destinatario
 * @param {string} opts.toName       - Nombre del destinatario
 * @param {string} opts.tareaTitle   - Título de la tarea
 * @param {string} opts.tareaDesc    - Descripción de la tarea (puede ser vacío)
 * @param {string} opts.prioridad    - Prioridad: alta | media | baja
 * @param {string} opts.fechaLimite  - Fecha límite (puede ser null)
 * @param {string} opts.asignadoPor  - Nombre de quien asignó
 */
async function sendTareaAsignadaEmail(opts) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const { toEmail, toName, tareaTitle, tareaDesc, prioridad, fechaLimite, asignadoPor } = opts;

  const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://ecgcorporativo.com').replace(/\/$/, '');

  const prioridadColor = {
    alta:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', label: '🔴 Alta'  },
    media:  { bg: '#fffbeb', border: '#fcd34d', text: '#d97706', label: '🟡 Media' },
    baja:   { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', label: '🟢 Baja'  },
  }[prioridad] || { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b', label: prioridad };

  const fechaStr = fechaLimite
    ? new Date(fechaLimite).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"ECG Corporativo" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject: `📋 Nueva tarea asignada: ${tareaTitle}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%);padding:28px 40px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#93c5fd;text-transform:uppercase;">Portal Empresarial</p>
                <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">ECG <span style="font-weight:300;color:#93c5fd;">Corporativo</span></h1>
              </td></tr>

              <!-- Body -->
              <tr><td style="padding:36px 40px;">

                <!-- Icono + título -->
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                  <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#1e40af,#3b82f6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="font-size:22px;">📋</span>
                  </div>
                  <div>
                    <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Nueva tarea asignada</p>
                    <h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;line-height:1.3;">${tareaTitle}</h2>
                  </div>
                </div>

                <!-- Saludo -->
                <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
                  Hola <strong>${toName}</strong>, se te ha asignado una nueva tarea${asignadoPor ? ` por <strong>${asignadoPor}</strong>` : ''}.
                </p>

                <!-- Detalles -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:20px;">
                  <tr><td style="padding:20px 24px;">

                    <!-- Prioridad -->
                    <div style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${prioridadColor.bg};border:1px solid ${prioridadColor.border};color:${prioridadColor.text};margin-bottom:14px;">
                      ${prioridadColor.label}
                    </div>

                    ${tareaDesc ? `
                    <p style="margin:0 0 14px;font-size:13px;color:#64748b;line-height:1.6;border-left:3px solid #3b82f6;padding-left:12px;">${tareaDesc}</p>
                    ` : ''}

                    ${fechaStr ? `
                    <p style="margin:0;font-size:13px;color:#64748b;">
                      <span style="font-weight:700;color:#0f172a;">📅 Fecha límite:</span> ${fechaStr}
                    </p>
                    ` : ''}

                  </td></tr>
                </table>

                <!-- CTA -->
                <div style="text-align:center;margin:24px 0 8px;">
                  <a href="${FRONTEND_URL}/admin" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
                    Ver mis tareas →
                  </a>
                </div>

              </td></tr>

              <!-- Footer -->
              <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} ECG Corporativo · ecgcorporativo.com</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

module.exports = { sendTareaAsignadaEmail };

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Envía el código de verificación de 6 dígitos usando la API transaccional de Brevo.
 * Requiere `BREVO_API_KEY` y `BREVO_SENDER_EMAIL` en las variables de entorno.
 */
export async function sendPasswordResetCodeEmail({ toEmail, toName, code }) {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim()
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'BookReview'

  if (!apiKey || !senderEmail) {
    const err = new Error('Brevo credentials are not configured')
    err.code = 'BREVO_NOT_CONFIGURED'
    throw err
  }

  const safeName = escapeHtml(toName || 'lector')
  const safeCode = escapeHtml(code)
  const configuredFrontend = process.env.FRONTEND_URL?.replace(/\/$/, '')
  const publicSiteUrl =
    configuredFrontend && !configuredFrontend.includes('localhost')
      ? configuredFrontend
      : 'https://book-review-six-rho.vercel.app'
  const logoUrl = `${publicSiteUrl}/bookreview-logo.png`

  const htmlContent = `
    <div style="margin:0;padding:32px 16px;background-color:#f8f7f2;font-family:'Helvetica Neue',Arial,sans-serif;color:#18332f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #d6d0c0;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="height:4px;background-color:#0e5146;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:22px 28px 18px;background-color:#f8f7f2;border-bottom:1px solid #e6e0d2;text-align:center;">
            <img
              src="${logoUrl}"
              alt="BookReview"
              width="182"
              height="36"
              style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:700;color:#0e5146;"
            />
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#0e5146;">
              Recuperá tu contraseña
            </h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a615b;">
              Hola <strong>${safeName}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta. Ingresá el siguiente código en la pantalla de verificación:
            </p>
            <div style="margin:0 0 20px;padding:16px;background-color:#f8f7f2;border:1px solid #d6d0c0;border-radius:12px;text-align:center;">
              <span style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#0e5146;">
                ${safeCode}
              </span>
            </div>
            <p style="margin:0;font-size:12px;line-height:1.5;color:#6c7f7a;">
              Este código vence en <strong>10 minutos</strong>. Si no solicitaste el cambio, podés ignorar este mensaje con tranquilidad.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject: `${code} es tu código de recuperación · BookReview`,
      htmlContent,
      textContent: `Hola ${toName || ''}, tu código de recuperación de BookReview es: ${code}. Vence en 10 minutos.`,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    const err = new Error(`Brevo API error (${response.status}): ${bodyText}`)
    err.code = 'BREVO_SEND_FAILED'
    throw err
  }

  return response.json().catch(() => ({ ok: true }))
}

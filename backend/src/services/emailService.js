/**
 * Email Notification and Invitation Dispatch Service for SkillNexus AI
 * Generates secure, branded invitations with activation tokens.
 */

class EmailService {
  /**
   * Generates formatted invitation email payload
   */
  createInvitationEmail({ studentName, collegeEmail, institutionName, activationToken, expiresAt }) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const activationLink = `${baseUrl}/activate?token=${encodeURIComponent(activationToken)}`;

    const subject = `Welcome to SKILL NEXUS — Activate your student account for ${institutionName}`;
    const textContent = `
Hello ${studentName},

${institutionName} has registered you on SKILL NEXUS AI — the Sovereign Career Intelligence & Competency Verification Platform.

To claim and activate your student account, please visit the secure verification link below:
${activationLink}

This invitation link is single-use and will expire on ${new Date(expiresAt).toLocaleDateString()}.

During activation, you will confirm your college email and set your personal account password (or link with your Google account).

Best regards,
The SKILL NEXUS Team & ${institutionName} Placement Administration
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0B1120; color: #F8FAFC; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #131E32; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; }
    .badge { display: inline-block; background: rgba(6,182,212,0.15); color: #06B6D4; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; }
    h1 { font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 16px 0 8px 0; }
    p { font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 12px 0; }
    .btn { display: inline-block; background: #06B6D4; color: #0B1120 !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .meta { font-size: 12px; color: #64748B; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Institutional Career Invitation</div>
    <h1>Welcome to SKILL NEXUS</h1>
    <p>Dear <strong>${studentName}</strong>,</p>
    <p><strong>${institutionName}</strong> has provisioned your official student profile on SKILL NEXUS AI. Your verified competency tracking, skill diagnostic assessments, and direct placement opportunities are waiting for you.</p>
    
    <div style="text-align: center;">
      <a href="${activationLink}" class="btn">Activate My SKILLNEXUS Account →</a>
    </div>

    <p style="font-size: 12px; color: #64748B;">If the button above does not work, copy and paste this link into your browser:<br/><span style="word-break: break-all; color: #06B6D4;">${activationLink}</span></p>

    <div class="meta">
      <p>This single-use link expires on <strong>${new Date(expiresAt).toLocaleDateString()}</strong>. If you did not expect this invitation, please contact your college placement cell.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return {
      to: collegeEmail,
      subject,
      textContent,
      htmlContent,
      activationLink
    };
  }

  /**
   * Dispatches invitation (in development, logs securely without token exposure)
   */
  async sendStudentInvitation(params) {
    const emailPayload = this.createInvitationEmail(params);
    // Mask token for safe console logging
    const maskedToken = params.activationToken ? `${params.activationToken.slice(0, 6)}...${params.activationToken.slice(-4)}` : 'N/A';
    console.log(`[EmailService] Invitation dispatched to "${params.collegeEmail}" for student "${params.studentName}" (Token: ${maskedToken})`);
    
    return {
      success: true,
      recipient: params.collegeEmail,
      dispatchedAt: new Date().toISOString(),
      activationLink: emailPayload.activationLink
    };
  }
}

module.exports = new EmailService();

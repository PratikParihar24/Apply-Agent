import os
import base64
import re
import resend
from dotenv import load_dotenv
from fpdf import FPDF

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(env_path)

class SendingAgent:
    def send_application(self, company: dict, cover_letter: str, email_body: str, subject: str, tailored_resume: str, user_resend_key: str = None, user_id: str = None) -> dict:
        api_key = user_resend_key or os.getenv("RESEND_API_KEY")
        from_address = os.getenv("RESEND_FROM_ADDRESS")

        if not api_key or not from_address:
            return {"success": False, "message": "Resend API key or From Address not configured."}

        if not user_id:
            return {"success": False, "message": "User ID is required to fetch the resume."}

        resend.api_key = api_key

        recipient = company.get("hr_email")
        if not recipient:
            domain = company.get("website", "")
            if domain:
                domain = domain.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[-1] # fallback logic
                recipient = f"careers@{domain}"
            else:
                domain_guess = company.get("company", "").lower().replace(" ", "") + ".com"
                recipient = f"careers@{domain_guess}"
            
        recipient = "pheonixpratik24@gmail.com"  # Temporarily override for testing
  
        # Read the original resume PDF
        resume_path = os.path.join(os.path.dirname(__file__), '..', 'data', f'resume_{user_id}.pdf')
        try:
            with open(resume_path, "rb") as f:
                r_pdf_bytes = f.read()
        except FileNotFoundError:
            return {"success": False, "message": "Original resume not found. Please re-upload your resume."}

        # Build HTML Email from cover_letter (primary) or email_body (fallback)
        eb_html = cover_letter or email_body or ""
        if not eb_html:
            eb_html = "<p>Please find my resume attached. I look forward to hearing from you.</p>"
        elif not (eb_html.startswith("<") or eb_html.startswith("<p>")):
            paragraphs = [p.strip() for p in eb_html.split("\n") if p.strip()]
            eb_html = "".join([f"<p>{p}</p>" for p in paragraphs])
        
        html_body = f"""
        <html>
          <body style="font-family: Arial, Georgia, sans-serif; background-color: #ffffff; padding: 20px; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
            {eb_html}
          </body>
        </html>
        """

        # Check magic bytes to see if it's actually a DOCX file (starts with PK\x03\x04)
        is_pdf = r_pdf_bytes.startswith(b'%PDF')
        attachment_filename = "Resume.pdf" if is_pdf else "Resume.docx"

        attachments = [
            {"filename": attachment_filename, "content": list(r_pdf_bytes)}
        ]

        try:
            params = {
                "from": from_address,
                "to": recipient,
                "subject": subject,
                "html": html_body,
                "attachments": attachments
            }
            response = resend.Emails.send(params)
            return {"success": True, "message": f"Successfully sent to {recipient}", "message_id": response.get("id")}
        except Exception as e:
            print(f"Resend Error: {e}")
            return {"success": False, "message": str(e)}

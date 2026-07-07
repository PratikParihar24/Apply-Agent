import os
import base64
import resend
from fpdf import FPDF
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(env_path)

class SendingAgent:
    def send_application(self, company: dict, cover_letter: str, email_body: str, subject: str, tailored_resume: str, user_resend_key: str = None) -> dict:
        api_key = user_resend_key or os.getenv("RESEND_API_KEY")
        from_address = os.getenv("RESEND_FROM_ADDRESS")

        if not api_key or not from_address:
            return {"success": False, "message": "Resend API key or From Address not configured."}

        resend.api_key = api_key

        recipient = company.get("hr_email")
        if not recipient:
            domain = company.get("website", "")
            if domain:
                domain = domain.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
                recipient = f"careers@{domain}"
            else:
                domain_guess = company.get("company", "").lower().replace(" ", "") + ".com"
                recipient = f"careers@{domain_guess}"

        # Generate Cover Letter PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=12)
        pdf.multi_cell(0, 8, text=cover_letter.encode('latin-1', 'replace').decode('latin-1'))
        cl_pdf_bytes = pdf.output()
        cl_b64 = base64.b64encode(cl_pdf_bytes).decode('utf-8')
        
        # Generate Resume PDF
        r_pdf = FPDF()
        r_pdf.add_page()
        r_pdf.set_font("Helvetica", size=11)
        r_pdf.multi_cell(0, 6, text=tailored_resume.encode('latin-1', 'replace').decode('latin-1'))
        r_pdf_bytes = r_pdf.output()
        r_b64 = base64.b64encode(r_pdf_bytes).decode('utf-8')

        attachments = [
            {"filename": "Cover_Letter.pdf", "content": cl_b64},
            {"filename": "Resume.pdf", "content": r_b64}
        ]

        try:
            params = {
                "from": from_address,
                "to": recipient,
                "subject": subject,
                "text": email_body,
                "attachments": attachments
            }
            response = resend.Emails.send(params)
            return {"success": True, "message": f"Successfully sent to {recipient}", "message_id": response.get("id")}
        except Exception as e:
            print(f"Resend Error: {e}")
            return {"success": False, "message": str(e)}

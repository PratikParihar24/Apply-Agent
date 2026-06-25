import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from fpdf import FPDF
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(env_path)

class SendingAgent:
    def send_application(self, company: dict, cover_letter: str, email_body: str, subject: str, tailored_resume: str) -> dict:
        gmail_user = os.getenv("GMAIL_ADDRESS")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")

        if not gmail_user or not gmail_password:
            return {"success": False, "message": "Email credentials not found in .env"}

        recipient = company.get("hr_email")
        if not recipient:
            domain = company.get("website", "")
            if domain:
                domain = domain.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
                recipient = f"careers@{domain}"
            else:
                domain_guess = company.get("company", "").lower().replace(" ", "") + ".com"
                recipient = f"careers@{domain_guess}"

        msg = MIMEMultipart()
        msg['From'] = gmail_user
        msg['To'] = recipient
        msg['Subject'] = subject

        # Attach body
        msg.attach(MIMEText(email_body, 'plain'))

        # Generate Cover Letter PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=12)
        pdf.multi_cell(0, 8, text=cover_letter.encode('latin-1', 'replace').decode('latin-1'))
        cl_pdf_bytes = pdf.output()
        
        cl_part = MIMEApplication(cl_pdf_bytes, Name="Cover_Letter.pdf")
        cl_part['Content-Disposition'] = 'attachment; filename="Cover_Letter.pdf"'
        msg.attach(cl_part)
        
        # Generate Resume PDF
        r_pdf = FPDF()
        r_pdf.add_page()
        r_pdf.set_font("Helvetica", size=11)
        r_pdf.multi_cell(0, 6, text=tailored_resume.encode('latin-1', 'replace').decode('latin-1'))
        r_pdf_bytes = r_pdf.output()
        
        r_part = MIMEApplication(r_pdf_bytes, Name="Resume.pdf")
        r_part['Content-Disposition'] = 'attachment; filename="Resume.pdf"'
        msg.attach(r_part)

        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(gmail_user, gmail_password)
            server.send_message(msg)
            server.quit()
            return {"success": True, "message": f"Successfully sent to {recipient}"}
        except Exception as e:
            print(f"SMTP Error: {e}")
            return {"success": False, "message": str(e)}

import os
import sys
import json
import streamlit as st

# Ensure parent path is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.resume_processor import ResumeProcessor
from agents.search_agent import SearchAgent
from agents.shortlister_agent import ShortlisterAgent
from agents.tailor_agent import TailorAgent
from agents.writer_agent import WriterAgent
from agents.sending_agent import SendingAgent
from config.settings import MAX_SEARCH_RESULTS

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
SESSION_STATE_FILE = os.path.join(DATA_DIR, 'session_state.json')
RESUME_PDF_PATH = os.path.join(DATA_DIR, 'resume.pdf')

def save_state():
    """Saves relevant parts of st.session_state to JSON."""
    data_to_save = {
        'shortlist': st.session_state.get('shortlist', []),
        'approved': st.session_state.get('approved', []),
        'materials': st.session_state.get('materials', {}),
        'resume_summary': st.session_state.get('resume_summary', '')
    }
    with open(SESSION_STATE_FILE, 'w') as f:
        json.dump(data_to_save, f, indent=4)

def load_state():
    """Loads state from JSON if it exists."""
    if os.path.exists(SESSION_STATE_FILE):
        try:
            with open(SESSION_STATE_FILE, 'r') as f:
                data = json.load(f)
                for k, v in data.items():
                    if k not in st.session_state:
                        st.session_state[k] = v
        except Exception as e:
            st.error(f"Failed to load state: {e}")

# Initialize state
if 'initialized' not in st.session_state:
    load_state()
    st.session_state['initialized'] = True

st.title("Agent Apply Dashboard")

view = st.sidebar.radio("Navigation", ["Setup", "Review Shortlist", "Review & Send"])

if view == "Setup":
    st.header("Step 1: Setup")
    
    uploaded_file = st.file_uploader("Upload Resume PDF", type=["pdf"])
    if uploaded_file is not None:
        with open(RESUME_PDF_PATH, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.success("Resume saved successfully.")
        
    target_role = st.text_input("Target Role", value="Software Engineer")
    location = st.text_input("Location", value="Remote")
    max_apps = st.number_input("Max Applications", min_value=1, max_value=50, value=15)
    
    if st.button("Process Resume & Search"):
        if not os.path.exists(RESUME_PDF_PATH):
            st.error("Please upload a resume first.")
        else:
            with st.status("Starting application pipeline...", expanded=True) as status:
                try:
                    # 1. Process Resume
                    status.update(label="1/3: Extracting and embedding resume...", state="running")
                    rp = ResumeProcessor()
                    res_data = rp.process(RESUME_PDF_PATH)
                    st.session_state['resume_summary'] = res_data.get('summary', '')
                    status.write(f"✓ Resume processed: Found {len(res_data.get('sections_found', []))} sections.")
                    
                    # 2. Search
                    status.update(label=f"2/3: Searching DuckDuckGo for {target_role} (Takes ~45s to prevent rate limits)...", state="running")
                    sa = SearchAgent()
                    companies = sa.search(target_role, location)
                    status.write(f"✓ Found {len(companies)} unique job postings.")
                    
                    # 3. Shortlist
                    status.update(label=f"3/3: Shortlisting top {max_apps} jobs using local LLM...", state="running")
                    
                    def update_progress(current, total, comp_name):
                        status.update(label=f"3/3: Scoring {current}/{total} ({comp_name})...", state="running")
                        
                    sla = ShortlisterAgent()
                    shortlist = sla.shortlist(companies, st.session_state['resume_summary'], top_n=max_apps, progress_callback=update_progress)
                    status.write(f"✓ Shortlist evaluation complete. Evaluated {len(companies)} jobs.")
                    
                    st.session_state['shortlist'] = shortlist
                    save_state()
                    status.update(label="Pipeline finished successfully!", state="complete")
                except Exception as e:
                    status.update(label=f"An error occurred: {e}", state="error")

elif view == "Review Shortlist":
    st.header("Step 2: Review Shortlist")
    
    shortlist = st.session_state.get('shortlist', [])
    if not shortlist:
        st.info("Run Setup first to generate a shortlist.")
    else:
        if 'approved' not in st.session_state:
            st.session_state['approved'] = []
            
        for comp in shortlist:
            comp_name = comp.get('company', 'Unknown')
            score = comp.get('score', 0)
            
            with st.expander(f"{comp_name} - Score: {score}"):
                st.write(f"**Title**: {comp.get('job_title', '')}")
                st.write(f"**Description**: {comp.get('description', '')}")
                
                col1, col2 = st.columns(2)
                # Check if already approved to disable button or change text
                is_approved = any(c['company'] == comp_name for c in st.session_state['approved'])
                
                if is_approved:
                    st.success("Approved")
                else:
                    if col1.button("Approve", key=f"approve_{comp_name}"):
                        st.session_state['approved'].append(comp)
                        save_state()
                        st.rerun()
                        
                    if col2.button("Skip", key=f"skip_{comp_name}"):
                        # Optional: Remove from shortlist
                        pass
        
        st.markdown("---")
        if st.button("Generate Materials"):
            if not st.session_state.get('approved', []):
                st.warning("Please approve some companies first.")
            else:
                with st.status("Generating Application Materials...", expanded=True) as status:
                    rp = ResumeProcessor()
                    ta = TailorAgent()
                    wa = WriterAgent()
                    
                    if 'materials' not in st.session_state:
                        st.session_state['materials'] = {}
                        
                    total_approved = len(st.session_state['approved'])
                    for idx, comp in enumerate(st.session_state['approved']):
                        comp_name = comp['company']
                        status.update(label=f"Drafting materials for {comp_name} ({idx+1}/{total_approved})...", state="running")
                        
                        # Generate tailored resume
                        tailored_res = ta.tailor(comp, rp, rewrite=False)
                        status.write(f"✓ Drafted tailored resume for {comp_name}.")
                        
                        # Generate cover letter/email
                        materials = wa.write(comp, st.session_state.get('resume_summary', ''), tailored_res)
                        status.write(f"✓ Authored JSON materials for {comp_name}.")
                        
                        st.session_state['materials'][comp_name] = {
                            "tailored_resume": tailored_res,
                            "cover_letter": materials.get("cover_letter", ""),
                            "email_body": materials.get("email_body", ""),
                            "subject": materials.get("subject", ""),
                            "send": True # default checked
                        }
                    
                    save_state()
                    status.update(label="All materials generated successfully!", state="complete")

elif view == "Review & Send":
    st.header("Step 3: Review & Send")
    
    materials = st.session_state.get('materials', {})
    if not materials:
        st.info("Generate materials first.")
    else:
        for comp in st.session_state.get('approved', []):
            comp_name = comp['company']
            if comp_name in materials:
                mat = materials[comp_name]
                st.subheader(comp_name)
                
                mat["tailored_resume"] = st.text_area(f"Tailored Resume ({comp_name})", value=mat.get("tailored_resume", ""), height=150)
                mat["cover_letter"] = st.text_area(f"Cover Letter ({comp_name})", value=mat.get("cover_letter", ""), height=150)
                mat["email_body"] = st.text_area(f"Email Body ({comp_name})", value=mat.get("email_body", ""), height=100)
                mat["subject"] = st.text_input(f"Subject ({comp_name})", value=mat.get("subject", ""))
                mat["send"] = st.checkbox(f"Include {comp_name} in send", value=mat.get("send", True))
                
                st.markdown("---")
                
        # Save state on any edit
        save_state()
        
        if st.button("Send All Selected"):
            sending_agent = SendingAgent()
            results = []
            
            with st.spinner("Sending applications..."):
                for comp in st.session_state.get('approved', []):
                    comp_name = comp['company']
                    if comp_name in materials and materials[comp_name]["send"]:
                        mat = materials[comp_name]
                        # Assume sending logic
                        success = sending_agent.send(
                            comp, 
                            RESUME_PDF_PATH, 
                            mat["cover_letter"], 
                            mat["email_body"], 
                            mat["subject"]
                        )
                        results.append({"Company": comp_name, "Status": "Sent" if success else "Failed"})
            
            if results:
                st.success("Sending process complete.")
                st.table(results)
            else:
                st.info("No companies selected for sending.")

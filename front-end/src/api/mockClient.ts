export const uploadResume = async (file: File): Promise<any> => {
    console.log("Mock uploadResume called with file:", file);
    return new Promise(resolve => setTimeout(() => resolve({
        success: true,
        chunks_count: 10,
        sections_found: ['OBJECTIVE', 'TECHNICAL SKILLS', 'PROJECTS']
    }), 800));
};

export const startHunt = async (role: string, location: string, maxResults: number, onCompany?: (company: any) => void): Promise<any> => {
    console.log("Mock startHunt called with:", { role, location, maxResults });
    
    const mockCompanies = Array.from({ length: 8 }, (_, i) => ({
        id: `mock_company_${i + 1}`,
        name: `Mock Company ${i + 1}`,
        job_title: ["Software Engineer", "Backend Developer", "Full Stack Engineer"][i % 3],
        description: "A fast-growing tech company looking for great talent.",
        score: parseFloat((6 + Math.random() * 3).toFixed(1)),
        url: `https://company${i + 1}.example.com/jobs/1`
    }));

    return new Promise(async (resolve) => {
        for (let i = 0; i < mockCompanies.length; i++) {
            await new Promise(r => setTimeout(r, 600)); // simulate search delay
            if (onCompany) onCompany(mockCompanies[i]);
        }
        resolve({ success: true });
    });
};

export const generateForCompany = async (companyId: string): Promise<any> => {
    console.log("Mock generateForCompany called with:", companyId);
    return new Promise(resolve => setTimeout(() => resolve({
        cover_letter: "Dear Hiring Manager,\n\nI am thrilled to apply for the position. I have the necessary skills...",
        email_body: "Hi Team,\n\nPlease find my application attached for the open position.",
        subject: "Application for Software Engineer Role - John Doe",
        tailored_resume: "John Doe\n\nEXPERIENCE\n- Built awesome things..."
    }), 1500));
};

export const sendApplication = async (companyId: string, payload: any): Promise<any> => {
    console.log("Mock sendApplication called with:", companyId, payload);
    return new Promise(resolve => setTimeout(() => resolve({
        success: true,
        status: "sent"
    }), 500));
};

export const getStatus = async (): Promise<any> => {
    console.log("Mock getStatus called");
    return new Promise(resolve => resolve({
        resume_ready: true,
        sections_found: ['OBJECTIVE', 'TECHNICAL SKILLS', 'PROJECTS', 'EDUCATION'],
        summary_preview: 'CS undergrad with Python, FastAPI, Node.js experience...'
    }));
};

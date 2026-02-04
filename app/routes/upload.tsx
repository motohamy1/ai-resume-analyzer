import React, {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {extractTextFromPdf} from "~/lib/pdfText";
import {analyzeResume} from "~/lib/aiAnalysis";
import {generateUUID} from "~/lib/utils";
import {storage} from "~/lib/storage";

const upload = () => {

    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null)

    const handleFileSelect = (file: File | null ) => {
            setFile(file)
    }

    const handleAnalyze = async ({companyName, jobTitle, jobDescription, file} : {companyName: string, jobTitle: string, jobDescription: string, file: File | null}) => {
        console.log('handleAnalyze called', { companyName, jobTitle, jobDescription, fileName: file?.name });
        
        setIsProcessing(true);
        setStatusText('Starting analysis...');
        
        if (!file) {
            console.error('No file selected');
            setStatusText('Error: No file selected');
            setIsProcessing(false);
            return;
        }

        if (!jobTitle || !jobDescription) {
            console.error('Missing required fields', { jobTitle, jobDescription });
            setStatusText('Error: Please fill in all required fields (Job Title and Job Description)');
            setIsProcessing(false);
            return;
        }

        try {
            console.log('Step 1: Converting PDF to image...');
            setStatusText('Converting PDF to image...');
            const imageFile = await convertPdfToImage(file)
            if(!imageFile || !imageFile.file) {
                const errorMsg = imageFile?.error || 'Unknown error during PDF conversion';
                console.error('PDF conversion failed:', errorMsg);
                setStatusText(`Error: ${errorMsg}`);
                setIsProcessing(false);
                return;
            }
            console.log('PDF converted successfully');

            console.log('Step 2: Extracting text...');
            setStatusText('Extracting text from resume...');
            const resumeText = await extractTextFromPdf(file);
            if (!resumeText || resumeText.trim().length === 0) {
                console.error('No text extracted from PDF');
                setStatusText('Error: Could not extract text from PDF. Please ensure the PDF contains readable text.');
                setIsProcessing(false);
                return;
            }
            console.log('Text extracted, length:', resumeText.length);

            console.log('Step 3: Calling AI analysis...');
            setStatusText('Analyzing resume with AI... This may take a moment...');
            const feedback = await analyzeResume(resumeText, jobTitle, jobDescription);
            console.log('AI analysis complete:', feedback);

            console.log('Step 4: Saving results...');
            setStatusText('Saving results...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                imageUrl: imageFile.imageUrl,
                companyName, 
                jobTitle, 
                jobDescription,
                feedback
            };
            storage.set(`resume:${uuid}`, JSON.stringify(data));
            console.log('Data saved with ID:', uuid);
            
            setStatusText('Analysis complete, redirecting...');
            console.log('Navigating to:', `/resume/${uuid}`);
            navigate(`/resume/${uuid}`);
        } catch (error) {
            console.error('Analysis error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error details:', {
                message: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            });
            setStatusText(`Error: ${errorMessage}. Please check the browser console (F12) for details.`);
            setIsProcessing(false);
            // Don't navigate away on error - let user see the error message
        }
    }

    const handleSubmit = (e:  FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Form submitted');
        const form = e.currentTarget;
        if(!form) {
            console.error('Form not found');
            return;
        }
        
        const formData = new FormData(form);
        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        console.log('Form data:', { companyName, jobTitle, jobDescription, hasFile: !!file });

        if(!file) {
            setStatusText('Error: Please select a PDF file');
            setIsProcessing(false);
            return;
        }

        if(!jobTitle || !jobDescription) {
            setStatusText('Error: Please fill in Job Title and Job Description');
            setIsProcessing(false);
            return;
        }

        handleAnalyze({companyName, jobTitle, jobDescription, file});
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">

            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>
                        Smart feedback for your dream job
                    </h1>

                    {isProcessing ? (
                        <>
                            <h2 className="text-xl font-semibold">{statusText}</h2>
                            <img
                                 src='/images/resume-scan.gif'
                                 alt='resume scan gif'
                                 className='w-full'
                            />
                        </>
                    ):(
                        <>
                            <h2>Drop your resume for an ATS score </h2>
                            {statusText && statusText.startsWith('Error:') && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                                    <p className="font-bold">Error</p>
                                    <p>{statusText}</p>
                                </div>
                            )}
                        </>
                    )}
                    {!isProcessing && (
                        <form id='upload-form' onSubmit={handleSubmit}
                                className='flex flex-col gap-4 mt-8'>
                            <div className='form-div'>
                                <label htmlFor='company-name'>Company Name</label>
                                <input type='text' name='company-name' placeholder='Company Name' id='company-name'/>
                            </div>

                            <div className='form-div'>
                                <label htmlFor='job-title'>Job Title</label>
                                <input type='text' name='job-title' placeholder='Job Title' id='job-title'/>
                            </div>

                            <div className='form-div'>
                                <label htmlFor='job-description'>Job Description</label>
                                <textarea rows={5} name='job-description' placeholder='Job Description' id='job-description'/>
                            </div>

                            <div className='form-div'>
                                <label htmlFor='uploader'>Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                                <button 
                                    className='primary-button' 
                                    type='submit'
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Analyze Resume'}
                                </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default upload;

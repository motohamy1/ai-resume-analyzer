import React, {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
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
        setIsProcessing(true);
        if (!file) {
            setStatusText('Error: No file selected');
            return;
        }
        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file)
        if(!imageFile || !imageFile.file) {
            const errorMsg = imageFile?.error || 'Unknown error during PDF conversion';
            return setStatusText(`Error: ${errorMsg}`);
        }

        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            imageUrl: imageFile.imageUrl,
            companyName, 
            jobTitle, 
            jobDescription,
            feedback: {
                overallScore: 75,
                ATS: { score: 80, tips: [{type: 'improve', tip: 'Add more keywords from job description'}] },
                toneAndStyle: { score: 70, tips: [{type: 'good', tip: 'Professional tone', explanation: 'Your resume maintains a professional tone'}] },
                content: { score: 75, tips: [{type: 'improve', tip: 'Quantify achievements', explanation: 'Add numbers and metrics to your achievements'}] },
                structure: { score: 80, tips: [{type: 'good', tip: 'Clear sections', explanation: 'Resume has well-defined sections'}] },
                skills: { score: 70, tips: [{type: 'improve', tip: 'Add technical skills', explanation: 'Include more relevant technical skills'}] }
            }
        };
        storage.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        navigate(`/resume/${uuid}`);
    }

    const handleSubmit = (e:  FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;
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
                            <h2>{statusText}</h2>
                            <img
                                 src='/images/resume-scan.gif'
                                 alt='resume scan gif'
                                 className='w-full'
                            />
                        </>
                    ):(
                        <h2>Drop your resume for an ATS score </h2>
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
                                <button className='primary-button' type='submit'>
                                    Analyze Resume
                                </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default upload;

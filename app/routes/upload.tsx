import React, {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const upload = () => {

    const {auth, isLoading, fs, ai, kv} = usePuterStore();
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
        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file')

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file)
        if(!imageFile) return setStatusText('Error: Failed to convert pdf to image');

        setStatusText('Uploading the image...');
        const uploadingImage = await fs.upload([imageFile.file]);
        if(!uploadingImage) return setStatusText('Error: Failed to upload image');
        setStatusText('Analyzing the image...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadingImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
        }
        await kv.set(uuid, JSON.stringify(data));
        setStatusText('analyzing...');
        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({AIResponseFormat: "", jobTitle, jobDescription })
        )
        if(!feedback) return setStatusText('Error: Failed to get feedback');

        const feedbackText = typeof feedback.message.content === 'string'
        ?  feedback.message.content : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText)
        await kv.set(uuid, JSON.stringify(data));
        setStatusText('analysis complete, redirecting...');
        console.log(data);
    }

    const handleSubmit = (e:  FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) retrun:
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

                                <button className='primary-button' type='submit'>
                                    Analyze Resume
                                </button>
                            </div>
                        </form>
                        )}
                </div>
            </section>
        </main>
    )
}
export default upload;

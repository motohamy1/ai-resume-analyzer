import React, {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import {formatSize} from '../lib/formatSize'

interface FileUploaderProps {
    onFileSelect?:( file:File | null) => void;
}

const FileUploader = ({ onFileSelect} : FileUploaderProps) => {

    const [file, setFile] = useState<File | null>(null)

    const onDrop = useCallback((acceptedFiles : File[]) => {
        const nextFile = acceptedFiles[0] ?? null
        setFile(nextFile)
        onFileSelect?.(nextFile)
    }, [onFileSelect])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        multiple: false,
        accept:{'application/pdf': ['.pdf']},
        maxSize: 20 * 1024 * 1024,
    })

    return (
        <div className='w-full gradient-border'>
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className='space-y-4 cursor-pointer'>
                    {file ? (
                        <div className='uploader-selected-file' onClick={(e)=> (e.stopPropagation())}>
                            <img src='/images/pdf.png' alt='pdf' className='size-10'/>
                            <div className='flex items-center space-x-3'>
                                <div>
                                    <p className='text-lg font-semibold text-gray-700 truncate max-w-xs'>
                                        {file.name}
                                    </p>
                                    <p className='text-sm text-gray-500'>
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button className='p-2 cursor-pointer' onClick={(e) => {
                                onFileSelect?.(null)}}>
                                <img src='/icons/cross.svg' alt='close' className='w-4 h-4'/>
                            </button>
                        </div>
                    ):(
                        <div>
                            <div className='mx-auto w-16 h-16 flex items-center justify-center mb-2'>
                                <img src='/icons/info.svg' alt='info' className='size-20'/>
                            </div>
                            <p className='text-lg text-gray-500'>
                                <span className='font-semibold'>
                                    {isDragActive ? 'Release to Upload' : 'Click to Upload Resume'}
                                </span>{' '}
                                {!isDragActive && 'or drag and drop'}
                            </p>
                            <p className='text-lg text-gray-500'>PDF (max 20 MB)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default FileUploader

import { useState, useEffect } from "react";
import { storage } from "~/lib/storage";

const WipeApp = () => {
    const [resumeCount, setResumeCount] = useState(0);

    const loadResumes = () => {
        const keys = storage.list("resume:");
        setResumeCount(keys.length);
        return keys;
    };

    useEffect(() => {
        loadResumes();
    }, []);

    const handleDelete = () => {
        const keys = storage.list("resume:");
        keys.forEach((key) => {
            storage.delete(key);
        });
        loadResumes();
        alert(`Deleted ${keys.length} resume(s)`);
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Wipe App Data</h1>
            <div className="mb-4">
                <p>Found {resumeCount} stored resume(s)</p>
            </div>
            <div>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600"
                    onClick={handleDelete}
                >
                    Wipe All Resume Data
                </button>
            </div>
        </div>
    );
};

export default WipeApp;
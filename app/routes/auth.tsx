import {useEffect} from "react";
import {useNavigate} from "react-router";

export const meta = () => ([
    { title: 'Resumind | Auth' },
    { name: 'description', content: 'AI Resume Analyzer' },
])

const Auth = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/upload');
    }, [navigate])

    return null;
}

export default Auth
import {useEffect} from "react";
import {useNavigate} from "react-router";

export const meta = () => ([
    { title: 'Resumind | Home' },
    { name: 'description', content: 'AI Resume Analyzer' },
])

const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/upload');
    }, [navigate])

    return null;
}

export default Home
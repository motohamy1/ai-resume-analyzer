import {Link, useNavigate} from "react-router";

const Navbar = () => {
    const navigate = useNavigate();
    
    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <button onClick={() => navigate('/upload')} className="primary-button w-fit">
                ATS Friendly
            </button>
        </nav>
    )
}
export default Navbar
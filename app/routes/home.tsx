import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import {resumes} from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";
import {useEffect} from "react";

export function meta({}: Route.MetaArgs) {


    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/');

    }, [auth.isAuthenticated, next]);
    

  return [
    { title: "Resume Mind" },
    { name: "description", content: "Smart resume analyzer" },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">

      <Navbar />

      <section className="main-section">
          <div className="page-heading py-16">
                <h1>
                    Track your Application & Resume Ratings
                </h1>
                <h2>
                    Review your submissions and check AI-powered feedback.
                </h2>
          </div>
      </section>

      {resumes.length > 0 && (
          <div className='resumes-section'>
          {resumes.map((resume)=>(
                  <ResumeCard key={resume.id} resume={resume} />
          ))}
          </div>
      )}

      </main>
}

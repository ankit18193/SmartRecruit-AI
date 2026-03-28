import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/sideBar';
import { startInterview, submitInterview, getInterview } from '../../services/api';
import {
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const AIInterview = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

 
  React.useEffect(() => {
    const fetchExistingInterview = async () => {
      try {
        setLoading(true);
        const { data } = await getInterview(jobId);
        
        
        if (data && data.status === "Completed") {
          setResult({
            score: data.score,
            strengths: data.evaluation?.strengths || [],
            weaknesses: data.evaluation?.weaknesses || [],
            suggestions: data.evaluation?.suggestions || []
          });
        } else if (data && data.status === "In Progress") {
          
          setInterviewId(data._id);
          setQuestions(data.questions);
        }
      } catch (error) {
        console.log("No previous interview found or error fetching.");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchExistingInterview();
    }
  }, [jobId]);

  
  if (!jobId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 font-bold">Invalid Interview Link</p>
      </div>
    );
  }

  
  const handleError = (error, defaultMessage) => {
    console.error("AI Interview Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      localStorage.clear();
      navigate("/login");
    } else {
      toast.error(error.response?.data?.message || defaultMessage);
    }
  };

  
  const handleStart = async () => {
    try {
      setLoading(true);

      const { data } = await startInterview(jobId);

      if (!data?._id || !data?.questions) {
        return toast.error("Invalid interview session received.");
      }

      setInterviewId(data._id);
      setQuestions(data.questions);

    } catch (error) {
      handleError(error, "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  
  const handleNext = async () => {
    if (!currentAnswer.trim()) {
      return toast.error("Please provide an answer before moving forward.");
    }

    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentIdx === questions.length - 1) {
      submitAllAnswers(newAnswers);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  
  const submitAllAnswers = async (finalAnswers) => {
    if (!interviewId) {
      return toast.error("Interview session lost. Please restart.");
    }

    try {
      setEvaluating(true);

      const { data } = await submitInterview(interviewId, finalAnswers);

      if (!data) {
        return toast.error("Invalid evaluation response.");
      }

      setResult(data);
      toast.success("AI Evaluation Complete!");

    } catch (error) {
      handleError(error, "Evaluation failed. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

 
  const formatAIText = (text) => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center pt-16">

        
        {!questions.length && !loading && !result && (
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg text-center">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
              <Brain size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">
              AI Mock Interview
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Gemini AI has analyzed your resume and the job description.
              You will be asked dynamic technical questions. Ready?
            </p>
            <button
              onClick={handleStart}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-blue-100"
            >
              Start Assessment
            </button>
          </div>
        )}

        
        {loading && (
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-bold animate-pulse">
              AI is working its magic...
            </p>
          </div>
        )}

        
        {questions.length > 0 && !result && !evaluating && (
          <div className="bg-white w-full max-w-3xl p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-blue-600">
                Question {currentIdx + 1} of {questions.length}
              </h3>
              <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-bold text-sm">
                Live Assessment
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-6 leading-relaxed">
              {questions[currentIdx]}
            </h2>

            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your detailed technical answer here..."
              className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-6 text-slate-700"
            ></textarea>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
              >
                {currentIdx === questions.length - 1
                  ? "Submit Interview"
                  : "Next Question"}

                {currentIdx === questions.length - 1
                  ? <Check size={20} />
                  : <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        )}

        
        {evaluating && (
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-bold animate-pulse">
              Gemini AI is evaluating your answers...
            </p>
          </div>
        )}

        
        {result && (
          <div className="w-full max-w-7xl mx-auto flex justify-center pb-20">
            <div className="bg-white w-full max-w-6xl p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in duration-500">

              <div className="text-center mb-10 border-b border-slate-100 pb-8">
                <p className="text-sm text-slate-400 font-black uppercase tracking-widest mb-2">
                  Overall Performance
                </p>
                <h2 className={`text-6xl font-black ${
                  result.score >= 70
                    ? 'text-green-500'
                    : result.score >= 40
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`}>
                  {result.score}%
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                
                <div className="p-6 bg-green-50/50 border border-green-100 rounded-3xl">
                  <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2 border-b border-green-200/50 pb-3">
                    <CheckCircle2 size={20} /> Strengths
                  </h3>
                  {result?.strengths?.length > 0 ? (
                    <ul className="space-y-3">
                      {result.strengths.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 list-disc list-inside">
                          {formatAIText(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No specific strengths highlighted.
                    </p>
                  )}
                </div>

                
                <div className="p-6 bg-red-50/50 border border-red-100 rounded-3xl">
                  <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2 border-b border-red-200/50 pb-3">
                    <AlertCircle size={20} /> Weaknesses
                  </h3>
                  {result?.weaknesses?.length > 0 ? (
                    <ul className="space-y-3">
                      {result.weaknesses.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 list-disc list-inside">
                          {formatAIText(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No major weaknesses found!
                    </p>
                  )}
                </div>

                
                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
                  <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2 border-b border-blue-200/50 pb-3">
                    <TrendingUp size={20} /> Suggestions
                  </h3>
                  {result?.suggestions?.length > 0 ? (
                    <ul className="space-y-3">
                      {result.suggestions.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 list-disc list-inside">
                          {formatAIText(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Keep improving and practicing!
                    </p>
                  )}
                </div>

              </div>

              <div className="mt-10 text-center">
                <button
                  onClick={() => navigate('/my-applications')}
                  className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Back to My Applications 
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AIInterview;
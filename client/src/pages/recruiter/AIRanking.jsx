import React, { useState, useEffect } from 'react';
import { getApplications } from '../../services/api';
import {
  Trophy,
  Loader2,
  Medal,
  Crown,
  User,
  Sparkles,
  ArrowUpRight,
  Target,
  Award
} from 'lucide-react';
import Sidebar from "../../components/common/sideBar";

const AIRanking = () => {

  const [rankedData, setRankedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const { data } = await getApplications();

      if (data?.applications) {
        const sorted = [...data.applications].sort(
          (a, b) => (b.fitmentScore || 0) - (a.fitmentScore || 0)
        );
        setRankedData(sorted);
      } else {
        setRankedData([]);
      }
    } catch (error) {
      console.error("Ranking fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 🏆 HEADER (Standardized) */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI Talent Ranking</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Top global performers identified by neural analysis</p>
            </div>
          </div>
        </header>

        {/* 📊 MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">

            {/* 🏅 Top 3 Podium */}
            {rankedData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end mt-8">
                
                {/* Silver (Rank 2) */}
                {rankedData[1] && (
                  <div className="order-2 md:order-1 transform md:-translate-y-4">
                    <PodiumCard
                      candidate={rankedData[1]}
                      rank={2}
                      theme="silver"
                      icon={<Medal size={28} className="text-gray-400" />}
                    />
                  </div>
                )}

                {/* Gold (Rank 1) */}
                {rankedData[0] && (
                  <div className="order-1 md:order-2 relative z-10">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 drop-shadow-md">
                      <Crown className="text-yellow-500 fill-yellow-500 animate-bounce" size={40} />
                    </div>
                    <PodiumCard
                      candidate={rankedData[0]}
                      rank={1}
                      theme="gold"
                      icon={<Trophy size={32} className="text-yellow-600" />}
                    />
                  </div>
                )}

                {/* Bronze (Rank 3) */}
                {rankedData[2] && (
  <div className="order-3 md:order-3 transform md:-translate-y-8">
    <PodiumCard
      candidate={rankedData[2]}
      rank={3}
      theme="bronze"
      // 🔥 Changed text-amber-600 to a much softer text-orange-300
      icon={<Award size={28} className="text-orange-300" />} 
    />
  </div>

                )}

              </div>
            )}

            {/* 📋 Leaderboard List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
              
              {/* List Header */}
              <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-500" />
                  Global Leaderboard
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                  {rankedData.length} Scanned
                </span>
              </div>

              {/* List Body */}
              <div className="divide-y divide-gray-50">
                {rankedData.length > 0 ? (
                  rankedData.map((c, idx) => {
                    const score = c.fitmentScore || 0;
                    const isTop3 = idx < 3;

                    return (
                      <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-5 hover:bg-blue-50/30 transition-colors group">
                        
                        <div className="flex items-center gap-5 mb-4 sm:mb-0">
                          {/* Rank Number */}
                          <div className={`text-lg font-black w-8 text-center ${isTop3 ? 'text-blue-600' : 'text-gray-300'}`}>
                            #{idx + 1}
                          </div>

                          {/* Candidate Avatar & Info */}
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isTop3 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              <User size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {c.candidateId?.name || "Unknown"}
                              </div>
                              <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <Target size={12} className="text-gray-400" />
                                {c.jobId?.title || "Independent Application"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Score & Progress */}
                        <div className="flex items-center gap-6 sm:pl-0 pl-16">
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end mb-0.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Match Accuracy
                              </span>
                              <ArrowUpRight size={12} className="text-green-500" />
                            </div>
                            <div className="text-xl font-black text-gray-800">
                              {score}%
                            </div>
                          </div>

                          {/* Progress Bar (Hidden on very small screens) */}
                          <div className="hidden md:block w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-gray-400 font-medium flex flex-col items-center gap-3">
                    <Trophy size={40} className="text-gray-200" />
                    No ranking data available yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- PODIUM CARD COMPONENT ---------------- */

const PodiumCard = ({ candidate, rank, theme, icon }) => {
    const score = candidate.fitmentScore || 0;
    
    // 🔥 Muted the bronze theme significantly
    const themes = {
      gold: "border-yellow-200 bg-gradient-to-b from-yellow-50/80 to-white shadow-lg shadow-yellow-100/50",
      silver: "border-gray-200 bg-gradient-to-b from-gray-100/50 to-white shadow-md shadow-gray-100/50",
      bronze: "border-orange-100/50 bg-gradient-to-b from-orange-50/20 to-white shadow-sm"
    };
  
    const textColors = {
      gold: "text-yellow-600",
      silver: "text-gray-500",
      bronze: "text-orange-400" // 🔥 Lighter text color
    };
  
    return (
      <div className={`p-8 rounded-3xl border ${themes[theme]} relative overflow-hidden text-center flex flex-col items-center transition-transform hover:-translate-y-1`}>
        
        {/* Background Accent */}
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          {icon}
        </div>
  
        {/* Rank Badge */}
        <div className="absolute top-4 left-4 text-xs font-black opacity-40">
          #{rank}
        </div>
  
        <div className="mb-4">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-50">
            {icon}
          </div>
        </div>
  
        <h3 className="font-bold text-lg text-gray-900 w-full truncate px-2 mb-1">
          {candidate.candidateId?.name || "Unknown"}
        </h3>
  
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 truncate w-full px-4">
          {candidate.jobId?.title || "Elite Talent"}
        </p>
  
        <div className={`text-4xl font-black ${textColors[theme]}`}>
          {score}%
        </div>
  
        <div className="mt-1.5 text-[9px] font-black uppercase text-gray-300 tracking-widest">
          Neural Fit Score
        </div>
  
      </div>
    );
  };

export default AIRanking;
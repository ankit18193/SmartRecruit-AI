import React, { useState, useEffect } from 'react';
import { getApplications, fetchMyJobs } from '../../services/api';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Loader2,
  Activity,
  Target,
  TrendingUp,
  CalendarDays,
  Filter,
  ArrowRight
} from 'lucide-react';
import Sidebar from "../../components/common/sideBar";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    totalHired: 0,
    totalShortlisted: 0,
    avgScore: 0
  });

  const [trends, setTrends] = useState({
    recentJobs: 0,
    recentApps: 0
  });

  const [chartPoints, setChartPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        fetchMyJobs(),
        getApplications()
      ]);

      const jobs = Array.isArray(jobsRes?.data) ? jobsRes.data : jobsRes?.data?.jobs || [];
      const apps = appsRes?.data?.applications || [];

      
      const hired = apps.filter(a => a.status === 'Hired').length;
      const shortlisted = apps.filter(a => a.status === 'Shortlisted').length;
      const totalScore = apps.reduce((acc, curr) => acc + (curr.fitmentScore || 0), 0);
      const avgScore = apps.length > 0 ? Math.round(totalScore / apps.length) : 0;

      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentJobsCount = jobs.filter(j => new Date(j.createdAt || Date.now()) >= sevenDaysAgo).length;
      const recentAppsCount = apps.filter(a => new Date(a.createdAt || Date.now()) >= sevenDaysAgo).length;

      
      const now = new Date();
      const weeklyCounts = [0, 0, 0, 0]; 
      
      apps.forEach(app => {
        const diffTime = Math.abs(now - new Date(app.createdAt || Date.now()));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 7) weeklyCounts[3]++;
        else if (diffDays <= 14) weeklyCounts[2]++;
        else if (diffDays <= 21) weeklyCounts[1]++;
        else if (diffDays <= 28) weeklyCounts[0]++;
      });

      const maxCount = Math.max(...weeklyCounts, 1); 
      
      
      const dynamicPoints = weeklyCounts.map((val, i) => {
        const x = (i / 3) * 400; 
        const y = 90 - (val / maxCount) * 70; 
        return { x, y, val };
      });

      setChartPoints(dynamicPoints);
      setTrends({ recentJobs: recentJobsCount, recentApps: recentAppsCount });
      setStats({ totalJobs: jobs.length, totalApplicants: apps.length, totalHired: hired, totalShortlisted: shortlisted, avgScore });

    } catch (error) {
      console.error("Analytics fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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

  const conversionRate = stats.totalApplicants > 0 ? Math.round((stats.totalHired / stats.totalApplicants) * 100) : 0;
  const shortlistRate = stats.totalApplicants > 0 ? Math.round((stats.totalShortlisted / stats.totalApplicants) * 100) : 0;

  
  let svgLinePath = "";
  let svgAreaPath = "";
  
  if (chartPoints.length === 4) {
    const p = chartPoints;
    
    svgLinePath = `M${p[0].x},${p[0].y} C${p[0].x + 45},${p[0].y} ${p[1].x - 45},${p[1].y} ${p[1].x},${p[1].y} C${p[1].x + 45},${p[1].y} ${p[2].x - 45},${p[2].y} ${p[2].x},${p[2].y} C${p[2].x + 45},${p[2].y} ${p[3].x - 45},${p[3].y} ${p[3].x},${p[3].y}`;
    svgAreaPath = `${svgLinePath} L400,100 L0,100 Z`;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* 🏆 HEADER */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 shrink-0 shadow-sm z-20 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md shadow-slate-200">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time telemetry of your recruitment pipeline</p>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <KpiCard title="Active Roles" value={stats.totalJobs} icon={<Briefcase />} trend={`+${trends.recentJobs} this week`} color="blue" />
              <KpiCard title="Total Volume" value={stats.totalApplicants} icon={<Users />} trend={`+${trends.recentApps} this week`} color="indigo" />
              <KpiCard title="Shortlisted" value={stats.totalShortlisted} icon={<Target />} trend={`${shortlistRate}% Pass Rate`} color="purple" />
              <KpiCard title="Hired" value={stats.totalHired} icon={<CheckCircle2 />} trend={`${conversionRate}% Conversion`} color="emerald" />
            </div>

            {/* MODERN CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SVG Area Chart (Application Volume Trend) */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Inbound Talent Velocity</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Application volume over 4 weeks</p>
                  </div>
                  <div className="flex items-center gap-2 text-green-500 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                    <TrendingUp size={14} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Live Trend</span>
                  </div>
                </div>

                {/* DYNAMIC SVG AREA CHART */}
                <div className="relative w-full h-48 mt-auto">
                  {chartPoints.length === 4 && (
                    <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity="0.2"/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="colorLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6"/>
                          <stop offset="100%" stopColor="#6366f1"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Dynamic Paths */}
                      <path d={svgAreaPath} fill="url(#colorArea)" />
                      <path 
                        d={svgLinePath} 
                        fill="none" stroke="url(#colorLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                      />
                      
                      {/* Dynamic Points & Tooltips */}
                      {chartPoints.map((pt, i) => (
                        <g key={i} className="group">
                          <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" vectorEffect="non-scaling-stroke" className="transition-all duration-300 group-hover:r-6" />
                          <text x={pt.x} y={pt.y - 12} textAnchor="middle" fontSize="10" fill="#4f46e5" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {pt.val}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}
                  
                  {/* Chart X-Axis Labels */}
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>This Week</span>
                  </div>
                </div>
              </div>

              {/* Radial Progress Chart (Average AI Match) */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-6 left-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">AI Fitment</h3>
                </div>

                <div className="relative w-48 h-48 mt-4 flex items-center justify-center">
                  <RadialGauge score={stats.avgScore} />
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900">{stats.avgScore}%</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Avg Score</span>
                  </div>
                </div>

                <div className="w-full mt-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-xs font-bold text-gray-600">
                    Neural engine indicates a <span className="text-indigo-600 font-black">{stats.avgScore > 75 ? 'High Quality' : stats.avgScore > 50 ? 'Average Quality' : 'Needs Improvement'}</span> talent pool currently active in the pipeline.
                  </p>
                </div>
              </div>

            </div>

            {/* HORIZONTAL FUNNEL (Dynamic Dropoffs) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-8">Conversion Funnel</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                
                <FunnelNode 
                  label="Total Applied" 
                  value={stats.totalApplicants} 
                  color="bg-slate-100 border-slate-200 text-slate-700" 
                  icon={<Users size={16}/>} 
                />
                
                <FunnelConnector rate="100%" dropoff="0" />
                
                <FunnelNode 
                  label="AI Shortlisted" 
                  value={stats.totalShortlisted} 
                  color="bg-blue-50 border-blue-200 text-blue-700" 
                  icon={<Target size={16}/>} 
                />

                <FunnelConnector 
                  rate={`${shortlistRate}%`} 
                  dropoff={stats.totalApplicants - stats.totalShortlisted} 
                />
                
                <FunnelNode 
                  label="Hired" 
                  value={stats.totalHired} 
                  color="bg-emerald-50 border-emerald-200 text-emerald-700" 
                  icon={<CheckCircle2 size={16}/>} 
                />

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MODERN UI COMPONENTS ---------------- */

const KpiCard = ({ title, value, icon, trend, color }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-gray-300 hover:shadow-md transition-all cursor-default">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${colorStyles[color].split(' ')[0]}`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 rounded-2xl ${colorStyles[color]}`}>
          {React.cloneElement(icon, { size: 22, strokeWidth: 2.5 })}
        </div>
        <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
          {trend}
        </span>
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{value}</h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
};

const RadialGauge = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg className="transform -rotate-90 w-full h-full overflow-visible">
      <circle cx="50%" cy="50%" r={radius} stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
      <circle cx="50%" cy="50%" r={radius} stroke="url(#gaugeGradient)" strokeWidth="16" fill="transparent" 
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const FunnelNode = ({ label, value, color, icon }) => (
  <div className={`flex flex-col items-center justify-center p-6 w-full md:w-56 border-2 rounded-3xl relative z-10 ${color}`}>
    <div className="mb-2 bg-white/50 p-2 rounded-xl backdrop-blur-sm">
      {icon}
    </div>
    <span className="text-3xl font-black mb-1">{value}</span>
    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
  </div>
);

const FunnelConnector = ({ rate, dropoff }) => (
  <div className="flex flex-col items-center w-full md:w-auto relative z-0 py-4 md:py-0">
    <div className="hidden md:block w-24 h-0.5 bg-gray-200"></div>
    <div className="md:hidden h-12 w-0.5 bg-gray-200"></div>
    
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm z-10">
      <span className="text-xs font-black text-indigo-600">{rate}</span>
      {dropoff > 0 && <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider">-{dropoff} Drop</span>}
    </div>
  </div>
);

export default Analytics;
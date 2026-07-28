import React from 'react';
import { CallRecord } from '../../types';
import { useLocale } from '../../hooks/useLocale';
import { PieChart as PieChartIcon, Phone, PhoneOff, PhoneCall, CalendarClock, TrendingUp, BarChart3, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useCallListStats } from '../../hooks/useCallListStats';

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

interface CallListStatsProps {
  calls: CallRecord[];
  onExport?: () => void;
}

const COLORS = [
  '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899',
  '#8b5cf6', '#ef4444', '#10b981', '#6366f1'
];

export const CallListStats: React.FC<CallListStatsProps> = ({ calls, onExport }) => {
  const { tr, direction } = useLocale();
  const { historyStats, todayCount, stats } = useCallListStats(calls);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // Chart.js Data configurations
  const doughnutData = {
    labels: stats.macroChartData.map(d => d.name),
    datasets: [
      {
        data: stats.macroChartData.map(d => d.value),
        backgroundColor: stats.macroChartData.map(d => d.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        rtl: direction === 'rtl',
        labels: {
          font: {
            family: 'inherit',
            size: 11,
          },
          usePointStyle: true,
          boxWidth: 8,
        }
      },
      tooltip: {
        titleFont: { family: 'inherit', size: 12 },
        bodyFont: { family: 'inherit', size: 12 },
      }
    },
  };

  const barData = {
    labels: stats.chartData.map(d => d.name),
    datasets: [
      {
        label: tr('تعداد', 'Count'),
        data: stats.chartData.map(d => d.value),
        backgroundColor: stats.chartData.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        titleFont: { family: 'inherit', size: 12 },
        bodyFont: { family: 'inherit', size: 12 },
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { family: 'inherit', size: 11 },
        }
      },
      y: {
        position: direction === 'rtl' ? 'right' as const : 'left' as const,
        grid: {
          display: false,
        },
        ticks: {
          font: { family: 'inherit', size: 11 },
        }
      }
    }
  };

  const lineData = {
    labels: historyStats.map(d => d.jalali_date),
    datasets: [
      {
        label: tr('تعداد تماس‌های کارشناس', 'Expert Call Count'),
        data: historyStats.map(d => d.call_count),
        borderColor: '#4f46e5',
        backgroundColor: '#4f46e5',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        titleFont: { family: 'inherit', size: 12 },
        bodyFont: { family: 'inherit', size: 12 },
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'inherit', size: 11 } }
      },
      y: {
        position: direction === 'rtl' ? 'right' as const : 'left' as const,
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'inherit', size: 11 }, stepSize: 1 }
      }
    }
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-slate-50 dark:bg-[#0f1419] custom-select-scroll" dir={direction}>
      <motion.div
        className="max-w-5xl mx-auto space-y-6 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-[#2b3745]">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#202b38] flex items-center justify-center text-slate-700 dark:text-[#b7c2cf]">
            <PieChartIcon size={22} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-[#f3f5f7]">{tr('آمار جامع لیست', 'List Comprehensive Stats')}</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-[#8e9aaa] mt-1">{tr('وضعیت شماره‌ها و تماس‌های این لیست', 'Status of numbers and calls in this list')}</p>
          </div>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#163326] border border-emerald-200 dark:border-[#2f674b] text-emerald-700 dark:text-[#8de0b5] hover:bg-emerald-50 dark:hover:bg-[#1e4a36] transition-all font-bold shrink-0"
            >
              <FileText size={18} />
              <span>{tr('خروجی اکسل آمار', 'Export Excel')}</span>
            </button>
          )}
        </motion.div>

        {/* Top Cards (Flat Design) */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-indigo-50 dark:bg-[#232142] p-4 border border-indigo-100 dark:border-[#383272] flex flex-col gap-2 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-[#a5b4fc]">
              <TrendingUp size={16} strokeWidth={2} />
              <span className="text-xs font-bold">{tr('کار شده امروز', 'Worked Today')}</span>
            </div>
            <span className="text-2xl font-bold text-indigo-700 dark:text-[#c7d2fe]">{todayCount}</span>
          </div>

          <div className="bg-white dark:bg-[#1c2530] p-4 border border-slate-200 dark:border-[#2b3745] flex flex-col gap-2 rounded-xl">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#8e9aaa]">
              <PhoneCall size={16} strokeWidth={2} />
              <span className="text-xs font-medium">{tr('کل شماره‌ها', 'Total Numbers')}</span>
            </div>
            <span className="text-2xl font-semibold text-slate-800 dark:text-[#f3f5f7]">{stats.total}</span>
          </div>

          <div className="bg-white dark:bg-[#1c2530] p-4 border border-slate-200 dark:border-[#2b3745] flex flex-col gap-2 rounded-xl">
            <div className="flex items-center gap-2 text-teal-600 dark:text-[#7ce3ce]">
              <Phone size={16} strokeWidth={2} />
              <span className="text-xs font-medium">{tr('موفق / پاسخ‌داده', 'Answered')}</span>
            </div>
            <span className="text-2xl font-semibold text-teal-600 dark:text-[#7ce3ce]">{stats.answered}</span>
          </div>

          <div className="bg-white dark:bg-[#1c2530] p-4 border border-slate-200 dark:border-[#2b3745] flex flex-col gap-2 rounded-xl">
            <div className="flex items-center gap-2 text-rose-500 dark:text-[#ff9aa9]">
              <PhoneOff size={16} strokeWidth={2} />
              <span className="text-xs font-medium">{tr('ناموفق / بی‌پاسخ', 'Unanswered')}</span>
            </div>
            <span className="text-2xl font-semibold text-rose-500 dark:text-[#ff9aa9]">{stats.unanswered}</span>
          </div>

          <div className="bg-white dark:bg-[#1c2530] p-4 border border-slate-200 dark:border-[#2b3745] flex flex-col gap-2 rounded-xl">
            <div className="flex items-center gap-2 text-orange-500 dark:text-[#ffc477]">
              <CalendarClock size={16} strokeWidth={2} />
              <span className="text-xs font-medium">{tr('در انتظار پیگیری', 'Follow-ups')}</span>
            </div>
            <span className="text-2xl font-semibold text-orange-500 dark:text-[#ffc477]">{stats.followUps}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Historical Calls Line Chart */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-xl overflow-hidden flex flex-col md:col-span-2">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#344457] flex items-center gap-2">
              <CalendarClock size={18} className="text-indigo-500" strokeWidth={2} />
              <h3 className="font-semibold text-sm text-slate-800 dark:text-[#f3f5f7]">{tr('تاریخچه تماس‌های روزانه شما', 'Your Daily Call History')}</h3>
            </div>
            <div className="p-5 flex-1 min-h-[300px] h-[300px] relative">
              {historyStats.length > 0 ? (
                <Line data={lineData} options={lineOptions} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">{tr('داده‌ای موجود نیست', 'No data')}</div>
              )}
            </div>
          </motion.div>

          {/* Status Breakdown Bar Chart */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#344457] flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-500" strokeWidth={2} />
              <h3 className="font-semibold text-sm text-slate-800 dark:text-[#f3f5f7]">{tr('تفکیک نتایج تماس', 'Call Results Breakdown')}</h3>
            </div>
            <div className="p-5 flex-1 min-h-[300px] h-[300px] relative">
              {stats.chartData.length > 0 ? (
                <Bar data={barData} options={barOptions} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">{tr('داده‌ای موجود نیست', 'No data')}</div>
              )}
            </div>
          </motion.div>

          {/* Macro Donut Chart */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#344457] flex items-center gap-2">
              <PieChartIcon size={18} className="text-teal-500" strokeWidth={2} />
              <h3 className="font-semibold text-sm text-slate-800 dark:text-[#f3f5f7]">{tr('نسبت نتایج کلی', 'Overall Ratio')}</h3>
            </div>
            <div className="p-5 flex-1 min-h-[300px] h-[300px] relative">
              {stats.macroChartData.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">{tr('داده‌ای موجود نیست', 'No data')}</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Detailed Top Courses Table */}
        {stats.topCourses.length > 0 && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c2530] rounded-xl border border-slate-200 dark:border-[#2b3745] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#344457] bg-white dark:bg-[#1c2530] flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500 dark:text-[#a5b4fc]" strokeWidth={2} />
              <h3 className="font-semibold text-sm text-slate-800 dark:text-[#f3f5f7]">{tr('دوره‌های پرطرفدار در این لیست', 'Top Courses in List')}</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-[#202b38] border-b border-slate-100 dark:border-[#344457]">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-medium text-slate-500 dark:text-[#8e9aaa]">{tr('نام دوره', 'Course Name')}</th>
                    <th className="px-5 py-3 text-[11px] font-medium text-slate-500 dark:text-[#8e9aaa] w-24 text-center">{tr('تعداد', 'Count')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#344457]">
                  {stats.topCourses.map((course, idx) => (
                    <tr key={course.name} className="hover:bg-slate-50/50 dark:hover:bg-[#2c3b4d]/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-slate-700 dark:text-[#f3f5f7] flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-[#1e1b4b] text-indigo-600 dark:text-[#a5b4fc] flex items-center justify-center text-[10px]">{idx + 1}</span>
                        {course.name}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-indigo-600 dark:text-[#a5b4fc] text-center">{course.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
};

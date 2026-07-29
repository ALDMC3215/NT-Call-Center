import { useState, useEffect, useMemo } from 'react';
import { CallRecord } from '../types';
import { toJalali } from '../utils/jalali';
import { CALL_STATUSES } from '../constants';
import { useAppContext } from './useAppContext';
import { useLocale } from './useLocale';

export function useCallListStats(calls: CallRecord[]) {
  const { getMyDailyStats, profile } = useAppContext();
  const { tr, valueLabel } = useLocale();
  const [historyStats, setHistoryStats] = useState<Array<{ jalali_date: string; call_count: number }>>([]);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    getMyDailyStats().then(setHistoryStats).catch(console.error);
  }, [getMyDailyStats]);

  useEffect(() => {
    if (!profile) return;
    const todayStr = toJalali();
    const key = `novintech_daily_worked_${profile.sessionId}_${todayStr}`;
    
    const updateCount = () => {
      const saved = localStorage.getItem(key);
      if (saved) {
        setTodayCount(parseInt(saved, 10));
      } else {
        const count = calls.filter(c => c.callStatus && c.updatedAt && toJalali(c.updatedAt) === todayStr).length;
        setTodayCount(count);
        localStorage.setItem(key, count.toString());
      }
    };
    
    updateCount();
    
    const handleEvent = () => updateCount();
    window.addEventListener('daily_worked_updated', handleEvent);
    return () => window.removeEventListener('daily_worked_updated', handleEvent);
  }, [profile, calls.length === 0]); // only run initially or when calls loaded

  const stats = useMemo(() => {
    const total = calls.length;
    let answered = 0;
    let unanswered = 0;
    let followUps = 0;
    let noStatus = 0;
    let registeredCount = 0;

    const statusCounts: Record<string, number> = {};
    const courseCounts: Record<string, number> = {};

    CALL_STATUSES.forEach(s => {
      statusCounts[s] = 0;
    });

    calls.forEach(c => {
      if (c.isFollowUp) followUps++;
      if (!c.callStatus) {
        noStatus++;
      } else {
        statusCounts[c.callStatus] = (statusCounts[c.callStatus] || 0) + 1;
        if (c.callStatus === 'ثبت نام کرد') registeredCount++;
        
        if (['مردد', 'ثبت نام کرد', 'علاقه مند', 'مشاوره حضوری'].includes(c.callStatus)) {
          answered++;
        } else {
          unanswered++;
        }
      }

      if (c.interestedCourse) {
        courseCounts[c.interestedCourse] = (courseCounts[c.interestedCourse] || 0) + 1;
      }
    });

    const chartData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: valueLabel(status),
        value: count
      }));

    if (noStatus > 0) {
      chartData.unshift({ name: tr('ثبت نشده', 'Unresulted'), value: noStatus });
    }

    const topCourses = Object.entries(courseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([course, count]) => ({
        name: course,
        value: count
      }));

    const macroChartData = [
      { name: tr('موفق / پاسخ‌داده', 'Answered'), value: answered, color: '#14b8a6' },
      { name: tr('ناموفق / بی‌پاسخ', 'Unanswered'), value: unanswered, color: '#f43f5e' },
      { name: tr('در انتظار پیگیری', 'Follow-ups'), value: followUps, color: '#f97316' },
      { name: tr('ثبت نشده (خام)', 'Unresulted'), value: noStatus, color: '#94a3b8' },
      { name: tr('ثبت نامی‌های کارشناسی', 'Registered'), value: registeredCount, color: '#8b5cf6' }
    ].filter(d => d.value > 0);

    return { total, answered, unanswered, followUps, noStatus, registeredCount, chartData, topCourses, macroChartData };
  }, [calls, valueLabel, tr]);

  return { historyStats, todayCount, stats };
}

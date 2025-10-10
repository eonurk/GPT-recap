const state = {
  slides: [],
  chartInstances: [],
  chartPalette: ['#60a5fa', '#a855f7', '#34d399', '#f97316', '#facc15'],
  chartDefaultsSet: false,
};

const fileInput = document.getElementById('file-input');
const storyContainer = document.getElementById('story-container');
const storyRail = document.getElementById('story-rail');
const storyProgress = document.getElementById('story-progress');
const downloadBtn = document.getElementById('download-slide');
const shareBtn = document.getElementById('share-slide');
const loadingBanner = document.getElementById('loading');
const errorBanner = document.getElementById('error');

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  resetUI();

  try {
    setLoading(true);
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error('File does not look like a conversations export (expected an array).');
    }

    const messages = flattenMessages(data);
    if (!messages.length) {
      throw new Error('No messages found in conversations.');
    }

    const analysis = analyse(messages);
    renderStory(analysis);
    setLoading(false);
    storyContainer.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    setLoading(false);
    showError(error instanceof Error ? error.message : 'Failed to read conversations file.');
  }
});

downloadBtn.addEventListener('click', () => saveSlide());
shareBtn.addEventListener('click', () => shareSlide());

function resetUI() {
  storyContainer.classList.add('hidden');
  storyRail.innerHTML = '';
  storyProgress.innerHTML = '';
  destroyCharts();
  state.slides = [];
  errorBanner.classList.add('hidden');
}

function setLoading(isLoading) {
  loadingBanner.classList.toggle('hidden', !isLoading);
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove('hidden');
}

function flattenMessages(conversations) {
  const rows = [];

  conversations.forEach((conversation, idx) => {
    const mapping = conversation.mapping || {};
    const convId = conversation.id || `conversation_${idx.toString().padStart(4, '0')}`;
    const title = conversation.title || 'Untitled';

    Object.values(mapping).forEach((node) => {
      const message = node?.message;
      if (!message) return;

      const content = message.content || {};
      const text = extractText(content);
      const createTime = typeof message.create_time === 'number' ? new Date(message.create_time * 1000) : null;
      const role = message.author?.role || 'unknown';

      rows.push({
        conversationIndex: idx,
        conversationId: convId,
        conversationTitle: title,
        role,
        createTime,
        contentType: content.content_type || 'text',
        hasCode: content.content_type === 'code',
        isMultimodal: content.content_type === 'multimodal_text',
        text,
        wordCount: text ? (text.toLowerCase().match(/[a-z0-9']+/g)?.length || 0) : 0,
        charCount: text.length,
      });
    });
  });

  return rows;
}

function extractText(content) {
  if (!content) return '';
  const parts = content.parts || [];
  const lines = [];
  const textualTypes = new Set([
    'text',
    'code',
    'reasoning_recap',
    'thoughts',
    'execution_output',
    'tether_browsing_display',
    'system_error',
    'computer_output',
    'sonic_webpage',
    'tether_quote',
  ]);

  if (textualTypes.has(content.content_type)) {
    parts.forEach((part) => {
      if (typeof part === 'string') lines.push(part);
      else if (part && typeof part === 'object') {
        if (typeof part.text === 'string') lines.push(part.text);
        else if (typeof part.title === 'string') lines.push(part.title);
      }
    });
  } else if (content.content_type === 'multimodal_text') {
    parts.forEach((part) => {
      if (typeof part === 'string') {
        lines.push(part);
      } else if (part && typeof part === 'object') {
        const type = part.content_type;
        if (type === 'text' && typeof part.text === 'string') lines.push(part.text);
        if (type === 'audio_transcription' && typeof part.transcript === 'string') lines.push(part.transcript);
      }
    });
  } else if (content.content_type === 'user_editable_context') {
    if (content.user_instructions) lines.push(content.user_instructions);
  }

  return lines.filter(Boolean).join('\n');
}

function analyse(messages) {
  const conversationMap = new Map();
  const roleCounts = new Map();
  const dailyCounts = new Map();
  const monthlyCounts = new Map();
  const monthlyRoleCounts = new Map();
  const assistantDaily = new Map();
  const assistantMonthly = new Map();
  const hourCounts = Array(24).fill(0);
  const weekdayCounts = Array(7).fill(0);

  messages.forEach((msg) => {
    roleCounts.set(msg.role, (roleCounts.get(msg.role) || 0) + 1);

    const conv = conversationMap.get(msg.conversationId) || {
      title: msg.conversationTitle,
      messages: 0,
      userMessages: 0,
      assistantMessages: 0,
      toolMessages: 0,
      systemMessages: 0,
      wordsUser: 0,
      wordsAssistant: 0,
      hasTool: false,
      hasCode: false,
      firstTime: null,
      lastTime: null,
    };

    conv.messages += 1;
    if (msg.role === 'user') {
      conv.userMessages += 1;
      conv.wordsUser += msg.wordCount;
    } else if (msg.role === 'assistant') {
      conv.assistantMessages += 1;
      conv.wordsAssistant += msg.wordCount;
    } else if (msg.role === 'tool') {
      conv.toolMessages += 1;
      conv.hasTool = true;
    } else if (msg.role === 'system') {
      conv.systemMessages += 1;
    }

    if (msg.hasCode) conv.hasCode = true;

    if (msg.createTime instanceof Date && !Number.isNaN(msg.createTime.getTime())) {
      if (!conv.firstTime || msg.createTime < conv.firstTime) conv.firstTime = msg.createTime;
      if (!conv.lastTime || msg.createTime > conv.lastTime) conv.lastTime = msg.createTime;

      const dayKey = dateKey(msg.createTime);
      dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);

      const monthKey = monthKeyFromDate(msg.createTime);
      monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);
      const mrKey = `${monthKey}|${msg.role}`;
      monthlyRoleCounts.set(mrKey, (monthlyRoleCounts.get(mrKey) || 0) + 1);

      const hour = msg.createTime.getHours();
      const weekday = msg.createTime.getDay();
      hourCounts[hour] += 1;
      weekdayCounts[weekday] += 1;

      if (msg.role === 'assistant') {
        const daily = assistantDaily.get(dayKey) || { words: 0, chars: 0, count: 0 };
        daily.words += msg.wordCount;
        daily.chars += msg.charCount;
        daily.count += 1;
        assistantDaily.set(dayKey, daily);

        const monthly = assistantMonthly.get(monthKey) || { words: 0, chars: 0, count: 0 };
        monthly.words += msg.wordCount;
        monthly.chars += msg.charCount;
        monthly.count += 1;
        assistantMonthly.set(monthKey, monthly);
      }
    }

    conversationMap.set(msg.conversationId, conv);
  });

  const conversationSummaries = Array.from(conversationMap.values());
  const { context, chartData } = buildContext({
    conversationSummaries,
    messagesByRole: roleCounts,
    dailyCounts,
    monthlyCounts,
    monthlyRoleCounts,
    assistantDaily,
    assistantMonthly,
    hourCounts,
    weekdayCounts,
  });

  return { context, chartData };
}

function buildContext({
  conversationSummaries,
  messagesByRole,
  dailyCounts,
  monthlyCounts,
  monthlyRoleCounts,
  assistantDaily,
  assistantMonthly,
  hourCounts,
  weekdayCounts,
}) {
  const conversationCount = conversationSummaries.length;
  const messageCountTotal = Array.from(messagesByRole.values()).reduce((sum, val) => sum + val, 0);

  const sortedDaily = Array.from(dailyCounts.entries())
    .map(([key, value]) => ({ key, value, date: new Date(key) }))
    .filter((item) => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const activeDays = sortedDaily.length;
  const avgMessages = sortedDaily.length ? sortedDaily.reduce((sum, item) => sum + item.value, 0) / sortedDaily.length : 0;
  const busiestDay = sortedDaily.reduce((best, item) => (item.value > (best?.value || 0) ? item : best), null);
  const latestDate = sortedDaily.length ? sortedDaily[sortedDaily.length - 1].date : null;

  const streakInfo = computeStreaks(sortedDaily.map((item) => item.date));

  const sortedMonthly = Array.from(monthlyCounts.entries())
    .map(([key, value]) => ({ key, value, date: monthToDate(key) }))
    .filter((item) => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const peakMonth = sortedMonthly.reduce((best, item) => (item.value > (best?.value || 0) ? item : best), null);
  const quietMonth = sortedMonthly.reduce((best, item) => (item.value < (best?.value ?? Infinity) ? item : best), null);

  const assistantShare = computeShare(messagesByRole, 'assistant');
  const userShare = computeShare(messagesByRole, 'user');

  const conversationCategories = classifyConversations(conversationSummaries);

  const toolShare = fractionToPercent(conversationSummaries.filter((c) => c.hasTool).length, conversationCount);
  const codeShare = fractionToPercent(conversationSummaries.filter((c) => c.hasCode).length, conversationCount);

  const topConversation = conversationSummaries.reduce((best, item) => (item.messages > (best?.messages || 0) ? item : best), null);

  const assistantMonthlyStats = Array.from(assistantMonthly.entries())
    .map(([key, value]) => ({
      key,
      date: monthToDate(key),
      meanWord: value.count ? value.words / value.count : 0,
    }))
    .filter((item) => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const assistantPeak = assistantMonthlyStats.reduce((best, item) => (item.meanWord > (best?.meanWord || 0) ? item : best), null);
  const assistantLow = assistantMonthlyStats.reduce((best, item) => (item.meanWord < (best?.meanWord ?? Infinity) ? item : best), null);

  const assistantDailyStats = Array.from(assistantDaily.entries())
    .map(([key, value]) => ({
      key,
      date: new Date(key),
      meanWord: value.count ? value.words / value.count : 0,
      meanChar: value.count ? value.chars / value.count : 0,
    }))
    .filter((item) => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const latestRolling = computeRollingAverage(assistantDailyStats.map((item) => item.meanWord), 30);
  const latestRollingChars = computeRollingAverage(assistantDailyStats.map((item) => item.meanChar), 30);

  const chartData = buildChartData({
    sortedMonthly,
    monthlyRoleCounts,
    messagesByRole,
    sortedDaily,
    assistantDailyStats,
    hourCounts,
    weekdayCounts,
  });

  const context = {
    first_date: streakInfo.firstDate ? formatDateLabel(streakInfo.firstDate) : '—',
    last_date: latestDate ? formatDateLabel(latestDate) : '—',
    conversation_count: formatInteger(conversationCount),
    message_count: formatInteger(messageCountTotal),
    active_days: formatInteger(activeDays),
    avg_messages_per_active_day: formatNumber(avgMessages),
    peak_month_label: peakMonth ? formatMonthLabel(peakMonth.date) : '—',
    peak_month_value: peakMonth ? formatInteger(peakMonth.value) : '—',
    quiet_month_label: quietMonth ? formatMonthLabel(quietMonth.date) : '—',
    quiet_month_value: quietMonth ? formatInteger(quietMonth.value) : '—',
    busiest_day_label: busiestDay ? formatDateLabel(busiestDay.date) : '—',
    busiest_day_value: busiestDay ? formatInteger(busiestDay.value) : '—',
    longest_streak_length: formatInteger(streakInfo.longestStreakLength),
    longest_streak_range: streakInfo.longestStreakLabel,
    longest_gap_length: formatInteger(streakInfo.longestGapLength),
    longest_gap_range: streakInfo.longestGapLabel,
    assistant_share: assistantShare,
    user_share: userShare,
    deep_share: formatPercent(conversationCategories.deep),
    short_share: formatPercent(conversationCategories.short),
    one_share: formatPercent(conversationCategories.one),
    tool_share: toolShare,
    code_share: codeShare,
    top_conversation_title: topConversation?.title || '—',
    top_conversation_messages: topConversation ? formatInteger(topConversation.messages) : '—',
    assistant_peak_label: assistantPeak ? formatMonthLabel(assistantPeak.date) : '—',
    assistant_peak_words: assistantPeak ? formatNumber(assistantPeak.meanWord) : '—',
    assistant_low_label: assistantLow ? formatMonthLabel(assistantLow.date) : '—',
    assistant_low_words: assistantLow ? formatNumber(assistantLow.meanWord) : '—',
    latest_word_avg: latestRolling ? formatNumber(latestRolling) : '—',
    latest_char_avg: latestRollingChars ? formatInteger(Math.round(latestRollingChars)) : '—',
  };

  return { context, chartData };
}

function buildChartData({ sortedMonthly, monthlyRoleCounts, messagesByRole, sortedDaily, assistantDailyStats, hourCounts, weekdayCounts }) {
  const monthLabels = sortedMonthly.map((item) => formatMonthLabel(item.date));
  const roles = Array.from(messagesByRole.keys()).filter((role) => ['assistant', 'user', 'tool', 'system'].includes(role));

  const monthlyRoleDatasets = roles.map((role, idx) => {
    const data = monthLabels.map((_, i) => {
      const monthKey = sortedMonthly[i].key;
      const key = `${monthKey}|${role}`;
      return monthlyRoleCounts.get(key) || 0;
    });
    const color = state.chartPalette[idx % state.chartPalette.length];
    return {
      label: role,
      data,
      fill: false,
      borderColor: color,
      backgroundColor: color,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
    };
  });

  const cumulativeLabels = sortedDaily.map((item) => formatDateLabel(item.date));
  let running = 0;
  const cumulativeData = sortedDaily.map((item) => {
    running += item.value;
    return running;
  });

  const assistantTrendLabels = assistantDailyStats.map((item) => formatDateLabel(item.date));
  const assistantTrendData = assistantDailyStats.map((item) => item.meanWord);

  const hourLabels = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`);
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  const weekdayData = weekdayOrder.map((day) => weekdayCounts[day] || 0);

  return {
    monthlyRole: {
      type: 'line',
      data: { labels: monthLabels, datasets: monthlyRoleDatasets },
      options: {
        responsive: true,
        scales: {
          y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          x: { ticks: { color: '#cbd5f5' }, grid: { display: false } },
        },
        plugins: {
          legend: { labels: { color: '#e2e8f0' } },
        },
      },
    },
    cumulativeMessages: {
      type: 'line',
      data: {
        labels: cumulativeLabels,
        datasets: [
          {
            label: 'Messages',
            data: cumulativeData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.3)',
            tension: 0.35,
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          x: { ticks: { color: '#cbd5f5', autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    },
    assistantTrend: {
      type: 'line',
      data: {
        labels: assistantTrendLabels,
        datasets: [
          {
            label: 'Words per reply',
            data: assistantTrendData,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.3)',
            tension: 0.3,
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          x: { ticks: { color: '#cbd5f5', autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    },
    hourlyActivity: {
      type: 'bar',
      data: {
        labels: hourLabels,
        datasets: [
          {
            label: 'Messages',
            data: hourCounts,
            backgroundColor: hourLabels.map((_, idx) => `rgba(96, 165, 250, ${0.25 + (idx / 24) * 0.6})`),
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          x: { ticks: { color: '#cbd5f5', maxRotation: 60, minRotation: 60 }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    },
    weekdayActivity: {
      type: 'bar',
      data: {
        labels: weekdayOrder.map((day) => weekdayLabel(day)),
        datasets: [
          {
            label: 'Messages',
            data: weekdayData,
            backgroundColor: 'rgba(129, 140, 248, 0.55)',
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: { ticks: { color: '#cbd5f5' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          y: { ticks: { color: '#cbd5f5' }, grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    },
  };
}

function weekdayLabel(dayIndex) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
}

function classifyConversations(conversations) {
  let deep = 0;
  let short = 0;
  let one = 0;

  conversations.forEach((conv) => {
    if (conv.userMessages === 1 && conv.assistantMessages === 1) {
      one += 1;
    } else if (conv.userMessages <= 3) {
      short += 1;
    } else {
      deep += 1;
    }
  });

  const total = conversations.length || 1;
  return {
    deep: deep / total,
    short: short / total,
    one: one / total,
  };
}

function computeShare(map, role) {
  const total = Array.from(map.values()).reduce((sum, val) => sum + val, 0);
  if (!total) return '—';
  return formatPercent((map.get(role) || 0) / total);
}

function computeRollingAverage(values, window) {
  if (!values.length) return null;
  const slice = values.slice(-window);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / slice.length;
}

function computeStreaks(dates) {
  if (!dates.length) {
    return {
      longestStreakLength: 0,
      longestStreakLabel: '—',
      longestGapLength: 0,
      longestGapLabel: '—',
      firstDate: null,
    };
  }

  const sorted = [...dates].sort((a, b) => a - b);
  let bestLen = 1;
  let bestStart = sorted[0];
  let bestEnd = sorted[0];
  let currentLen = 1;
  let currentStart = sorted[0];

  sorted.slice(1).forEach((date, idx) => {
    const prev = sorted[idx];
    if (date.getTime() === prev.getTime() + 86400000) {
      currentLen += 1;
    } else {
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
        bestEnd = prev;
      }
      currentLen = 1;
      currentStart = date;
    }
  });

  if (currentLen > bestLen) {
    bestLen = currentLen;
    bestStart = currentStart;
    bestEnd = sorted[sorted.length - 1];
  }

  let longestGapLength = 0;
  let longestGapStart = null;
  let longestGapEnd = null;

  sorted.slice(1).forEach((date, idx) => {
    const prev = sorted[idx];
    const diff = Math.round((date - prev) / 86400000) - 1;
    if (diff > longestGapLength) {
      longestGapLength = diff;
      longestGapStart = new Date(prev.getTime() + 86400000);
      longestGapEnd = new Date(date.getTime() - 86400000);
    }
  });

  return {
    longestStreakLength: bestLen,
    longestStreakLabel: bestLen > 1 ? `${formatDateLabel(bestStart)} — ${formatDateLabel(bestEnd)}` : formatDateLabel(bestStart),
    longestGapLength,
    longestGapLabel: longestGapLength > 0 && longestGapStart && longestGapEnd
      ? `${formatDateLabel(longestGapStart)} — ${formatDateLabel(longestGapEnd)}`
      : '—',
    firstDate: sorted[0],
  };
}

function formatDateLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatInteger(value) {
  if (Number.isNaN(value) || value === null || value === undefined) return '—';
  return Intl.NumberFormat().format(Math.round(value));
}

function formatNumber(value) {
  if (Number.isNaN(value) || value === null || value === undefined) return '—';
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function formatPercent(value) {
  if (Number.isNaN(value) || value === null || value === undefined) return '—';
  return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function fractionToPercent(num, den) {
  if (!den) return '—';
  return formatPercent(num / den);
}

function dateKey(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function monthToDate(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function renderStory({ context, chartData }) {
  destroyCharts();
  state.slides = [];
  storyRail.innerHTML = '';
  storyProgress.innerHTML = '';

  const slides = [
    {
      tag: 'Recap',
      title: `${context.first_date} → ${context.last_date}`,
      body: `${context.conversation_count} conversations • ${context.message_count} messages • ${context.active_days} active days. Avg ${context.avg_messages_per_active_day} messages when you checked in.`,
      stats: [
        { label: `Peak month — ${context.peak_month_label}`, value: context.peak_month_value },
        { label: `Quiet month — ${context.quiet_month_label}`, value: context.quiet_month_value },
        { label: `Busiest day — ${context.busiest_day_label}`, value: context.busiest_day_value },
        { label: `Longest streak — ${context.longest_streak_range}`, value: context.longest_streak_length },
      ],
      chart: null,
      footer: 'Swipe or tap to keep the vibe • gpt-recap',
    },
    {
      tag: 'Collab energy',
      title: 'Who drives the chat?',
      body: `Assistant ${context.assistant_share} • You ${context.user_share} • Tools in ${context.tool_share} of sessions • Code in ${context.code_share}.`,
      stats: [
        { label: 'Deep dives', value: context.deep_share },
        { label: 'Quick loops', value: context.short_share },
        { label: 'One & done', value: context.one_share },
        { label: `Biggest convo: ${context.top_conversation_title}`, value: context.top_conversation_messages },
      ],
      chart: chartData.monthlyRole,
      footer: 'Tag who owes the next prompt.',
    },
    {
      tag: 'Momentum',
      title: 'Streaks & pauses',
      body: `Longest streak ${context.longest_streak_length} days (${context.longest_streak_range}). Longest pause ${context.longest_gap_length} days (${context.longest_gap_range}).`,
      stats: [
        { label: `Messages on ${context.busiest_day_label}`, value: context.busiest_day_value },
        { label: `Wordiest month — ${context.assistant_peak_label}`, value: context.assistant_peak_words },
      ],
      chart: chartData.cumulativeMessages,
      footer: 'Proof you kept building.',
    },
    {
      tag: 'Reply craft',
      title: 'Length of the assists',
      body: `Peaks reached ${context.assistant_peak_words} words (${context.assistant_peak_label}). Low tide ${context.assistant_low_words} (${context.assistant_low_label}). Latest 30-day avg ${context.latest_word_avg} words / ${context.latest_char_avg} characters.`,
      stats: null,
      chart: chartData.assistantTrend,
      footer: 'Keep the bars flowing.',
    },
    {
      tag: 'When it happens',
      title: 'Your prime hours',
      body: 'Mornings → afternoons carried the energy, with late-night check-ins after dark. Screenshot and drop it in your story.',
      stats: null,
      chart: chartData.hourlyActivity,
      footer: `Last update: ${context.last_date}`,
    },
    {
      tag: 'Weekly cadence',
      title: 'Where the buzz lands',
      body: 'A quick read on which days GPT had your back the most.',
      stats: null,
      chart: chartData.weekdayActivity,
      footer: 'Share your grind with the crew.',
    },
  ];

  slides.forEach((definition, idx) => {
    const { element, canvas } = createSlide(definition, idx);
    storyRail.appendChild(element);
    state.slides.push({ element, canvas, chartConfig: definition.chart });

    const dot = document.createElement('span');
    dot.className = 'dot' + (idx === 0 ? ' active' : '');
    dot.addEventListener('click', () => scrollToSlide(idx));
    storyProgress.appendChild(dot);

    if (canvas && definition.chart) {
      renderChart(canvas, definition.chart);
    }
  });

  if (!renderStory.initialised) {
    storyRail.addEventListener('scroll', onRailScroll, { passive: true });
    renderStory.initialised = true;
  }

  storyRail.scrollTop = 0;
  updateDots(0);
}

function createSlide(definition, index) {
  const slide = document.createElement('article');
  slide.className = 'slide';
  if (index === 1) slide.classList.add('theme-2');
  if (index === 2) slide.classList.add('theme-3');
  if (index === 3) slide.classList.add('theme-4');
  if (index === 4) slide.classList.add('theme-5');
  if (index === 5) slide.classList.add('theme-6');

  const wrapper = document.createElement('div');
  wrapper.className = 'content';

  const tagEl = document.createElement('span');
  tagEl.className = 'tag';
  tagEl.textContent = definition.tag;

  const titleEl = document.createElement(index === 0 ? 'h1' : 'h2');
  titleEl.textContent = definition.title;

  const bodyEl = document.createElement('p');
  bodyEl.textContent = definition.body;

  wrapper.append(tagEl, titleEl, bodyEl);

  if (definition.stats?.length) {
    const statsEl = document.createElement('div');
    statsEl.className = 'stats';
    definition.stats.forEach((item) => {
      const stat = document.createElement('div');
      stat.className = 'stat';
      const value = document.createElement('span');
      value.className = 'value';
      value.textContent = item.value;
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = item.label;
      stat.append(value, label);
      statsEl.appendChild(stat);
    });
    wrapper.appendChild(statsEl);
  }

  let canvas = null;
  if (definition.chart) {
    const chartWrap = document.createElement('div');
    chartWrap.className = 'visual';
    canvas = document.createElement('canvas');
    chartWrap.appendChild(canvas);
    wrapper.appendChild(chartWrap);
  }

  if (definition.footer) {
    const footer = document.createElement('footer');
    footer.textContent = definition.footer;
    wrapper.appendChild(footer);
  }

  slide.appendChild(wrapper);
  return { element: slide, canvas };
}

function renderChart(canvas, config) {
  if (!window.Chart) return;
  const ctx = canvas.getContext('2d');
  if (!state.chartDefaultsSet) {
    // eslint-disable-next-line no-undef
    Chart.defaults.color = '#e2e8f0';
    // eslint-disable-next-line no-undef
    Chart.defaults.font.family = 'Manrope, Helvetica Neue, Arial, sans-serif';
    state.chartDefaultsSet = true;
  }
  // eslint-disable-next-line no-undef
  const chart = new Chart(ctx, config);
  state.chartInstances.push(chart);
}

function destroyCharts() {
  state.chartInstances.forEach((chart) => chart.destroy());
  state.chartInstances = [];
}

function onRailScroll() {
  cancelAnimationFrame(onRailScroll._raf);
  onRailScroll._raf = requestAnimationFrame(() => updateDots(currentSlideIndex()));
}

function currentSlideIndex() {
  if (!state.slides.length) return 0;
  const railRect = storyRail.getBoundingClientRect();
  let bestIndex = 0;
  let minDiff = Infinity;
  state.slides.forEach((slide, idx) => {
    const rect = slide.element.getBoundingClientRect();
    const diff = Math.abs(rect.top + rect.height / 2 - (railRect.top + railRect.height / 2));
    if (diff < minDiff) {
      minDiff = diff;
      bestIndex = idx;
    }
  });
  return bestIndex;
}

function updateDots(activeIndex) {
  Array.from(storyProgress.children).forEach((dot, idx) => {
    dot.classList.toggle('active', idx === activeIndex);
  });
}

function scrollToSlide(idx) {
  const entry = state.slides[idx];
  if (!entry) return;
  entry.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function saveSlide() {
  const entry = state.slides[currentSlideIndex()];
  if (!entry) return;
  html2canvas(entry.element, { backgroundColor: null, scale: 3 }).then((canvas) => {
    const link = document.createElement('a');
    link.download = `gpt-recap-slide-${state.slides.indexOf(entry) + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

function shareSlide() {
  const entry = state.slides[currentSlideIndex()];
  if (!entry) return;
  html2canvas(entry.element, { backgroundColor: null, scale: 3 }).then((canvas) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        saveSlide();
        return;
      }
      const file = new File([blob],`gpt-recap-slide-${state.slides.indexOf(entry)+1}.png`,{ type:'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'GPT Recap', text: 'My ChatGPT recap' }).catch(saveSlide);
      } else {
        saveSlide();
      }
    }, 'image/png');
  });
}
